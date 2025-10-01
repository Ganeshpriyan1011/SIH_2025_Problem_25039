import { logger } from '../utils/logger';
import cacheService from './simpleCacheService';

export interface SocialMediaPost {
  id: string;
  source: 'twitter' | 'reddit' | 'facebook' | 'youtube' | 'news';
  author: string;
  content: string;
  timestamp: string;
  location: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
  };
  url?: string;
}

export interface SocialMediaAnalysis {
  isHazardRelated: boolean;
  confidence: number;
  hazardType: string | null;
  severity: number;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

class SocialMediaService {
  private redditClientId: string;
  private redditClientSecret: string;
  private twitterBearerToken: string;
  private youtubeApiKey: string;
  private redditAccessToken: string = '';

  constructor() {
    this.redditClientId = process.env.REDDIT_CLIENT_ID || '';
    this.redditClientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  /**
   * Get Reddit access token for API calls using fetch
   */
  private async getRedditAccessToken(): Promise<string> {
    if (this.redditAccessToken) {
      return this.redditAccessToken;
    }

    try {
      const auth = Buffer.from(`${this.redditClientId}:${this.redditClientSecret}`).toString('base64');
      
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'INCOIS-Hazard-Monitor/1.0'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Reddit auth failed: ${response.status}`);
      }

      const data = await response.json() as any;
      this.redditAccessToken = data.access_token || '';
      
      // Token expires in 1 hour, clear it after 50 minutes
      setTimeout(() => {
        this.redditAccessToken = '';
      }, 50 * 60 * 1000);

      return this.redditAccessToken;
    } catch (error) {
      logger.error('Failed to get Reddit access token:', error);
      throw new Error('Reddit authentication failed');
    }
  }

  /**
   * Fetch posts from Reddit using fetch API
   */
  async fetchRedditPosts(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    try {
      const accessToken = await this.getRedditAccessToken();
      
      const subreddits = [
        { name: 'india', query: 'tsunami OR flood OR cyclone OR storm OR "high waves"' },
        { name: 'Chennai', query: 'flood OR cyclone OR storm OR rain' }
      ];

      for (const subreddit of subreddits) {
        try {
          const url = `https://oauth.reddit.com/r/${subreddit.name}/search?q=${encodeURIComponent(subreddit.query)}&sort=new&limit=5&restrict_sr=1&t=week`;
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'INCOIS-Hazard-Monitor/1.0'
            }
          });

          if (!response.ok) {
            logger.warn(`Reddit request failed for r/${subreddit.name}: ${response.status}`);
            continue;
          }

          const data = await response.json() as any;
          
