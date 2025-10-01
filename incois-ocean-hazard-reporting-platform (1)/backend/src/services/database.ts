import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: 'citizen' | 'analyst' | 'official' | 'SuperAdmin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  employeeId?: string; // For admin users (analysts and officials)
  approvalStatus?: 'pending' | 'approved' | 'rejected'; // For officials/analysts awaiting approval
  approvedBy?: string; // Super admin who approved
  approvedAt?: string; // Approval timestamp
  rejectionReason?: string; // Reason for rejection
}

export interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: string;
  attempts: number;
  // When registering non-test users, we defer user creation until OTP verification.
  // Store the pending user data alongside the OTP so we can create the account after verification.
  pendingUserData?: {
    email: string;
    password: string; // hashed password
    name: string;
    role: 'citizen' | 'analyst' | 'official' | 'SuperAdmin';
  };
}

export interface Report {
  id: string;
  author: string;
  authorId: string;
  role: string;
  hazard: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  timestamp: string;
  image?: string;
  verified: boolean;
  summary: string;
  confidence: number;
}

class DatabaseService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.CONTAINER_NAME || 'user-data';
    
    if (!connectionString) {
      throw new Error('Azure Storage connection string is required');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    
    this.initializeContainer();
  }

  private async initializeContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
      logger.info(`Container ${this.containerName} initialized successfully`);
    } catch (error) {
      logger.error('Failed to initialize container:', error);
      throw error;
    }
  }

  private async readJsonBlob<T>(blobName: string, defaultValue: T): Promise<T> {
    try {
      const blobClient = this.containerClient.getBlobClient(blobName);
      const downloadResponse = await blobClient.download();
      
      if (downloadResponse.readableStreamBody) {
        const chunks: Buffer[] = [];
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(Buffer.from(chunk));
        }
        const content = Buffer.concat(chunks).toString();
        return JSON.parse(content);
      }
      
      return defaultValue;
    } catch (error: any) {
      if (error.statusCode === 404) {
        // Blob doesn't exist, return default value
        return defaultValue;
      }
      logger.error(`Error reading blob ${blobName}:`, error);
      throw error;
    }
  }

  private async writeJsonBlob<T>(blobName: string, data: T): Promise<void> {
    try {
      const blobClient = this.containerClient.getBlobClient(blobName);
      const content = JSON.stringify(data, null, 2);
      
      const blockBlobClient = blobClient.getBlockBlobClient();
      await blockBlobClient.upload(content, content.length, {
        blobHTTPHeaders: {
          blobContentType: 'application/json'
        }
      });
    } catch (error) {
      logger.error(`Error writing blob ${blobName}:`, error);
      throw error;
    }
  }

  // User operations
  async getAllUsers(): Promise<User[]> {
    return this.readJsonBlob<User[]>('users.json', []);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.id === id) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = await this.getAllUsers();
    
    // Check if user already exists
    const existingUser = users.find(user => user.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    await this.writeJsonBlob('users.json', users);
    
    return newUser;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return null;
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.writeJsonBlob('users.json', users);
    return users[userIndex];
  }

  // OTP operations
  async getAllOTPs(): Promise<OTPRecord[]> {
    return this.readJsonBlob<OTPRecord[]>('otps.json', []);
  }

  async saveOTP(otpRecord: OTPRecord): Promise<void> {
    const otps = await this.getAllOTPs();
    
    // Remove any existing OTP for this email
    const filteredOTPs = otps.filter(otp => otp.email.toLowerCase() !== otpRecord.email.toLowerCase());
    
    // Add new OTP
    filteredOTPs.push(otpRecord);
    
    await this.writeJsonBlob('otps.json', filteredOTPs);
  }

  async getOTP(email: string): Promise<OTPRecord | null> {
    const otps = await this.getAllOTPs();
    return otps.find(otp => otp.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async deleteOTP(email: string): Promise<void> {
    const otps = await this.getAllOTPs();
    const filteredOTPs = otps.filter(otp => otp.email.toLowerCase() !== email.toLowerCase());
    await this.writeJsonBlob('otps.json', filteredOTPs);
  }

  async incrementOTPAttempts(email: string): Promise<void> {
    const otps = await this.getAllOTPs();
    const otpIndex = otps.findIndex(otp => otp.email.toLowerCase() === email.toLowerCase());
    
    if (otpIndex !== -1) {
      otps[otpIndex].attempts += 1;
      await this.writeJsonBlob('otps.json', otps);
    }
  }

  // Report operations
  async getAllReports(): Promise<Report[]> {
    return this.readJsonBlob<Report[]>('reports.json', []);
  }

  async getReportById(id: string): Promise<Report | null> {
    const reports = await this.getAllReports();
    return reports.find(report => report.id === id) || null;
  }

  async createReport(reportData: Omit<Report, 'id' | 'timestamp'>): Promise<Report> {
    const reports = await this.getAllReports();
    
    const newReport: Report = {
      ...reportData,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    reports.unshift(newReport); // Add to beginning
    await this.writeJsonBlob('reports.json', reports);
    
    return newReport;
  }

  async updateReport(id: string, updates: Partial<Omit<Report, 'id'>>): Promise<Report | null> {
    const reports = await this.getAllReports();
    const reportIndex = reports.findIndex(report => report.id === id);
    
    if (reportIndex === -1) {
      return null;
    }

    reports[reportIndex] = {
      ...reports[reportIndex],
      ...updates
    };

    await this.writeJsonBlob('reports.json', reports);
    return reports[reportIndex];
  }

  // Cleanup expired OTPs
  async cleanupExpiredOTPs(): Promise<void> {
    const otps = await this.getAllOTPs();
    const now = new Date();
    
    const validOTPs = otps.filter(otp => new Date(otp.expiresAt) > now);
    
    if (validOTPs.length !== otps.length) {
      await this.writeJsonBlob('otps.json', validOTPs);
      logger.info(`Cleaned up ${otps.length - validOTPs.length} expired OTPs`);
    }
  }

  // Approval system methods
  async getPendingApprovals(): Promise<User[]> {
    const users = await this.getAllUsers();
    return users.filter(user => 
      (user.role === 'official' || user.role === 'analyst') && 
      user.approvalStatus === 'pending'
    );
  }

  async approveUser(userId: string, approvedBy: string): Promise<User | null> {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return null;
    }

    const user = users[userIndex];
    
    // Only approve if currently pending
    if (user.approvalStatus !== 'pending') {
      return null;
    }

    // Update user with approval details
    users[userIndex] = {
      ...user,
      approvalStatus: 'approved',
      isVerified: true,
      approvedBy,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.writeJsonBlob('users.json', users);
    return users[userIndex];
  }

  async rejectUser(userId: string, rejectedBy: string, reason?: string): Promise<User | null> {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return null;
    }

    const user = users[userIndex];
    
    // Only reject if currently pending
    if (user.approvalStatus !== 'pending') {
      return null;
    }

    // Update user with rejection details
    users[userIndex] = {
      ...user,
      approvalStatus: 'rejected',
      isVerified: false,
      approvedBy: rejectedBy,
      approvedAt: new Date().toISOString(),
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    };

    await this.writeJsonBlob('users.json', users);
    return users[userIndex];
  }
}

export const db = new DatabaseService();
