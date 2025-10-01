// Define types locally to avoid import issues
interface Report {
  id: string;
  hazard: string;
  description: string;
  location: { lat: number; lng: number; name: string };
  timestamp: Date;
  isVerified: boolean;
  author: string;
  role: string;
  summary: string;
  image?: string;
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
import { v4 as uuidv4 } from 'uuid';

export interface OfflineReport {
  id: string;
  tempId: string; // Temporary ID for offline use
  userId: string;
  hazard: HazardType;
  description: string;
  location: {
    lat: number;
    lng: number;
    name: string;
    accuracy?: number; // GPS accuracy in meters
  };
  timestamp: Date;
  images: Array<{
    tempPath: string;
    base64?: string;
    size: number;
    type: string;
  }>;
  deviceInfo: {
    platform: string;
    version: string;
    connectivity: 'offline' | 'poor' | 'good';
    batteryLevel?: number;
  };
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncAttempt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<{
    tempId: string;
    error: string;
  }>;
}

export interface OfflineConfig {
  maxStorageSize: number; // MB
  maxRetryAttempts: number;
  syncBatchSize: number;
  compressionEnabled: boolean;
  autoSyncInterval: number; // minutes
}

class OfflineService {
  private config: OfflineConfig = {
    maxStorageSize: 100, // 100MB
    maxRetryAttempts: 3,
    syncBatchSize: 10,
    compressionEnabled: true,
    autoSyncInterval: 15 // 15 minutes
  };

  private pendingReports: Map<string, OfflineReport> = new Map();
  private syncQueue: string[] = [];
  private isSyncing = false;

  /**
   * Store report for offline use
   */
  public async storeOfflineReport(reportData: {
    userId: string;
    hazard: HazardType;
    description: string;
    location: {
      lat: number;
      lng: number;
      name: string;
      accuracy?: number;
    };
    images?: Array<{
      tempPath: string;
      base64?: string;
      size: number;
      type: string;
    }>;
    deviceInfo: {
      platform: string;
      version: string;
      connectivity: 'offline' | 'poor' | 'good';
      batteryLevel?: number;
    };
  }): Promise<OfflineReport> {
    const tempId = `offline_${Date.now()}_${uuidv4()}`;
    
    const offlineReport: OfflineReport = {
      id: '', // Will be assigned when synced
      tempId,
      userId: reportData.userId,
      hazard: reportData.hazard,
      description: reportData.description,
      location: reportData.location,
      timestamp: new Date(),
      images: reportData.images || [],
      deviceInfo: reportData.deviceInfo,
      syncStatus: 'pending',
      syncAttempts: 0,
      priority: this.calculatePriority(reportData.hazard, reportData.description)
    };

    // Compress images if enabled
    if (this.config.compressionEnabled && offlineReport.images.length > 0) {
      offlineReport.images = await this.compressImages(offlineReport.images);
    }

    // Check storage limits
    await this.enforceStorageLimit();

    // Store the report
    this.pendingReports.set(tempId, offlineReport);
    this.syncQueue.push(tempId);

    // Sort sync queue by priority
    this.sortSyncQueueByPriority();

    logger.info(`Stored offline report: ${tempId} (Priority: ${offlineReport.priority})`);
    
    // Attempt immediate sync if connectivity allows
    if (reportData.deviceInfo.connectivity !== 'offline') {
      this.attemptSync();
    }

    return offlineReport;
  }

  /**
   * Sync pending reports to server
   */
  public async syncPendingReports(): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.info('Sync already in progress');
      return { success: false, syncedCount: 0, failedCount: 0, errors: [] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: []
    };