          if (data?.data?.children) {
            data.data.children.forEach((child: any) => {
              const post = child.data;
              if (post && post.title && this.isHazardRelated(post.title + ' ' + (post.selftext || ''))) {
                posts.push({
                  id: `reddit-${post.id}`,
                  source: 'reddit',
                  author: `u/${post.author || 'unknown'}`,
                  content: `${post.title}${post.selftext ? ' - ' + post.selftext.substring(0, 200) + '...' : ''}`,
                  timestamp: new Date(post.created_utc * 1000).toISOString(),
                  location: `r/${subreddit.name}`,
                  sentiment: this.analyzeSentiment(post.title + ' ' + (post.selftext || '')),
                  keywords: this.extractKeywords(post.title + ' ' + (post.selftext || '')),
                  engagement: {
                    likes: post.ups || 0,
                    comments: post.num_comments || 0
                  },
                  url: `https://reddit.com${post.permalink}`
                });
              }
            });
          }
        } catch (error) {
          logger.error(`Error fetching from r/${subreddit.name}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in Reddit data fetch:', error);
    }

    return posts;
  }

  /**
   * Fetch news from RSS feeds using RSS2JSON
   */
  async fetchNewsData(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    try {
      const newsFeeds = [
        'https://feeds.feedburner.com/ndtvnews-india-news'
      ];

      for (const feedUrl of newsFeeds) {
        try {
          const rssToJsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=10`;
          
          const response = await fetch(rssToJsonUrl, {
            headers: {
              'User-Agent': 'INCOIS-Hazard-Monitor/1.0'
            }
          });

          if (!response.ok) {
            logger.warn(`News feed request failed: ${response.status}`);
            continue;
          }

          const data = await response.json() as any;
          
          if (data?.items) {
            data.items.forEach((item: any) => {
              const content = item.title + ' ' + (item.description || '');
              if (this.isHazardRelated(content)) {
                posts.push({
                  id: `news-${Date.now()}-${Math.random()}`,
                  source: 'news',
                  author: item.author || 'News Source',
                  content: `${item.title}${item.description ? ' - ' + item.description.substring(0, 300) + '...' : ''}`,
                  timestamp: item.pubDate || new Date().toISOString(),
                  location: 'India',
                  sentiment: this.analyzeSentiment(content),
                  keywords: this.extractKeywords(content),
                  url: item.link
                });
              }
            });
          }
        } catch (error) {
          logger.error('Error fetching news feed:', error);
        }
      }
    } catch (error) {
      logger.error('Error in news data fetch:', error);
    }

    return posts;
  }

  /**
   * Generate realistic mock social media posts
   */
  generateRealisticMockData(): SocialMediaPost[] {
    const mockPosts = [
      {
        id: `mock-${Date.now()}-1`,
        source: 'twitter' as const,
        author: '@WeatherIndia',
        content: 'High wave alert issued for Chennai coast. Waves up to 3.5 meters expected. Fishermen advised not to venture into sea. #ChennaiWeather #HighWaves #SafetyAlert',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        location: 'Chennai',
        sentiment: 'negative' as const,
        keywords: ['high waves', 'alert', 'safety', 'fishermen']
      },
      {
        id: `mock-${Date.now()}-2`,
        source: 'reddit' as const,
        author: 'u/MumbaiResident',
        content: 'Massive waves hitting Marine Drive right now! Never seen anything like this. The sea wall is completely submerged. #MumbaiFloods #MarineDrive',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        location: 'Mumbai',
        sentiment: 'negative' as const,
        keywords: ['massive waves', 'marine drive', 'flooding', 'sea wall']
      },
      {
        id: `mock-${Date.now()}-3`,
        source: 'twitter' as const,
        author: '@IMDWeather',
        content: 'Cyclone warning: Depression over Bay of Bengal likely to intensify. Coastal areas of Tamil Nadu and Andhra Pradesh on high alert. #CycloneAlert #BayOfBengal',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        location: 'Bay of Bengal',
        sentiment: 'negative' as const,
        keywords: ['cyclone', 'warning', 'depression', 'high alert']
      }
    ];
    
    return mockPosts;
  }

  /**
   * Fetch all social media data with caching and fallback to mock data
   */
  async fetchAllSocialData(): Promise<SocialMediaPost[]> {
    logger.info('🔍 Fetching social media data from backend...');
    
    return cacheService.cached(
      'social_media_all_posts',
      async () => {
        try {
          const [redditPosts, newsPosts] = await Promise.allSettled([
            this.fetchRedditPosts(),
            this.fetchNewsData()
          ]);

          const allPosts: SocialMediaPost[] = [];

          if (redditPosts.status === 'fulfilled') {
            allPosts.push(...redditPosts.value);
            logger.info(`✅ Fetched ${redditPosts.value.length} Reddit posts`);
          }

          if (newsPosts.status === 'fulfilled') {
            allPosts.push(...newsPosts.value);
            logger.info(`✅ Fetched ${newsPosts.value.length} news posts`);
          }

          // Add mock data if no real data was fetched
          if (allPosts.length === 0) {
            const mockData = this.generateRealisticMockData();
            allPosts.push(...mockData);
            logger.info(`📝 Using ${mockData.length} mock social media posts`);
          }

          // Sort by timestamp (newest first)
          allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          logger.info(`🎉 Total social media posts: ${allPosts.length}`);
          return allPosts;
        } catch (error) {
          logger.error('Error fetching social data, using mock data:', error);
          return this.generateRealisticMockData();
        }
      },
      600 // Cache for 10 minutes
    );
  }

  /**
   * Check if content is hazard-related
   */
  private isHazardRelated(content: string): boolean {
    const lowerContent = content.toLowerCase();
    const hazardKeywords = [
      'tsunami', 'flood', 'cyclone', 'storm', 'hurricane', 'typhoon',
      'high waves', 'storm surge', 'coastal', 'evacuation', 'emergency',
      'disaster', 'warning', 'alert', 'rescue', 'sea level', 'tide',
      'inundation', 'surge', 'current', 'erosion', 'landfall'
    ];
    
    return hazardKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    const negativeWords = [
      'disaster', 'emergency', 'danger', 'warning', 'alert', 'evacuation',
      'damage', 'destroy', 'flood', 'tsunami', 'storm', 'crisis', 'threat',
      'devastating', 'severe', 'massive', 'dangerous', 'critical'
    ];
    
    const positiveWords = [
      'safe', 'rescue', 'help', 'support', 'recovery', 'relief', 'saved',
      'secure', 'successful', 'cleared', 'improved', 'better', 'good'
    ];
    
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Extract relevant keywords from text
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    const keywordList = [
      'tsunami', 'flood', 'storm', 'cyclone', 'waves', 'surge', 'current',
      'tide', 'evacuation', 'emergency', 'warning', 'alert', 'rescue',
      'disaster', 'coast', 'marine', 'sea', 'ocean', 'weather', 'monsoon'
    ];
    
    keywordList.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    return [...new Set(keywords)];
  }
}

export default new SocialMediaService();
