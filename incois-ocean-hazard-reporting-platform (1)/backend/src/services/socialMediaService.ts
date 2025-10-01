import { logger } from '../utils/logger';

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
   * Get Reddit access token for API calls
   */
  private async getRedditAccessToken(): Promise<string> {
    if (this.redditAccessToken) {
      return this.redditAccessToken;
    }

    try {
      const auth = Buffer.from(`${this.redditClientId}:${this.redditClientSecret}`).toString('base64');
      
      const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'INCOIS-Hazard-Monitor/1.0'
          }
        }
      );

      this.redditAccessToken = response.data.access_token || '';
      
      // Token expires in 1 hour, clear it after 50 minutes
      setTimeout(() => {
        this.redditAccessToken = null;
      }, 50 * 60 * 1000);

      return this.redditAccessToken;
    } catch (error) {
      logger.error('Failed to get Reddit access token:', error);
      throw new Error('Reddit authentication failed');
    }
  }

  /**
   * Fetch posts from Reddit
   */
  async fetchRedditPosts(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    try {
      const accessToken = await this.getRedditAccessToken();
      
      const subreddits = [
        { name: 'india', query: 'tsunami OR flood OR cyclone OR storm OR "high waves"' },
        { name: 'Chennai', query: 'flood OR cyclone OR storm OR rain' },
        { name: 'mumbai', query: 'flood OR monsoon OR "high tide" OR storm' },
        { name: 'IndiaSpeaks', query: 'tsunami OR "coastal flood" OR cyclone' }
      ];

      for (const subreddit of subreddits) {
        try {
          const response = await axios.get(
            `https://oauth.reddit.com/r/${subreddit.name}/search`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'INCOIS-Hazard-Monitor/1.0'
              },
              params: {
                q: subreddit.query,
                sort: 'new',
                limit: 5,
                restrict_sr: 1,
                t: 'week'
              }
            }
          );

          if (response.data?.data?.children) {
            response.data.data.children.forEach((child: any) => {
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
   * Fetch posts from Twitter/X (requires Twitter API v2)
   */
  async fetchTwitterPosts(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    if (!this.twitterBearerToken) {
      logger.warn('Twitter Bearer Token not configured');
      return posts;
    }

    try {
      const queries = [
        'tsunami India',
        'cyclone India',
        'coastal flooding India',
        'storm surge India',
        'high waves India coast'
      ];

      for (const query of queries.slice(0, 2)) { // Limit to avoid rate limits
        try {
          const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
            headers: {
              'Authorization': `Bearer ${this.twitterBearerToken}`
            },
            params: {
              query: `${query} -is:retweet lang:en`,
              max_results: 10,
              'tweet.fields': 'created_at,author_id,public_metrics,geo',
              'user.fields': 'username'
            }
          });

          if (response.data?.data) {
            response.data.data.forEach((tweet: any) => {
              if (this.isHazardRelated(tweet.text)) {
                posts.push({
                  id: `twitter-${tweet.id}`,
                  source: 'twitter',
                  author: `@${tweet.author_id}`, // Would need user lookup for actual username
                  content: tweet.text,
                  timestamp: tweet.created_at,
                  location: tweet.geo?.place_id || 'India',
                  sentiment: this.analyzeSentiment(tweet.text),
                  keywords: this.extractKeywords(tweet.text),
                  engagement: {
                    likes: tweet.public_metrics?.like_count || 0,
                    shares: tweet.public_metrics?.retweet_count || 0,
                    comments: tweet.public_metrics?.reply_count || 0
                  },
                  url: `https://twitter.com/i/status/${tweet.id}`
                });
              }
            });
          }
        } catch (error) {
          logger.error(`Error fetching Twitter data for query "${query}":`, error);
        }
      }
    } catch (error) {
      logger.error('Error in Twitter data fetch:', error);
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
        'https://feeds.feedburner.com/ndtvnews-india-news',
        'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
        'https://www.thehindu.com/news/national/?service=rss'
      ];

      for (const feedUrl of newsFeeds.slice(0, 2)) {
        try {
          // Using RSS2JSON service - you may want to replace with a paid service for production
          const rssToJsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=10`;
          
          const response = await axios.get(rssToJsonUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'INCOIS-Hazard-Monitor/1.0'
            }
          });

          if (response.data?.items) {
            response.data.items.forEach((item: any) => {
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
   * Fetch YouTube comments (requires YouTube Data API v3)
   */
  async fetchYouTubePosts(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    if (!this.youtubeApiKey) {
      logger.warn('YouTube API Key not configured');
      return posts;
    }

    try {
      // Search for videos related to ocean hazards in India
      const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: this.youtubeApiKey,
          q: 'tsunami cyclone flood India coast',
          part: 'snippet',
          type: 'video',
          maxResults: 5,
          order: 'date',
          regionCode: 'IN'
        }
      });

      if (searchResponse.data?.items) {
        for (const video of searchResponse.data.items.slice(0, 2)) {
          try {
            // Get comments for each video
            const commentsResponse = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
              params: {
                key: this.youtubeApiKey,
                videoId: video.id.videoId,
                part: 'snippet',
                maxResults: 10,
                order: 'time'
              }
            });

            if (commentsResponse.data?.items) {
              commentsResponse.data.items.forEach((comment: any) => {
                const commentText = comment.snippet.topLevelComment.snippet.textDisplay;
                if (this.isHazardRelated(commentText)) {
                  posts.push({
                    id: `youtube-${comment.id}`,
                    source: 'youtube',
                    author: comment.snippet.topLevelComment.snippet.authorDisplayName,
                    content: commentText,
                    timestamp: comment.snippet.topLevelComment.snippet.publishedAt,
                    location: 'India',
                    sentiment: this.analyzeSentiment(commentText),
                    keywords: this.extractKeywords(commentText),
                    engagement: {
                      likes: comment.snippet.topLevelComment.snippet.likeCount || 0
                    },
                    url: `https://youtube.com/watch?v=${video.id.videoId}`
                  });
                }
              });
            }
          } catch (error) {
            logger.error(`Error fetching YouTube comments for video ${video.id.videoId}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Error in YouTube data fetch:', error);
    }

    return posts;
  }

  /**
   * Fetch all social media data
   */
  async fetchAllSocialData(): Promise<SocialMediaPost[]> {
    logger.info('🔍 Fetching social media data from backend...');
    
    const [redditPosts, twitterPosts, newsPosts, youtubePosts] = await Promise.allSettled([
      this.fetchRedditPosts(),
      this.fetchTwitterPosts(),
      this.fetchNewsData(),
      this.fetchYouTubePosts()
    ]);

    const allPosts: SocialMediaPost[] = [];

    // Collect successful results
    if (redditPosts.status === 'fulfilled') {
      allPosts.push(...redditPosts.value);
      logger.info(`✅ Fetched ${redditPosts.value.length} Reddit posts`);
    } else {
      logger.error('Reddit fetch failed:', redditPosts.reason);
    }

    if (twitterPosts.status === 'fulfilled') {
      allPosts.push(...twitterPosts.value);
      logger.info(`✅ Fetched ${twitterPosts.value.length} Twitter posts`);
    } else {
      logger.error('Twitter fetch failed:', twitterPosts.reason);
    }

    if (newsPosts.status === 'fulfilled') {
      allPosts.push(...newsPosts.value);
      logger.info(`✅ Fetched ${newsPosts.value.length} news posts`);
    } else {
      logger.error('News fetch failed:', newsPosts.reason);
    }

    if (youtubePosts.status === 'fulfilled') {
      allPosts.push(...youtubePosts.value);
      logger.info(`✅ Fetched ${youtubePosts.value.length} YouTube posts`);
    } else {
      logger.error('YouTube fetch failed:', youtubePosts.reason);
    }

    // Sort by timestamp (newest first)
    allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    logger.info(`🎉 Total social media posts fetched: ${allPosts.length}`);
    return allPosts;
  }

  /**
   * Analyze social media content for hazard relevance
   */
  analyzeSocialContent(content: string): SocialMediaAnalysis {
    const isHazardRelated = this.isHazardRelated(content);
    const keywords = this.extractKeywords(content);
    const sentiment = this.analyzeSentiment(content);
    
    let hazardType: string | null = null;
    let severity = 1;
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (isHazardRelated) {
      // Determine hazard type
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('tsunami')) {
        hazardType = 'tsunami';
        severity = 5;
        urgency = 'critical';
      } else if (lowerContent.includes('cyclone') || lowerContent.includes('hurricane')) {
        hazardType = 'cyclone';
        severity = 4;
        urgency = 'high';
      } else if (lowerContent.includes('flood')) {
        hazardType = 'flooding';
        severity = 3;
        urgency = 'medium';
      } else if (lowerContent.includes('storm surge')) {
        hazardType = 'storm_surge';
        severity = 4;
        urgency = 'high';
      } else if (lowerContent.includes('high waves')) {
        hazardType = 'high_waves';
        severity = 2;
        urgency = 'medium';
      }
    }

    return {
      isHazardRelated,
      confidence: isHazardRelated ? 0.8 : 0.2,
      hazardType,
      severity,
      keywords,
      sentiment,
      urgency
    };
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
      'devastating', 'severe', 'massive', 'dangerous', 'critical', 'terrible',
      'awful', 'horrible', 'catastrophic', 'deadly'
    ];
    
    const positiveWords = [
      'safe', 'rescue', 'help', 'support', 'recovery', 'relief', 'saved',
      'secure', 'successful', 'cleared', 'improved', 'better', 'good',
      'excellent', 'great', 'amazing', 'wonderful', 'fantastic'
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
      'disaster', 'coast', 'marine', 'sea', 'ocean', 'weather', 'monsoon',
      'inundation', 'erosion', 'landfall', 'depression', 'low pressure'
    ];
    
    keywordList.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }
}

export default new SocialMediaService();