    try {
      // Get reports to sync (batch processing)
      const reportsToSync = this.getNextSyncBatch();
      
      logger.info(`Starting sync of ${reportsToSync.length} reports`);

      for (const report of reportsToSync) {
        try {
          report.syncStatus = 'syncing';
          report.lastSyncAttempt = new Date();
          report.syncAttempts++;

          // Convert offline report to standard report format
          const serverReport = await this.convertToServerReport(report);
          
          // Sync to server (this would call your actual API)
          const syncedReport = await this.syncReportToServer(serverReport);
          
          // Update local record
          report.id = syncedReport.id;
          report.syncStatus = 'synced';
          result.syncedCount++;

          // Remove from pending queue
          this.pendingReports.delete(report.tempId);
          this.removeFromSyncQueue(report.tempId);

          logger.info(`Successfully synced report: ${report.tempId} -> ${report.id}`);

        } catch (error) {
          report.syncStatus = 'failed';
          result.failedCount++;
          result.errors.push({
            tempId: report.tempId,
            error: (error as Error).message
          });

          // Remove from queue if max attempts reached
          if (report.syncAttempts >= this.config.maxRetryAttempts) {
            logger.error(`Max sync attempts reached for report: ${report.tempId}`);
            this.removeFromSyncQueue(report.tempId);
          } else {
            // Reset status for retry
            report.syncStatus = 'pending';
          }

          logger.error(`Failed to sync report ${report.tempId}:`, error);
        }
      }

      result.success = result.failedCount === 0;

    } catch (error) {
      logger.error('Sync process failed:', error);
      result.success = false;
    } finally {
      this.isSyncing = false;
    }

