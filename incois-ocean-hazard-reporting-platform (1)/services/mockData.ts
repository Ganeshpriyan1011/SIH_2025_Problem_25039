import { Report, HazardType, Role, SocialMediaPost, Sentiment, SocialSource } from '../types';
import { HAZARD_TYPES } from '../constants';

const CITIES = [
  'Mumbai', 'Chennai', 'Kolkata', 'Kochi', 'Visakhapatnam', 'Goa',
  'Puducherry', 'Mangalore', 'Kanyakumari', 'Rameswaram', 'Puri'
];

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const SOCIAL_MESSAGES = [
    { text: "The sea level in #Chennai is rising alarmingly fast! #Cyclone #StormSurge", keywords: ["cyclone", "stormsurge"], sentiment: Sentiment.Negative },
    { text: "Huge waves at Marina Beach, stay safe everyone. #HighWaves #SafetyFirst", keywords: ["waves", "safety"], sentiment: Sentiment.Neutral },
    { text: "Just saw a tsunami warning on the news for the east coast. Is this confirmed? #Tsunami #India", keywords: ["tsunami", "warning"], sentiment: Sentiment.Negative },
    { text: "The government has issued a coastal flooding alert for parts of #Kerala. #Flooding", keywords: ["flooding", "alert"], sentiment: Sentiment.Neutral },
    { text: "Amazing job by the rescue teams helping people during the #MumbaiFloods. True heroes! #CoastalFlooding", keywords: ["rescue", "flooding"], sentiment: Sentiment.Positive },
    { text: "The ocean is looking really rough today in #Goa. Be careful out there. #HighWaves", keywords: ["waves", "roughsea"], sentiment: Sentiment.Neutral },
    { text: "Hearing reports of a #StormSurge near #Kolkata. Can anyone on the ground confirm?", keywords: ["stormsurge", "kolkata"], sentiment: Sentiment.Neutral },
];

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

const COASTAL_LOCATIONS: LocationData[] = [
  { name: 'Marina Beach, Chennai', lat: 13.05, lng: 80.28 },
  { name: 'Juhu Beach, Mumbai', lat: 19.10, lng: 72.82 },
  { name: 'Puri Beach, Odisha', lat: 19.80, lng: 85.83 },
  { name: 'Kovalam, Kerala', lat: 8.40, lng: 76.97 },
  { name: 'Gokarna, Karnataka', lat: 14.54, lng: 74.31 },
  { name: 'Rameswaram, TN', lat: 9.28, lng: 79.31 },
  { name: 'Vizag, AP', lat: 17.72, lng: 83.32 },
  { name: 'Calangute Beach, Goa', lat: 15.54, lng: 73.76 },
  { name: 'Digha, West Bengal', lat: 21.62, lng: 87.52 },
  { name: 'Somnath, Gujarat', lat: 20.88, lng: 70.40 }
];

export const generateInitialReports = (count: number): Report[] => {
    const reports: Report[] = [];
    const authors = [
        { name: 'Ramesh', role: Role.Citizen },
        { name: 'Priya', role: Role.Citizen },
        { name: 'Dr. Anand', role: Role.Analyst },
        { name: 'Officer Singh', role: Role.Official },
    ];

    for (let i = 0; i < count; i++) {
        const authorInfo = getRandomElement(authors);
        const hazard = getRandomElement(HAZARD_TYPES);
        const isOfficial = authorInfo.role !== Role.Citizen;
        
        // Pick a location from our structured data
        const locationData = getRandomElement(COASTAL_LOCATIONS);
        
        // Add a small random offset to make the points not overlap perfectly
        const latOffset = (Math.random() - 0.5) * 0.1; // approx +/- 5.5 km
        const lngOffset = (Math.random() - 0.5) * 0.1; // approx +/- 5.5 km

        reports.push({
            id: `report-${Date.now()}-${i}`,
            author: authorInfo.name,
            role: authorInfo.role,
            hazard,
            description: `This is a sample report for ${hazard}. Observations include unusual water levels and strong winds. Requesting verification from authorities. Location is approximate.`,
            summary: `Potential ${hazard} event observed near ${locationData.name}.`,
            location: {
                lat: locationData.lat + latOffset,
                lng: locationData.lng + lngOffset,
                name: locationData.name
            },
            timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(),
            verified: isOfficial ? true : false, // Citizens reports start unverified
            confidence: isOfficial ? 75 + Math.floor(Math.random() * 20) : 20 + Math.floor(Math.random() * 30),
            image: `https://picsum.photos/seed/${i+10}/400/300`,
        });
    }
    return reports;
};

export const generateSocialMediaPosts = (count: number): SocialMediaPost[] => {
    const posts: SocialMediaPost[] = [];
    for (let i = 0; i < count; i++) {
        const template = getRandomElement(SOCIAL_MESSAGES);
        posts.push({
            id: `social-${Date.now()}-${i}`,
            source: getRandomElement([SocialSource.Twitter, SocialSource.Reddit, SocialSource.Facebook]),
            author: `@user${Math.floor(Math.random() * 1000)}`,
            content: template.text,
            timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 12).toISOString(),
            location: getRandomElement(CITIES),
            sentiment: template.sentiment,
            keywords: template.keywords,
        });
    }
    return posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};