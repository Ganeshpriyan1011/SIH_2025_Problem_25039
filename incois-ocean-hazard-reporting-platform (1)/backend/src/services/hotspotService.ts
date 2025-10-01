// Using relative import to avoid module resolution issues
interface Report {
  id: string;
  hazard: string;
  location: { lat: number; lng: number; name: string };
  timestamp: Date;
  isVerified: boolean;
}

enum HazardType {
  Tsunami = 'tsunami',
  Cyclone = 'cyclone',
  Flooding = 'flooding',
  StormSurge = 'storm_surge',
  Earthquake = 'earthquake',
  CoastalErosion = 'coastal_erosion'
}
import { logger } from '../utils/logger';
import { SocialMediaAnalysis } from './nlpService';

export interface HotspotData {
  id: string;
  center: { lat: number; lng: number };
  radius: number; // in kilometers
  intensity: number; // 1-10 scale
  hazardType: HazardType;
  reportCount: number;
  verifiedReports: number;
  socialMediaMentions: number;
  lastUpdated: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedPopulation?: number;
  earlyWarningIssued: boolean;
  reports: string[]; // Report IDs
  socialMediaPosts: string[]; // Post IDs
}

export interface HotspotConfig {
  minReportsForHotspot: number;
  maxRadius: number;
  decayFactor: number; // How quickly hotspots fade over time
  socialMediaWeight: number; // Weight of social media vs official reports
  verificationBonus: number; // Bonus for verified reports
}

class HotspotService {
  private config: HotspotConfig = {
    minReportsForHotspot: 2,
    maxRadius: 50, // 50km
    decayFactor: 0.1, // 10% decay per hour
    socialMediaWeight: 0.3,
    verificationBonus: 2.0
  };

  private activeHotspots: Map<string, HotspotData> = new Map();

  /**
   * Generate hotspots from reports and social media data
   */
  public generateHotspots(
    reports: Report[], 
    socialMediaAnalyses: Array<{id: string, analysis: SocialMediaAnalysis, location?: {lat: number, lng: number}}>
  ): HotspotData[] {
    // Clear old hotspots and apply decay
    this.applyDecay();

    // Group reports by location clusters
    const reportClusters = this.clusterReportsByLocation(reports);
    
    // Group social media by location clusters
    const socialMediaClusters = this.clusterSocialMediaByLocation(socialMediaAnalyses);

    // Generate hotspots from clusters
    const newHotspots: HotspotData[] = [];

    // Process report clusters
    for (const cluster of reportClusters) {
      const hotspot = this.createHotspotFromReports(cluster);
      if (hotspot) {
        newHotspots.push(hotspot);
      }
    }

    // Merge social media data into existing hotspots or create new ones
    for (const cluster of socialMediaClusters) {
      const nearbyHotspot = this.findNearbyHotspot(cluster.center, newHotspots);
      if (nearbyHotspot) {
        this.mergeSocialMediaIntoHotspot(nearbyHotspot, cluster);
      } else {
        const socialHotspot = this.createHotspotFromSocialMedia(cluster);
        if (socialHotspot) {
          newHotspots.push(socialHotspot);
        }
      }
    }

    // Update active hotspots
    for (const hotspot of newHotspots) {
      this.activeHotspots.set(hotspot.id, hotspot);
    }

    // Calculate risk levels and early warning triggers
    this.calculateRiskLevels(newHotspots);

    logger.info(`Generated ${newHotspots.length} hotspots`);
    return Array.from(this.activeHotspots.values());
  }