    logger.info(`Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);
    return result;
  }

  /**
   * Get pending reports for display
   */
  public getPendingReports(): OfflineReport[] {
    return Array.from(this.pendingReports.values())
      .sort((a, b) => {
        // Sort by priority first, then by timestamp
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }

  /**
   * Get sync statistics
   */
  public getSyncStats(): {
    totalPending: number;
    byStatus: {[key: string]: number};
    byPriority: {[key: string]: number};
    totalStorageUsed: number; // MB
  } {
    const reports = Array.from(this.pendingReports.values());
    
    const byStatus: {[key: string]: number} = {};
    const byPriority: {[key: string]: number} = {};
    let totalSize = 0;

    for (const report of reports) {
      byStatus[report.syncStatus] = (byStatus[report.syncStatus] || 0) + 1;
      byPriority[report.priority] = (byPriority[report.priority] || 0) + 1;
      
      // Calculate storage size
      totalSize += JSON.stringify(report).length;
      for (const image of report.images) {
        totalSize += image.size;
      }
    }

    return {
      totalPending: reports.length,
      byStatus,
      byPriority,
      totalStorageUsed: Math.round(totalSize / (1024 * 1024) * 100) / 100 // MB
    };
  }

  /**
   * Clear synced reports from local storage
   */
  public clearSyncedReports(): number {
    const syncedReports = Array.from(this.pendingReports.entries())
      .filter(([_, report]) => report.syncStatus === 'synced');
    
    for (const [tempId, _] of syncedReports) {
      this.pendingReports.delete(tempId);
      this.removeFromSyncQueue(tempId);
    }

    logger.info(`Cleared ${syncedReports.length} synced reports`);
    return syncedReports.length;
  }

  /**
   * Force retry failed reports
   */
  public retryFailedReports(): void {
    const failedReports = Array.from(this.pendingReports.values())
      .filter(report => report.syncStatus === 'failed');

    for (const report of failedReports) {
      report.syncStatus = 'pending';
      report.syncAttempts = 0; // Reset attempts
      
      if (!this.syncQueue.includes(report.tempId)) {
        this.syncQueue.push(report.tempId);
      }
    }

    this.sortSyncQueueByPriority();
    logger.info(`Reset ${failedReports.length} failed reports for retry`);
  }

  /**
   * Delete specific offline report
   */
  public deleteOfflineReport(tempId: string): boolean {
    const deleted = this.pendingReports.delete(tempId);
    this.removeFromSyncQueue(tempId);
    
    if (deleted) {
      logger.info(`Deleted offline report: ${tempId}`);
    }
    
    return deleted;
  }

  /**
   * Update offline service configuration
   */
  public updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info(`Updated offline service configuration: ${JSON.stringify(this.config)}`);
  }

  // Private helper methods

  private calculatePriority(hazard: HazardType, description: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalHazards = [HazardType.Tsunami, HazardType.Earthquake];
    const highHazards = [HazardType.Cyclone, HazardType.StormSurge];
    
    if (criticalHazards.includes(hazard)) return 'critical';
    if (highHazards.includes(hazard)) return 'high';
    
    // Check description for urgency keywords
    const urgentKeywords = ['emergency', 'urgent', 'immediate', 'danger', 'evacuate'];
    const lowerDescription = description.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'high';
    }
    
    return 'medium';
  }

  private sortSyncQueueByPriority(): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    this.syncQueue.sort((a, b) => {
      const reportA = this.pendingReports.get(a);
      const reportB = this.pendingReports.get(b);
      
      if (!reportA || !reportB) return 0;
      
      const priorityDiff = priorityOrder[reportB.priority] - priorityOrder[reportA.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by timestamp (newer first)
      return new Date(reportB.timestamp).getTime() - new Date(reportA.timestamp).getTime();
    });
  }

  private getNextSyncBatch(): OfflineReport[] {
    const batchIds = this.syncQueue
      .filter(id => {
        const report = this.pendingReports.get(id);
        return report && report.syncStatus === 'pending';
      })
      .slice(0, this.config.syncBatchSize);

    return batchIds
      .map(id => this.pendingReports.get(id))
      .filter(report => report !== undefined) as OfflineReport[];
  }

  private removeFromSyncQueue(tempId: string): void {
    const index = this.syncQueue.indexOf(tempId);
    if (index > -1) {
      this.syncQueue.splice(index, 1);
    }
  }

  private async compressImages(images: Array<{
    tempPath: string;
    base64?: string;
    size: number;
    type: string;
  }>): Promise<Array<{
    tempPath: string;
    base64?: string;
    size: number;
    type: string;
  }>> {
    // Simple compression simulation - in real implementation, use image compression library
    return images.map(image => ({
      ...image,
      size: Math.round(image.size * 0.7) // Simulate 30% compression
    }));
  }

  private async enforceStorageLimit(): Promise<void> {
    const stats = this.getSyncStats();
    
    if (stats.totalStorageUsed > this.config.maxStorageSize) {
      // Remove oldest low-priority synced reports first
      const reportsToRemove = Array.from(this.pendingReports.entries())
        .filter(([_, report]) => report.syncStatus === 'synced' && report.priority === 'low')
        .sort(([_, a], [__, b]) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(0, 5); // Remove up to 5 old reports

      for (const [tempId, _] of reportsToRemove) {
        this.pendingReports.delete(tempId);
      }

      logger.info(`Removed ${reportsToRemove.length} old reports to free storage`);
    }
  }

  private async convertToServerReport(offlineReport: OfflineReport): Promise<Omit<Report, 'id'>> {
    return {
      hazard: offlineReport.hazard,
      description: offlineReport.description,
      location: {
        lat: offlineReport.location.lat,
        lng: offlineReport.location.lng,
        name: offlineReport.location.name
      },
      timestamp: offlineReport.timestamp,
      isVerified: false,
      author: offlineReport.userId,
      role: 'citizen', // Default role for offline reports
      summary: offlineReport.description.substring(0, 100) + '...', // Simple summary
      image: offlineReport.images.length > 0 ? offlineReport.images[0].base64 : undefined
    };
  }

  private async syncReportToServer(report: Omit<Report, 'id'>): Promise<Report> {
    // This would be replaced with actual API call to your backend
    // For now, simulate the sync
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    return {
      ...report,
      id: `synced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private attemptSync(): void {
    // Debounced sync attempt
    setTimeout(() => {
      if (!this.isSyncing && this.syncQueue.length > 0) {
        this.syncPendingReports();
      }
    }, 2000);
  }
}

export const offlineService = new OfflineService();
