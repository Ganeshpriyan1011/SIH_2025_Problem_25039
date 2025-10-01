import { logger } from '../utils/logger';

export interface HazardKeywords {
  [key: string]: {
    primary: string[];
    secondary: string[];
    severity: number; // 1-5 scale
    category: string;
  };
}

export interface SocialMediaAnalysis {
  isHazardRelated: boolean;
  confidence: number;
  hazardType: string | null;
  severity: number;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    mentioned: boolean;
    coordinates?: { lat: number; lng: number };
    placeName?: string;
  };
}

class NLPService {
  private hazardKeywords: HazardKeywords = {
    tsunami: {
      primary: ['tsunami', 'tidal wave', 'sea wave', 'ocean wave', 'giant wave'],
      secondary: ['earthquake', 'seismic', 'coastal flooding', 'evacuation', 'warning'],
      severity: 5,
      category: 'tsunami'
    },
    cyclone: {
      primary: ['cyclone', 'hurricane', 'typhoon', 'storm', 'tropical storm'],
      secondary: ['wind', 'rain', 'flooding', 'landfall', 'eye wall', 'storm surge'],
      severity: 4,
      category: 'cyclone'
    },
    flooding: {
      primary: ['flood', 'flooding', 'inundation', 'waterlogging', 'overflow'],
      secondary: ['rain', 'river', 'dam', 'breach', 'water level', 'submerged'],
      severity: 3,
      category: 'flooding'
    },
    stormSurge: {
      primary: ['storm surge', 'tidal surge', 'coastal surge', 'sea level rise'],
      secondary: ['high tide', 'coastal', 'waves', 'surge height', 'inundation'],
      severity: 4,
      category: 'storm_surge'
    },
    earthquake: {
      primary: ['earthquake', 'tremor', 'seismic', 'quake', 'aftershock'],
      secondary: ['magnitude', 'richter', 'epicenter', 'fault', 'tectonic'],
      severity: 4,
      category: 'earthquake'
    },
    erosion: {
      primary: ['erosion', 'coastal erosion', 'beach erosion', 'shoreline retreat'],
      secondary: ['sand', 'cliff', 'embankment', 'sediment', 'retreat'],
      severity: 2,
      category: 'erosion'
    }
  };

  private urgencyKeywords = {
    critical: ['emergency', 'urgent', 'immediate', 'evacuate', 'danger', 'critical', 'alert'],
    high: ['warning', 'caution', 'serious', 'severe', 'major', 'significant'],
    medium: ['moderate', 'watch', 'advisory', 'minor', 'developing'],
    low: ['possible', 'potential', 'slight', 'low', 'minimal']
  };

  private locationPatterns = [
    /(?:in|at|near|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:coast|beach|port|harbor|district|city|town|village)/g,
    /(?:coordinates?|lat|lng|latitude|longitude)\s*:?\s*([\d.-]+)[,\s]+([\d.-]+)/gi
  ];

  // Multilingual keyword mappings
  private multilingualKeywords = {
    hindi: {
      tsunami: ['सुनामी', 'समुद्री लहर', 'तूफानी लहर'],
      cyclone: ['चक्रवात', 'तूफान', 'आंधी'],
      flooding: ['बाढ़', 'जलभराव', 'पानी भरना'],
      earthquake: ['भूकंप', 'धरती हिलना', 'कंपन']
    },
    tamil: {
      tsunami: ['சுனாமி', 'கடல் அலை', 'பெரிய அலை'],
      cyclone: ['சூறாவளி', 'புயல்', 'காற்று'],
      flooding: ['வெள்ளம்', 'நீர் நிரம்புதல்'],
      earthquake: ['நிலநடுக்கம்', 'பூமி அதிர்வு']
    },
    bengali: {
      tsunami: ['সুনামি', 'সমুদ্রের ঢেউ', 'জলোচ্ছ্বাস'],
      cyclone: ['ঘূর্ণিঝড়', 'তুফান', 'ঝড়'],
      flooding: ['বন্যা', 'জলাবদ্ধতা'],
      earthquake: ['ভূমিকম্প', 'কম্পন']
    }
  };

  /**
   * Analyze social media post for hazard-related content
   */
  public analyzeSocialMediaPost(text: string, metadata?: any): SocialMediaAnalysis {
    const normalizedText = text.toLowerCase();
    let analysis: SocialMediaAnalysis = {
      isHazardRelated: false,
      confidence: 0,
      hazardType: null,
      severity: 0,
      keywords: [],
      sentiment: 'neutral',
      urgency: 'low'
    };

    // Check for hazard keywords
    const detectedHazards = this.detectHazardKeywords(normalizedText);
    
    if (detectedHazards.length > 0) {
      analysis.isHazardRelated = true;
      const primaryHazard = detectedHazards[0];
      analysis.hazardType = primaryHazard.type;
      analysis.severity = primaryHazard.severity;
      analysis.keywords = primaryHazard.keywords;
      analysis.confidence = this.calculateConfidence(detectedHazards, normalizedText);
    }

    // Analyze urgency
    analysis.urgency = this.analyzeUrgency(normalizedText);

    // Analyze sentiment
    analysis.sentiment = this.analyzeSentiment(normalizedText);

    // Extract location information
    analysis.location = this.extractLocation(text);

    // Boost confidence if location is mentioned
    if (analysis.location?.mentioned) {
      analysis.confidence = Math.min(analysis.confidence + 0.2, 1.0);
    }

    logger.info(`NLP Analysis: ${JSON.stringify(analysis)}`);
    return analysis;
  }

