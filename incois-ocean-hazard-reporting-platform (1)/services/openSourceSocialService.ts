import { SocialMediaPost, SocialSource, Sentiment } from '../types';

export class OpenSourceSocialService {
  /**
   * Fetches data from Reddit using their public JSON API
   */
  static async fetchRedditData(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    try {
      // Search multiple subreddits for hazard-related content
      const subreddits = [
        { name: 'india', query: 'tsunami OR flood OR cyclone OR storm OR "high waves"' },
        { name: 'Chennai', query: 'flood OR cyclone OR storm OR rain' },
        { name: 'mumbai', query: 'flood OR monsoon OR "high tide" OR storm' },
        { name: 'IndiaSpeaks', query: 'tsunami OR "coastal flood" OR cyclone' }
      ];
      
      for (const subreddit of subreddits.slice(0, 2)) { // Limit to avoid rate limits
        try {
          const url = `https://www.reddit.com/r/${subreddit.name}/search.json?q=${encodeURIComponent(subreddit.query)}&sort=new&limit=3&restrict_sr=1&t=week`;
          console.log(`Fetching from Reddit: r/${subreddit.name}`);
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'INCOIS-Hazard-Monitor/1.0'
            }
          });
          
          if (!response.ok) {
            console.warn(`Reddit request failed for r/${subreddit.name}: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          
          if (data?.data?.children) {
            data.data.children.forEach((child: any) => {
              const post = child.data;
              if (post && post.title) {
                posts.push({
                  id: `reddit-${post.id}`,
                  source: SocialSource.Reddit,
                  author: `u/${post.author || 'unknown'}`,
                  content: `${post.title}${post.selftext ? ' - ' + post.selftext.substring(0, 150) + '...' : ''}`,
                  timestamp: new Date(post.created_utc * 1000).toISOString(),
                  location: `r/${subreddit.name}`,
                  sentiment: this.analyzeSentiment(post.title + ' ' + (post.selftext || '')),
                  keywords: this.extractKeywords(post.title + ' ' + (post.selftext || ''))
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching from r/${subreddit.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in Reddit data fetch:', error);
    }
    
    return posts;
  }

  /**
   * Fetches news from RSS feeds (open source news APIs)
   */
  static async fetchNewsData(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    try {
      // Use RSS2JSON service to convert RSS feeds to JSON
      const newsFeeds = [
        'https://feeds.feedburner.com/ndtvnews-india-news',
        'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', // India news
        'https://www.thehindu.com/news/national/?service=rss'
      ];
      
      for (const feedUrl of newsFeeds.slice(0, 1)) { // Limit to one feed to avoid rate limits
        try {
          const rssToJsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&api_key=YOUR_API_KEY&count=5`;
          
          console.log('Fetching news data...');
          const response = await fetch(rssToJsonUrl);
          
          if (!response.ok) {
            console.warn(`News feed request failed: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          
          if (data?.items) {
            data.items.forEach((item: any) => {
              const content = item.title + ' ' + (item.description || '');
              if (this.isHazardRelated(content)) {
                posts.push({
                  id: `news-${Date.now()}-${Math.random()}`,
                  source: SocialSource.Facebook, // Using Facebook as news source placeholder
                  author: item.author || 'News Source',
                  content: `${item.title}${item.description ? ' - ' + item.description.substring(0, 200) + '...' : ''}`,
                  timestamp: item.pubDate || new Date().toISOString(),
                  location: 'India',
                  sentiment: this.analyzeSentiment(content),
                  keywords: this.extractKeywords(content)
                });
              }
            });
          }
        } catch (error) {
          console.error('Error fetching news feed:', error);
        }
      }
    } catch (error) {
      console.error('Error in news data fetch:', error);
    }
    
    return posts;
  }

  /**
   * Generates realistic mock social media posts with current timestamps
   */
  static generateRealisticMockData(): SocialMediaPost[] {
    const mockPosts = [
      {
        id: `mock-${Date.now()}-1`,
        source: SocialSource.Twitter,
        author: '@WeatherIndia',
        content: 'High wave alert issued for Chennai coast. Waves up to 3.5 meters expected. Fishermen advised not to venture into sea. #ChennaiWeather #HighWaves #SafetyAlert',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        location: 'Chennai',
        sentiment: Sentiment.Negative,
        keywords: ['high waves', 'alert', 'safety', 'fishermen']
      },
      {
        id: `mock-${Date.now()}-2`,
        source: SocialSource.Reddit,
        author: 'u/MumbaiResident',
        content: 'Massive waves hitting Marine Drive right now! Never seen anything like this. The sea wall is completely submerged. #MumbaiFloods #MarineDrive',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
        location: 'Mumbai',
        sentiment: Sentiment.Negative,
        keywords: ['massive waves', 'marine drive', 'flooding', 'sea wall']
      },
      {
        id: `mock-${Date.now()}-3`,
        source: SocialSource.Twitter,
        author: '@IMDWeather',
        content: 'Cyclone warning: Depression over Bay of Bengal likely to intensify. Coastal areas of Tamil Nadu and Andhra Pradesh on high alert. #CycloneAlert #BayOfBengal',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        location: 'Bay of Bengal',
        sentiment: Sentiment.Negative,
        keywords: ['cyclone', 'warning', 'depression', 'high alert']
      },
      {
        id: `mock-${Date.now()}-4`,
        source: SocialSource.Facebook,
        author: 'Kerala Disaster Management',
        content: 'Coastal flooding reported in Kochi due to high tide and strong winds. Emergency teams deployed. Residents in low-lying areas advised to move to safer locations.',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
        location: 'Kochi, Kerala',
        sentiment: Sentiment.Negative,
        keywords: ['coastal flooding', 'high tide', 'emergency', 'evacuation']
      },
      {
        id: `mock-${Date.now()}-5`,
        source: SocialSource.Twitter,
        author: '@CoastGuardIndia',
        content: 'Successful rescue operation completed. 15 fishermen safely brought back to shore from rough seas near Visakhapatnam. Great work by our rescue teams! 🚁⚓',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
        location: 'Visakhapatnam',
        sentiment: Sentiment.Positive,
        keywords: ['rescue', 'fishermen', 'rough seas', 'coast guard']
      }
    ];
    
    return mockPosts;
  }

  /**
   * Main function to fetch all social media data
   */
  static async fetchAllSocialData(): Promise<SocialMediaPost[]> {
    console.log('🔍 Loading social media data...');
    
    // For now, use only mock data to avoid CORS issues
    // External API calls would need to be moved to backend
    const mockData = this.generateRealisticMockData();
    console.log(`✅ Loaded ${mockData.length} social media posts`);
    
    return mockData;
  }

  /**
   * Check if content is hazard-related
   */
  private static isHazardRelated(content: string): boolean {
    const lowerContent = content.toLowerCase();
    const hazardKeywords = [
      'tsunami', 'flood', 'cyclone', 'storm', 'hurricane', 'typhoon',
      'high waves', 'storm surge', 'coastal', 'evacuation', 'emergency',
      'disaster', 'warning', 'alert', 'rescue', 'sea level', 'tide'
    ];
    
    return hazardKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Simple sentiment analysis
   */
  private static analyzeSentiment(text: string): Sentiment {
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
    
    if (negativeCount > positiveCount) return Sentiment.Negative;
    if (positiveCount > negativeCount) return Sentiment.Positive;
    return Sentiment.Neutral;
  }

  /**
   * Extract relevant keywords from text
   */
  private static extractKeywords(text: string): string[] {
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
    
    return [...new Set(keywords)]; // Remove duplicates
  }
}
