import { Report, SocialMediaPost, HazardType, Role, User } from '../types';
import { generateSocialMediaPosts, generateInitialReports } from './mockData';

// This log confirms that the correct, non-Azure backend is being used.
console.log("Initializing apiService with Local Storage backend (v2).");

// --- LOCAL STORAGE SETUP (v2) ---
// Keys have been updated to prevent conflicts with any previously cached data.
const REPORTS_KEY = 'incois-reports-v2';
const USERS_KEY = 'incois-users-v2';

// Helper function to read from localStorage
const readLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Helper function to write to localStorage
const writeLocalStorage = (key: string, data: any): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

// --- API IMPLEMENTATION ---

export const fetchInitialData = async (): Promise<{ reports: Report[]; socialMediaPosts: SocialMediaPost[] }> => {
    // Reports are fetched from Local Storage.
    let reports = readLocalStorage<Report[]>(REPORTS_KEY, []);

    // If no reports exist, populate with initial mock data and save it.
    if (reports.length === 0) {
        reports = generateInitialReports(20);
        writeLocalStorage(REPORTS_KEY, reports);
    }

    // Social media posts are still generated locally to simulate a live feed.
    const socialMediaPosts = generateSocialMediaPosts(50);
    
    reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { reports, socialMediaPosts };
};

export const registerUser = async (username: string, role: Role): Promise<User> => {
    const users = readLocalStorage<User[]>(USERS_KEY, []);
    
    if (users.find(u => u.name.toLowerCase() === username.toLowerCase())) {
        throw new Error("Username already exists.");
    }
    
    const newUser: User = { id: `user-${Date.now()}`, name: username, role, avatar: undefined };
    users.push(newUser);
    
    writeLocalStorage(USERS_KEY, users);
    
    return newUser;
};

export const loginUser = async (username: string, role: Role): Promise<User> => {
    const users = readLocalStorage<User[]>(USERS_KEY, []);
    const user = users.find(u => u.name.toLowerCase() === username.toLowerCase() && u.role === role);
    
    if (user) {
        return user;
    } else {
        // To allow first-time analyst login if no users exist
        if (users.length === 0 && role === Role.Analyst) {
             const newAnalyst = await registerUser(username, role);
             return newAnalyst;
        }
        throw new Error("Invalid username or role. Please register if you are a new user.");
    }
};

export const updateUser = async (userId: string, updatedData: { name?: string; avatar?: string }): Promise<User> => {
    const users = readLocalStorage<User[]>(USERS_KEY, []);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        throw new Error("User not found.");
    }

    // Create a new object with the updated data
    const updatedUser = { 
        ...users[userIndex], 
        ...updatedData 
    };
    
    users[userIndex] = updatedUser;

    writeLocalStorage(USERS_KEY, users);
    
    return updatedUser;
};

export const submitNewReport = async (reportData: {
  hazard: HazardType;
  description: string;
  location: { lat: number; lng: number; name: string };
  image?: string; // Base64 string
  author: string;
  role: Role;
  summary: string;
}): Promise<Report> => {
    const reports = readLocalStorage<Report[]>(REPORTS_KEY, []);
    
    const isOfficial = reportData.role !== Role.Citizen;
    const newReport: Report = {
        ...reportData,
        id: `report-${Date.now()}`,
        timestamp: new Date().toISOString(),
        verified: isOfficial,
        confidence: isOfficial ? 75 : 30 + Math.floor(Math.random() * 20),
    };
    
    reports.unshift(newReport); // Add to the beginning of the array
    
    writeLocalStorage(REPORTS_KEY, reports);
    
    return newReport;
};

export const verifyReportById = async (reportId: string): Promise<Report> => {
    const reports = readLocalStorage<Report[]>(REPORTS_KEY, []);
    const reportIndex = reports.findIndex(r => r.id === reportId);

    if (reportIndex === -1) {
        throw new Error("Report not found.");
    }
    
    const originalReport = reports[reportIndex];
    
    // Update the report
    const updatedReport: Report = {
        ...originalReport,
        verified: true,
        // Increase confidence, but cap at 100
        confidence: Math.min(originalReport.confidence + 25, 100), 
    };

    reports[reportIndex] = updatedReport;
    
    writeLocalStorage(REPORTS_KEY, reports);

    return updatedReport;
};