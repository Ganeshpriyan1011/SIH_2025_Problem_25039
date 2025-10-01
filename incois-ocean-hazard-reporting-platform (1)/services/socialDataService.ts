import { SocialMediaPost, SocialSource, Sentiment } from '../types';

// API Configuration - Use environment variables or fallback
const YOUTUBE_API_KEY = 'AIzaSyBvuYpuVFV_fAuRuOninkshh7GPWC_zceY';
const TWITTER_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAKDG4AEAAAAAvxjd4d9gDkC66oKt8%2FWW1gD%2BZdM%3DgILrw4QH98CcmpqpdZ3nG6q6MSPDYf1mDW7P4hXFsYnxYevUyk';
const REDDIT_CLIENT_ID = 'YRqNg6Ua32S24TQPuhsNLw';
const REDDIT_CLIENT_SECRET = 'JyLRKC_gUQYNQEVjb9cM_lbfXc1IIg';

// Hazard-related search terms
const HAZARD_SEARCH_TERMS = [
  'tsunami India',
  'coastal flooding India',
  'storm surge India',
  'high waves India coast',
  'cyclone India coast',
  'sea level rise India',
  'coastal erosion India',
  'marine disaster India'
];

export class SocialDataService {
  /**
   * Fetches hazard-related posts from YouTube
   */
  static async fetchYouTubeData(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    try {
      for (const searchTerm of HAZARD_SEARCH_TERMS.slice(0, 3)) { // Limit to avoid quota issues
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchTerm)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}&regionCode=IN&relevanceLanguage=en`
        );
        
        if (!response.ok) {
          console.warn(`YouTube API request failed for "${searchTerm}":`, response.status);
          continue;
        }
        
        const data = await response.json();
        
        if (data.items) {
          data.items.forEach((item: any) => {
            posts.push({
              id: `youtube-${item.id.videoId}`,
              source: SocialSource.YouTube,
              author: item.snippet.channelTitle,
              content: `${item.snippet.title} - ${item.snippet.description.substring(0, 200)}...`,
              timestamp: item.snippet.publishedAt,
              location: 'India',
              sentiment: this.analyzeSentiment(item.snippet.title + ' ' + item.snippet.description),
              keywords: this.extractKeywords(item.snippet.title + ' ' + item.snippet.description)
            });
          });
        }
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
    }
    
    return posts;
  }

  /**
   * Fetches hazard-related posts from Twitter (X)
   * Note: Twitter API v2 requires different authentication
   */
  static async fetchTwitterData(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    try {
      // Note: This is a simplified example. Real Twitter API v2 implementation would be more complex
      const searchQuery = HAZARD_SEARCH_TERMS.slice(0, 2).join(' OR ');
      
      const response = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&tweet.fields=created_at,author_id,public_metrics&user.fields=username&expansions=author_id&max_results=10`,
        {
          headers: {
            'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.warn('Twitter API request failed:', response.status);
        return posts;
      }
      
      const data = await response.json();
      
      if (data.data && data.includes?.users) {
        const userMap = new Map(data.includes.users.map((user: any) => [user.id, user]));
        
        data.data.forEach((tweet: any) => {
          const user = userMap.get(tweet.author_id);
          posts.push({
            id: `twitter-${tweet.id}`,
            source: SocialSource.Twitter,
            author: user ? `@${user.username}` : 'Unknown',
            content: tweet.text,
            timestamp: tweet.created_at,
            location: 'India', // Would need geo data from API
            sentiment: this.analyzeSentiment(tweet.text),
            keywords: this.extractKeywords(tweet.text)
          });
        });
      }
    } catch (error) {
      console.error('Error fetching Twitter data:', error);
    }
    
    return posts;
  }

  /**
   * Fetches Reddit posts related to hazards
   * Using Reddit's public JSON API
   */
  static async fetchRedditData(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    
    try {
      const subreddits = ['india', 'IndiaSpeaks', 'Chennai', 'mumbai', 'kolkata'];
      
      for (const subreddit of subreddits.slice(0, 2)) {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/search.json?q=tsunami OR flood OR cyclone OR storm&sort=new&limit=5&restrict_sr=1`
        );
        
        if (!response.ok) {
          console.warn(`Reddit API request failed for r/${subreddit}:`, response.status);
          continue;
        }
        
        const data = await response.json();
        
        if (data.data?.children) {
          data.data.children.forEach((child: any) => {
            const post = child.data;
            posts.push({
              id: `reddit-${post.id}`,
              source: SocialSource.Reddit,
              author: `u/${post.author}`,
              content: `${post.title} ${post.selftext ? '- ' + post.selftext.substring(0, 200) + '...' : ''}`,
              timestamp: new Date(post.created_utc * 1000).toISOString(),
              location: `r/${subreddit}`,
              sentiment: this.analyzeSentiment(post.title + ' ' + post.selftext),
              keywords: this.extractKeywords(post.title + ' ' + post.selftext)
            });
          });
        }
      }
    } catch (error) {
      console.error('Error fetching Reddit data:', error);
    }
    
    return posts;
  }

  /**
   * Simple sentiment analysis
   */
  private static analyzeSentiment(text: string): Sentiment {
    const lowerText = text.toLowerCase();
    
    const negativeWords = ['disaster', 'emergency', 'danger', 'warning', 'alert', 'evacuation', 'damage', 'destroy', 'flood', 'tsunami', 'storm', 'crisis'];
    const positiveWords = ['safe', 'rescue', 'help', 'support', 'recovery', 'relief', 'saved', 'secure'];
    
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
    
    const hazardKeywords = [
      'tsunami', 'flood', 'storm', 'cyclone', 'waves', 'surge', 'current', 'tide',
      'evacuation', 'emergency', 'warning', 'alert', 'rescue', 'disaster', 'coast'
    ];
    
    hazardKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Fetches data from all sources
   */
  static async fetchAllSocialData(): Promise<SocialMediaPost[]> {
    console.log('Fetching social media data from all sources...');
    
    const [youtubeData, twitterData, redditData] = await Promise.allSettled([
      this.fetchYouTubeData(),
      this.fetchTwitterData(),
      this.fetchRedditData()
    ]);
    
    const allPosts: SocialMediaPost[] = [];
    
    if (youtubeData.status === 'fulfilled') {
      allPosts.push(...youtubeData.value);
      console.log(`Fetched ${youtubeData.value.length} YouTube posts`);
    } else {
      console.error('YouTube data fetch failed:', youtubeData.reason);
    }
    
    if (twitterData.status === 'fulfilled') {
      allPosts.push(...twitterData.value);
      console.log(`Fetched ${twitterData.value.length} Twitter posts`);
    } else {
      console.error('Twitter data fetch failed:', twitterData.reason);
    }
    
    if (redditData.status === 'fulfilled') {
      allPosts.push(...redditData.value);
      console.log(`Fetched ${redditData.value.length} Reddit posts`);
    } else {
      console.error('Reddit data fetch failed:', redditData.reason);
    }
    
    // Sort by timestamp (newest first)
    return allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