  /**
   * Cluster reports by geographic proximity
   */
  private clusterReportsByLocation(reports: Report[]): Array<{
    center: {lat: number, lng: number},
    reports: Report[],
    hazardType: HazardType
  }> {
    const clusters: Array<{
      center: {lat: number, lng: number},
      reports: Report[],
      hazardType: HazardType
    }> = [];

    const processedReports = new Set<string>();

    for (const report of reports) {
      if (processedReports.has(report.id)) continue;

      const cluster = {
        center: { lat: report.location.lat, lng: report.location.lng },
        reports: [report],
        hazardType: report.hazard as any
      };

      processedReports.add(report.id);

      // Find nearby reports of the same hazard type
      for (const otherReport of reports) {
        if (processedReports.has(otherReport.id)) continue;
        if (otherReport.hazard !== report.hazard) continue;

        const distance = this.calculateDistance(
          report.location.lat, report.location.lng,
          otherReport.location.lat, otherReport.location.lng
        );

        if (distance <= this.config.maxRadius) {
          cluster.reports.push(otherReport);
          processedReports.add(otherReport.id);
          
          // Update cluster center (centroid)
          cluster.center = this.calculateCentroid(cluster.reports.map(r => r.location));
        }
      }

      if (cluster.reports.length >= this.config.minReportsForHotspot) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Cluster social media posts by location
   */
  private clusterSocialMediaByLocation(
    socialMediaAnalyses: Array<{id: string, analysis: SocialMediaAnalysis, location?: {lat: number, lng: number}}>
  ): Array<{
    center: {lat: number, lng: number},
    posts: Array<{id: string, analysis: SocialMediaAnalysis}>,
    hazardType: string
  }> {
    const clusters: Array<{
      center: {lat: number, lng: number},
      posts: Array<{id: string, analysis: SocialMediaAnalysis}>,
      hazardType: string
    }> = [];

    const hazardRelatedPosts = socialMediaAnalyses.filter(
      item => item.analysis.isHazardRelated && item.location && item.analysis.hazardType
    );

    const processedPosts = new Set<string>();

    for (const post of hazardRelatedPosts) {
      if (processedPosts.has(post.id) || !post.location) continue;

      const cluster = {
        center: { lat: post.location.lat, lng: post.location.lng },
        posts: [{ id: post.id, analysis: post.analysis }],
        hazardType: post.analysis.hazardType!
      };

      processedPosts.add(post.id);

      // Find nearby posts of the same hazard type
      for (const otherPost of hazardRelatedPosts) {
        if (processedPosts.has(otherPost.id) || !otherPost.location) continue;
        if (otherPost.analysis.hazardType !== post.analysis.hazardType) continue;

        const distance = this.calculateDistance(
          post.location.lat, post.location.lng,
          otherPost.location.lat, otherPost.location.lng
        );

        if (distance <= this.config.maxRadius) {
          cluster.posts.push({ id: otherPost.id, analysis: otherPost.analysis });
          processedPosts.add(otherPost.id);
          
          // Update cluster center
          const locations = cluster.posts
            .map(p => ({ lat: otherPost.location!.lat, lng: otherPost.location!.lng }));
          cluster.center = this.calculateCentroid(locations);
        }
      }

      if (cluster.posts.length >= 2) { // Lower threshold for social media
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Create hotspot from report cluster
   */
  private createHotspotFromReports(cluster: {
    center: {lat: number, lng: number},
    reports: Report[],
    hazardType: HazardType
  }): HotspotData | null {
    if (cluster.reports.length < this.config.minReportsForHotspot) {
      return null;
    }

    const verifiedCount = cluster.reports.filter(r => r.isVerified).length;
    const radius = this.calculateClusterRadius(cluster.reports.map(r => r.location));
    
    // Calculate intensity based on report count, verification status, and recency
    let intensity = cluster.reports.length;
    intensity += verifiedCount * this.config.verificationBonus;
    
    // Boost intensity for recent reports
    const recentReports = cluster.reports.filter(r => 
      new Date().getTime() - new Date(r.timestamp).getTime() < 24 * 60 * 60 * 1000 // 24 hours
    );
    intensity += recentReports.length * 0.5;

    // Normalize intensity to 1-10 scale
    intensity = Math.min(Math.max(intensity / 2, 1), 10);

    const hotspot: HotspotData = {
      id: `hotspot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      center: cluster.center,
      radius: Math.min(radius, this.config.maxRadius),
      intensity: Math.round(intensity * 10) / 10,
      hazardType: cluster.hazardType,
      reportCount: cluster.reports.length,
      verifiedReports: verifiedCount,
      socialMediaMentions: 0,
      lastUpdated: new Date(),
      riskLevel: 'medium',
      earlyWarningIssued: false,
      reports: cluster.reports.map(r => r.id),
      socialMediaPosts: []
    };

    return hotspot;
  }

  /**
   * Create hotspot from social media cluster
   */
  private createHotspotFromSocialMedia(cluster: {
    center: {lat: number, lng: number},
    posts: Array<{id: string, analysis: SocialMediaAnalysis}>,
    hazardType: string
  }): HotspotData | null {
    if (cluster.posts.length < 2) return null;

    // Calculate intensity based on social media metrics
    let intensity = cluster.posts.length * this.config.socialMediaWeight;
    
    // Boost for high confidence posts
    const highConfidencePosts = cluster.posts.filter(p => p.analysis.confidence > 0.7);
    intensity += highConfidencePosts.length * 0.5;

    // Boost for critical urgency
    const criticalPosts = cluster.posts.filter(p => p.analysis.urgency === 'critical');
    intensity += criticalPosts.length * 1.0;

    intensity = Math.min(Math.max(intensity, 1), 10);

    const hotspot: HotspotData = {
      id: `social_hotspot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      center: cluster.center,
      radius: 20, // Default radius for social media hotspots
      intensity: Math.round(intensity * 10) / 10,
      hazardType: cluster.hazardType as HazardType,
      reportCount: 0,
      verifiedReports: 0,
      socialMediaMentions: cluster.posts.length,
      lastUpdated: new Date(),
      riskLevel: 'low',
      earlyWarningIssued: false,
      reports: [],
      socialMediaPosts: cluster.posts.map(p => p.id)
    };

    return hotspot;
  }

  /**
   * Merge social media data into existing hotspot
   */
  private mergeSocialMediaIntoHotspot(
    hotspot: HotspotData,
    cluster: {
      center: {lat: number, lng: number},
      posts: Array<{id: string, analysis: SocialMediaAnalysis}>,
      hazardType: string
    }
  ): void {
    hotspot.socialMediaMentions += cluster.posts.length;
    hotspot.socialMediaPosts.push(...cluster.posts.map(p => p.id));
    
    // Boost intensity with social media data
    const socialMediaBoost = cluster.posts.length * this.config.socialMediaWeight;
    hotspot.intensity = Math.min(hotspot.intensity + socialMediaBoost, 10);
    
    hotspot.lastUpdated = new Date();
  }

  /**
   * Find nearby hotspot within range
   */
  private findNearbyHotspot(
    location: {lat: number, lng: number},
    hotspots: HotspotData[]
  ): HotspotData | null {
    for (const hotspot of hotspots) {
      const distance = this.calculateDistance(
        location.lat, location.lng,
        hotspot.center.lat, hotspot.center.lng
      );
      
      if (distance <= hotspot.radius) {
        return hotspot;
      }
    }
    return null;
  }

  /**
   * Calculate risk levels for hotspots
   */
  private calculateRiskLevels(hotspots: HotspotData[]): void {
    for (const hotspot of hotspots) {
      let riskScore = 0;

      // Base risk from intensity
      riskScore += hotspot.intensity * 10;

      // Boost for verified reports
      riskScore += hotspot.verifiedReports * 20;

      // Boost for high report density
      const density = hotspot.reportCount / (hotspot.radius || 1);
      riskScore += density * 15;

      // Boost for social media activity
      riskScore += hotspot.socialMediaMentions * 2;

      // Hazard type multiplier
      const hazardMultipliers: {[key in HazardType]: number} = {
        [HazardType.Tsunami]: 3.0,
        [HazardType.Cyclone]: 2.5,
        [HazardType.StormSurge]: 2.0,
        [HazardType.Flooding]: 1.5,
        [HazardType.Earthquake]: 2.8,
        [HazardType.CoastalErosion]: 1.0
      };

      riskScore *= hazardMultipliers[hotspot.hazardType] || 1.0;

      // Determine risk level
      if (riskScore >= 200) {
        hotspot.riskLevel = 'critical';
        hotspot.earlyWarningIssued = true;
      } else if (riskScore >= 100) {
        hotspot.riskLevel = 'high';
      } else if (riskScore >= 50) {
        hotspot.riskLevel = 'medium';
      } else {
        hotspot.riskLevel = 'low';
      }

      logger.info(`Hotspot ${hotspot.id} risk level: ${hotspot.riskLevel} (score: ${riskScore})`);
    }
  }

  /**
   * Apply time-based decay to hotspot intensity
   */
  private applyDecay(): void {
    const now = new Date();
    const hotspotsToRemove: string[] = [];

    for (const [id, hotspot] of this.activeHotspots) {
      const hoursSinceUpdate = (now.getTime() - hotspot.lastUpdated.getTime()) / (1000 * 60 * 60);
      const decayAmount = hoursSinceUpdate * this.config.decayFactor;
      
      hotspot.intensity = Math.max(hotspot.intensity - decayAmount, 0);

      // Remove hotspots that have decayed below threshold
      if (hotspot.intensity < 1) {
        hotspotsToRemove.push(id);
      }
    }

    // Remove decayed hotspots
    for (const id of hotspotsToRemove) {
      this.activeHotspots.delete(id);
      logger.info(`Removed decayed hotspot: ${id}`);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate centroid of multiple locations
   */
  private calculateCentroid(locations: Array<{lat: number, lng: number}>): {lat: number, lng: number} {
    const sum = locations.reduce(
      (acc, loc) => ({
        lat: acc.lat + loc.lat,
        lng: acc.lng + loc.lng
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / locations.length,
      lng: sum.lng / locations.length
    };
  }

  /**
   * Calculate radius that encompasses all points in cluster
   */
  private calculateClusterRadius(locations: Array<{lat: number, lng: number}>): number {
    if (locations.length <= 1) return 5; // Default 5km radius

    const centroid = this.calculateCentroid(locations);
    let maxDistance = 0;

    for (const location of locations) {
      const distance = this.calculateDistance(
        centroid.lat, centroid.lng,
        location.lat, location.lng
      );
      maxDistance = Math.max(maxDistance, distance);
    }

    return Math.max(maxDistance * 1.2, 5); // Add 20% buffer, minimum 5km
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get hotspots by risk level
   */
  public getHotspotsByRiskLevel(riskLevel: 'low' | 'medium' | 'high' | 'critical'): HotspotData[] {
    return Array.from(this.activeHotspots.values()).filter(h => h.riskLevel === riskLevel);
  }

  /**
   * Get critical hotspots that need immediate attention
   */
  public getCriticalHotspots(): HotspotData[] {
    return this.getHotspotsByRiskLevel('critical');
  }

  /**
   * Update hotspot configuration
   */
  public updateConfig(newConfig: Partial<HotspotConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info(`Updated hotspot configuration: ${JSON.stringify(this.config)}`);
  }
}

export const hotspotService = new HotspotService();
