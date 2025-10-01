import { SocialMediaPost, Sentiment } from '../types';

// Hazard-related keywords for NLP detection
const HAZARD_KEYWORDS = {
  tsunami: ['tsunami', 'tidal wave', 'seismic wave', 'ocean wave', 'giant wave'],
  storm_surge: ['storm surge', 'storm tide', 'coastal surge', 'hurricane surge', 'cyclone surge'],
  high_waves: ['high waves', 'big waves', 'huge waves', 'massive waves', 'rough sea', 'choppy water'],
  coastal_currents: ['rip current', 'undertow', 'coastal current', 'dangerous current', 'strong current'],
  swell_surge: ['swell', 'ocean swell', 'ground swell', 'long waves', 'swell surge'],
  coastal_flooding: ['coastal flood', 'sea flood', 'tidal flood', 'storm flood', 'beach flood', 'shoreline flood'],
  emergency: ['emergency', 'evacuation', 'rescue', 'help', 'danger', 'warning', 'alert', 'urgent']
};

const INTENSITY_KEYWORDS = {
  high: ['massive', 'huge', 'enormous', 'devastating', 'catastrophic', 'severe', 'extreme'],
  medium: ['large', 'big', 'significant', 'considerable', 'notable', 'strong'],
  low: ['small', 'minor', 'slight', 'moderate', 'mild']
};

const LOCATION_KEYWORDS = [
  'mumbai', 'chennai', 'kolkata', 'kochi', 'visakhapatnam', 'goa', 'puducherry',
  'mangalore', 'kanyakumari', 'rameswaram', 'puri', 'digha', 'somnath', 'kovalam',
  'marina beach', 'juhu beach', 'calangute', 'gokarna', 'vizag', 'andhra pradesh',
  'tamil nadu', 'kerala', 'karnataka', 'west bengal', 'odisha', 'gujarat'
];

export interface NLPAnalysis {
  isHazardRelated: boolean;
  detectedHazards: string[];
  confidence: number;
  sentiment: Sentiment;
  intensity: 'low' | 'medium' | 'high';
  locations: string[];
  keywords: string[];
  engagementScore: number;
}

export class NLPService {
  /**
   * Analyzes social media post content for hazard-related information
   */
  static analyzePost(post: SocialMediaPost): NLPAnalysis {
    const content = post.content.toLowerCase();
    const detectedHazards: string[] = [];
    const detectedLocations: string[] = [];
    const detectedKeywords: string[] = [];
    
    // Detect hazard types
    Object.entries(HAZARD_KEYWORDS).forEach(([hazardType, keywords]) => {
      const found = keywords.some(keyword => content.includes(keyword.toLowerCase()));
      if (found) {
        detectedHazards.push(hazardType);
        detectedKeywords.push(...keywords.filter(kw => content.includes(kw.toLowerCase())));
      }
    });

    // Detect locations
    LOCATION_KEYWORDS.forEach(location => {
      if (content.includes(location.toLowerCase())) {
        detectedLocations.push(location);
      }
    });

    // Determine intensity
    let intensity: 'low' | 'medium' | 'high' = 'low';
    if (INTENSITY_KEYWORDS.high.some(kw => content.includes(kw))) {
      intensity = 'high';
    } else if (INTENSITY_KEYWORDS.medium.some(kw => content.includes(kw))) {
      intensity = 'medium';
    }

    // Calculate confidence based on multiple factors
    let confidence = 0;
    if (detectedHazards.length > 0) confidence += 40;
    if (detectedLocations.length > 0) confidence += 20;
    if (detectedKeywords.length > 2) confidence += 20;
    if (intensity === 'high') confidence += 15;
    if (post.sentiment === Sentiment.Negative) confidence += 5;

    // Calculate engagement score (mock implementation)
    const engagementScore = this.calculateEngagementScore(post, detectedHazards.length);

    return {
      isHazardRelated: detectedHazards.length > 0,
      detectedHazards,
      confidence: Math.min(confidence, 100),
      sentiment: post.sentiment,
      intensity,
      locations: detectedLocations,
      keywords: [...new Set(detectedKeywords)], // Remove duplicates
      engagementScore
    };
  }

  /**
   * Calculates engagement score based on various factors
   */
  private static calculateEngagementScore(post: SocialMediaPost, hazardCount: number): number {
    let score = 50; // Base score

    // Boost score for hazard-related content
    score += hazardCount * 15;

    // Boost for negative sentiment (indicates urgency)
    if (post.sentiment === Sentiment.Negative) score += 20;

    // Boost for recent posts
    const hoursAgo = (Date.now() - new Date(post.timestamp).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 1) score += 25;
    else if (hoursAgo < 6) score += 15;
    else if (hoursAgo < 24) score += 5;

    // Boost for certain sources
    if (post.source === 'Twitter') score += 10; // Twitter tends to be more real-time

    return Math.min(score, 100);
  }

  /**
   * Filters posts to show only hazard-related content
   */
  static filterHazardPosts(posts: SocialMediaPost[]): SocialMediaPost[] {
    return posts.filter(post => {
      const analysis = this.analyzePost(post);
      return analysis.isHazardRelated && analysis.confidence > 30;
    });
  }

  /**
   * Sorts posts by relevance and engagement
   */
  static sortByRelevance(posts: SocialMediaPost[]): SocialMediaPost[] {
    return posts.sort((a, b) => {
      const analysisA = this.analyzePost(a);
      const analysisB = this.analyzePost(b);
      
      // Primary sort: hazard-related posts first
      if (analysisA.isHazardRelated !== analysisB.isHazardRelated) {
        return analysisA.isHazardRelated ? -1 : 1;
      }

      // Secondary sort: by engagement score
      if (analysisA.engagementScore !== analysisB.engagementScore) {
        return analysisB.engagementScore - analysisA.engagementScore;
      }

      // Tertiary sort: by confidence
      return analysisB.confidence - analysisA.confidence;
    });
  }

  /**
   * Gets trending hazard keywords from recent posts
   */
  static getTrendingKeywords(posts: SocialMediaPost[]): { keyword: string; count: number; trend: 'up' | 'down' | 'stable' }[] {
    const keywordCounts = new Map<string, number>();
    
    posts.forEach(post => {
      const analysis = this.analyzePost(post);
      analysis.keywords.forEach(keyword => {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      });
    });

    return Array.from(keywordCounts.entries())
      .map(([keyword, count]) => ({
        keyword,
        count,
        trend: 'stable' as const // Mock trend - in real implementation, compare with historical data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