  /**
   * Detect hazard keywords in multiple languages
   */
  private detectHazardKeywords(text: string): Array<{type: string, severity: number, keywords: string[]}> {
    const detected: Array<{type: string, severity: number, keywords: string[]}> = [];

    // Check English keywords
    for (const [hazardType, config] of Object.entries(this.hazardKeywords)) {
      const foundKeywords: string[] = [];
      
      // Check primary keywords
      for (const keyword of config.primary) {
        if (text.includes(keyword.toLowerCase())) {
          foundKeywords.push(keyword);
        }
      }

      // Check secondary keywords
      for (const keyword of config.secondary) {
        if (text.includes(keyword.toLowerCase())) {
          foundKeywords.push(keyword);
        }
      }

      if (foundKeywords.length > 0) {
        detected.push({
          type: hazardType,
          severity: config.severity,
          keywords: foundKeywords
        });
      }
    }

    // Check multilingual keywords
    for (const [language, hazards] of Object.entries(this.multilingualKeywords)) {
      for (const [hazardType, keywords] of Object.entries(hazards)) {
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            const existingDetection = detected.find(d => d.type === hazardType);
            if (existingDetection) {
              existingDetection.keywords.push(keyword);
            } else {
              detected.push({
                type: hazardType,
                severity: this.hazardKeywords[hazardType]?.severity || 3,
                keywords: [keyword]
              });
            }
          }
        }
      }
    }

    return detected.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Calculate confidence score based on keyword matches and context
   */
  private calculateConfidence(detectedHazards: any[], text: string): number {
    let confidence = 0;

    for (const hazard of detectedHazards) {
      // Base confidence from keyword matches
      const keywordScore = Math.min(hazard.keywords.length * 0.2, 0.6);
      
      // Severity multiplier
      const severityMultiplier = hazard.severity / 5;
      
      confidence += keywordScore * severityMultiplier;
    }

    // Context boosters
    if (text.includes('breaking') || text.includes('urgent') || text.includes('alert')) {
      confidence += 0.2;
    }

    if (text.includes('official') || text.includes('government') || text.includes('authority')) {
      confidence += 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Analyze urgency level based on keywords
   */
  private analyzeUrgency(text: string): 'low' | 'medium' | 'high' | 'critical' {
    for (const [level, keywords] of Object.entries(this.urgencyKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return level as 'low' | 'medium' | 'high' | 'critical';
        }
      }
    }
    return 'low';
  }

  /**
   * Basic sentiment analysis
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['safe', 'secure', 'protected', 'calm', 'normal', 'clear'];
    const negativeWords = ['danger', 'threat', 'damage', 'destroy', 'fear', 'panic', 'emergency'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++;
    }

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Extract location information from text
   */
  private extractLocation(text: string): SocialMediaAnalysis['location'] {
    const location: SocialMediaAnalysis['location'] = {
      mentioned: false
    };

    // Try to extract place names and coordinates
    for (const pattern of this.locationPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        location.mentioned = true;
        
        // Check if it's coordinates
        if (match[0].includes('lat') || match[0].includes('lng') || match[0].includes('coordinate')) {
          const coords = text.match(/([\d.-]+)[,\s]+([\d.-]+)/);
          if (coords) {
            location.coordinates = {
              lat: parseFloat(coords[1]),
              lng: parseFloat(coords[2])
            };
          }
        } else {
          // It's a place name
          location.placeName = match[1] || match[0];
        }
        break; // Take first match
      }
    }

    return location;
  }

  /**
   * Batch analyze multiple social media posts
   */
  public batchAnalyze(posts: Array<{id: string, text: string, metadata?: any}>): Array<{id: string, analysis: SocialMediaAnalysis}> {
    return posts.map(post => ({
      id: post.id,
      analysis: this.analyzeSocialMediaPost(post.text, post.metadata)
    }));
  }

  /**
   * Get trending hazard topics from analyzed posts
   */
  public getTrendingHazards(analyses: SocialMediaAnalysis[]): Array<{hazardType: string, count: number, avgSeverity: number}> {
    const hazardCounts: {[key: string]: {count: number, totalSeverity: number}} = {};

    for (const analysis of analyses) {
      if (analysis.isHazardRelated && analysis.hazardType) {
        if (!hazardCounts[analysis.hazardType]) {
          hazardCounts[analysis.hazardType] = {count: 0, totalSeverity: 0};
        }
        hazardCounts[analysis.hazardType].count++;
        hazardCounts[analysis.hazardType].totalSeverity += analysis.severity;
      }
    }

    return Object.entries(hazardCounts)
      .map(([hazardType, data]) => ({
        hazardType,
        count: data.count,
        avgSeverity: data.totalSeverity / data.count
      }))
      .sort((a, b) => b.count - a.count);
  }
}

export const nlpService = new NLPService();
