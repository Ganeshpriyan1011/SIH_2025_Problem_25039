import React, { useState, useEffect, useCallback, useRef } from "react";
import { Upload, AlertTriangle, CheckCircle, XCircle, Loader2, Camera, Info, Waves, Cloud, Zap, Wifi, WifiOff, Clock, Trash2 } from "lucide-react";

// Leaflet Map Components - Production Ready
const MapContainer = ({ center, zoom, style, children, onClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = () => initializeMap();
        document.head.appendChild(script);
      } else if (window.L) {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix for default markers
      delete window.L.Icon.Default.prototype._getIconUrl;
      window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Initialize map
      mapInstanceRef.current = window.L.map(mapRef.current).setView(center, zoom);

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Add click handler
      if (onClick) {
        mapInstanceRef.current.on('click', (e) => {
          onClick(e.latlng);
        });
      }
    };

    loadLeaflet();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update marker when children change
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Add new marker if position exists
      const markerData = React.Children.toArray(children).find(
        child => child.type === MapMarker
      );
      
      if (markerData && markerData.props.position) {
        const { lat, lng } = markerData.props.position;
        markerRef.current = window.L.marker([lat, lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    }
  }, [children]);

  return (
    <div 
      ref={mapRef} 
      style={style} 
      className="rounded-lg border-2 border-gray-300 z-10"
    />
  );
};

const MapMarker = ({ position }) => {
  // This component is just for prop passing to MapContainer
  return null;
};

// Alert Component
const Alert = ({ type, children, className = "" }) => {
  const baseClasses = "p-4 rounded-lg border flex items-center space-x-3 animate-in fade-in duration-200";
  const typeClasses = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1">{children}</div>
    </div>
  );
};

// Loading Button Component
const LoadingButton = ({ loading, children, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className={`${props.className} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200`}
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
    <span>{children}</span>
  </button>
);

// File Preview Component
const FilePreview = ({ file }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return;
    
    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
    
    return () => setPreview(null);
  }, [file]);

  if (!file) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {file.type && file.type.startsWith('image/') ? (
            preview ? (
              <img src={preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-sm text-gray-500">{file.size ? (file.size / 1024 / 1024).toFixed(2) : 'N/A'} MB</p>
        </div>
      </div>
    </div>
  );
};

// Offline Status Component
const OfflineStatus = ({ isOnline, pendingCount }) => {
  if (isOnline && pendingCount === 0) return null;
  
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
      isOnline 
        ? 'bg-blue-600 text-white' 
        : 'bg-red-600 text-white'
    }`}>
      {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      <span className="text-sm font-medium">
        {isOnline 
          ? (pendingCount > 0 ? `Syncing ${pendingCount} report${pendingCount > 1 ? 's' : ''}...` : 'Online')
          : 'Offline - Reports will sync when online'
        }
      </span>
    </div>
  );
};

// Pending Reports Queue Component
const PendingReportsQueue = ({ reports, onRetry, onDelete }) => {
  if (!reports || reports.length === 0) return null;

  return (
    <div className="mb-6">
      <Alert type="info">
        <div className="w-full">
          <h3 className="font-medium mb-2">Pending Reports ({reports.length})</h3>
          <p className="text-sm mb-3">These reports are queued and will be submitted when you're back online.</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-2 bg-white rounded border text-gray-700">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{report.eventType.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onRetry(report.id)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Retry now"
                  >
                    <Loader2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(report.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Alert>
    </div>
  );
};

// Offline Storage Manager
class OfflineStorageManager {
  constructor() {
    this.STORAGE_KEY = 'hazard_reports_queue';
    this.DB_NAME = 'HazardReportsDB';
    this.DB_VERSION = 1;
    this.db = null;
    this.initDB();
  }

  async initDB() {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create reports store
        if (!db.objectStoreNames.contains('reports')) {
          const reportsStore = db.createObjectStore('reports', { keyPath: 'id' });
          reportsStore.createIndex('timestamp', 'timestamp');
          reportsStore.createIndex('status', 'status');
        }
        
        // Create media store
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
        }
      };
    });
  }

  async saveReport(report) {
    await this.initDB();
    
    const reportData = {
      ...report,
      id: report.id || this.generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    // Save media separately if exists
    if (report.media) {
      const mediaData = await this.fileToArrayBuffer(report.media);
      await this.saveToStore('media', {
        id: reportData.id,
        data: mediaData,
        type: report.media.type,
        name: report.media.name,
        size: report.media.size
      });
      // Don't store the actual File object
      reportData.mediaId = reportData.id;
      delete reportData.media;
    }

    return this.saveToStore('reports', reportData);
  }

  async getPendingReports() {
    await this.initDB();
    return this.getAllFromStore('reports', 'status', 'pending');
  }

  async getReportWithMedia(reportId) {
    await this.initDB();
    
    const report = await this.getFromStore('reports', reportId);
    if (!report) return null;

    if (report.mediaId) {
      const media = await this.getFromStore('media', report.mediaId);
      if (media) {
        // Reconstruct File object
        const blob = new Blob([media.data], { type: media.type });
        const file = new File([blob], media.name, { type: media.type });
        report.media = file;
      }
    }

    return report;
  }

  async updateReportStatus(id, status, error = null) {
    await this.initDB();
    
    const report = await this.getFromStore('reports', id);
    if (!report) return;

    report.status = status;
    report.lastAttempt = new Date().toISOString();
    
    if (error) {
      report.error = error;
      report.retryCount = (report.retryCount || 0) + 1;
    }

    return this.saveToStore('reports', report);
  }

  async deleteReport(id) {
    await this.initDB();
    
    // Delete media if exists
    await this.deleteFromStore('media', id);
    
    // Delete report
    return this.deleteFromStore('reports', id);
  }

  async clearSuccessfulReports() {
    await this.initDB();
    
    const reports = await this.getAllFromStore('reports', 'status', 'success');
    for (const report of reports) {
      await this.deleteReport(report.id);
    }
  }

  // Helper methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async fileToArrayBuffer(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(file);
    });
  }

  async saveToStore(storeName, data) {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFromStore(storeName, key) {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFromStore(storeName, indexName = null, value = null) {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request;
      if (indexName && value) {
        const index = store.index(indexName);
        request = index.getAll(value);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFromStore(storeName, key) {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export default function HazardReportingSystem() {
  // Form state
  const [formData, setFormData] = useState({
    eventType: "",
    description: "",
    severity: 3,
    media: null,
    location: null
  });
  
  // UI state
  const [status, setStatus] = useState({ type: null, message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Offline state
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [pendingReports, setPendingReports] = useState([]);
  const [storageManager] = useState(() => new OfflineStorageManager());
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize offline capabilities
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingReports();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load pending reports on mount
    loadPendingReports();
    
    // Auto-sync when coming online
    if (isOnline) {
      syncPendingReports();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending reports from storage
  const loadPendingReports = async () => {
    try {
      const reports = await storageManager.getPendingReports();
      setPendingReports(reports);
    } catch (error) {
      console.error('Failed to load pending reports:', error);
    }
  };

  // Sync pending reports when online
  const syncPendingReports = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      const reports = await storageManager.getPendingReports();
      
      for (const report of reports) {
        try {
          const fullReport = await storageManager.getReportWithMedia(report.id);
          await submitReportToServer(fullReport, false);
          await storageManager.updateReportStatus(report.id, 'success');
        } catch (error) {
          console.error('Failed to sync report:', error);
          await storageManager.updateReportStatus(report.id, 'failed', error.message);
        }
      }
      
      // Clean up successful reports
      await storageManager.clearSuccessfulReports();
      await loadPendingReports();
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit report to server
  const submitReportToServer = async (reportData, showStatus = true) => {
    const submitData = new FormData();
    submitData.append("event_type", reportData.eventType);
    submitData.append("description", reportData.description.trim());
    submitData.append("severity", reportData.severity);
    submitData.append("lat", reportData.location.lat);
    submitData.append("lng", reportData.location.lng);
    submitData.append("timestamp", reportData.timestamp || new Date().toISOString());
    
    if (reportData.media) {
      submitData.append("media", reportData.media);
    }

    const response = await fetch("http://localhost:5000/api/v1/reports", {
      method: "POST",
      body: submitData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Auto-clear status messages
  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status.message]);

  // Get user location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
          setStatus({ 
            type: "info", 
            message: "Location detected automatically. You can click on the map to change it." 
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setStatus({ 
            type: "warning", 
            message: "Please click on the map to select your location manually." 
          });
        },
        { 
          timeout: 10000,
          enableHighAccuracy: true 
        }
      );
    }
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.eventType) {
      newErrors.eventType = "Please select a hazard type";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Please provide a description";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }
    
    if (!formData.location) {
      newErrors.location = "Please select a location on the map";
    }
    
    if (formData.media && formData.media.size > 10 * 1024 * 1024) {
      newErrors.media = "File size must be less than 10MB";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form field changes
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setStatus({ 
        type: "error", 
        message: "Please select a valid image or video file" 
      });
      return;
    }
    
    updateFormData('media', file);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  // Handle map click
  const handleMapClick = (latlng) => {
    updateFormData('location', latlng);
    setStatus({ 
      type: "success", 
      message: `Location set to ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}` 
    });
  };

  // Retry a specific pending report
  const retryPendingReport = async (reportId) => {
    if (!isOnline) {
      setStatus({ 
        type: "warning", 
        message: "Cannot retry while offline" 
      });
      return;
    }

    try {
      const report = await storageManager.getReportWithMedia(reportId);
      if (!report) return;

      await submitReportToServer(report);
      await storageManager.updateReportStatus(reportId, 'success');
      await storageManager.clearSuccessfulReports();
      await loadPendingReports();
      
      setStatus({ 
        type: "success", 
        message: "Report submitted successfully!" 
      });
    } catch (error) {
      await storageManager.updateReportStatus(reportId, 'failed', error.message);
      setStatus({ 
        type: "error", 
        message: "Failed to retry report: " + error.message 
      });
    }
  };

  // Delete a pending report
  const deletePendingReport = async (reportId) => {
    try {
      await storageManager.deleteReport(reportId);
      await loadPendingReports();
      setStatus({ 
        type: "info", 
        message: "Report deleted" 
      });
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: "Failed to delete report" 
      });
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (!validateForm()) {
      setStatus({ 
        type: "error", 
        message: "Please fix the errors above" 
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: null, message: "" });

    const reportData = {
      eventType: formData.eventType,
      description: formData.description.trim(),
      severity: formData.severity,
      location: formData.location,
      media: formData.media,
      timestamp: new Date().toISOString()
    };

    try {
      if (isOnline) {
        // Try to submit directly
        await submitReportToServer(reportData);
        
        // Success - reset form
        setFormData({
          eventType: "",
          description: "",
          severity: 3,
          media: null,
          location: null
        });
        
        setStatus({ 
          type: "success", 
          message: "Report submitted successfully! Thank you for helping keep our community safe." 
        });
      } else {
        // Store for later submission
        await storageManager.saveReport(reportData);
        await loadPendingReports();
        
        // Reset form
        setFormData({
          eventType: "",
          description: "",
          severity: 3,
          media: null,
          location: null
        });
        
        setStatus({ 
          type: "info", 
          message: "You're offline. Report saved and will be submitted when you're back online." 
        });
      }
      
    } catch (error) {
      console.error("Submission error:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Network error - save offline
        try {
          await storageManager.saveReport(reportData);
          await loadPendingReports();
          
          setFormData({
            eventType: "",
            description: "",
            severity: 3,
            media: null,
            location: null
          });
          
          setStatus({ 
            type: "warning", 
            message: "Network error. Report saved offline and will be submitted when connection is restored." 
          });
        } catch (storageError) {
          setStatus({ 
            type: "error", 
            message: "Failed to save report offline. Please try again." 
          });
        }
      } else {
        setStatus({ 
          type: "error", 
          message: error.message || "Failed to submit report. Please try again." 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hazardTypes = [
    { value: "tsunami", label: "🌊 Tsunami", icon: Waves },
    { value: "storm_surge", label: "🌀 Storm Surge", icon: Cloud },
    { value: "high_wave", label: "〰️ High Wave", icon: Waves },
    { value: "flooding", label: "💧 Coastal Flooding", icon: Waves },
    { value: "damage", label: "⚡ Coastal Damage", icon: Zap }
  ];

  const severityLabels = {
    1: "Low Risk",
    2: "Moderate",
    3: "Significant", 
    4: "High Risk",
    5: "Critical"
  };

  const severityColors = {
    1: "text-green-600",
    2: "text-yellow-600", 
    3: "text-orange-600",
    4: "text-red-600",
    5: "text-purple-600"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Offline Status Indicator */}
      <OfflineStatus 
        isOnline={isOnline} 
        pendingCount={pendingReports.length} 
      />
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Coastal Hazard Reporting
          </h1>
          <p className="text-gray-600">
            Help protect our community by reporting coastal hazards and emergencies
          </p>
        </div>

        {/* Status Messages */}
        {status.message && (
          <Alert type={status.type} className="mb-6">
            {status.message}
          </Alert>
        )}

        {/* Pending Reports Queue */}
        <PendingReportsQueue 
          reports={pendingReports}
          onRetry={retryPendingReport}
          onDelete={deletePendingReport}
        />

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            {/* Hazard Type */}
            <div>
              <label htmlFor="eventType" className="block text-sm font-semibold text-gray-700 mb-3">
                Hazard Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hazardTypes.map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                      formData.eventType === value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="eventType"
                      value={value}
                      checked={formData.eventType === value}
                      onChange={(e) => updateFormData('eventType', e.target.value)}
                      className="sr-only"
                    />
                    <Icon className="w-5 h-5 mr-3 text-blue-600" />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
              {errors.eventType && (
                <p className="mt-2 text-sm text-red-600">{errors.eventType}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className={`w-full p-4 border-2 rounded-xl resize-none transition-colors focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                rows="4"
                placeholder="Please describe the hazard in detail. Include what you observed, current conditions, and any immediate risks..."
                maxLength="1000"
              />
              <div className="flex justify-between items-center mt-2">
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.description.length}/1000 characters
                </p>
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Severity Level: {' '}
                <span className={`font-bold ${severityColors[formData.severity]}`}>
                  {formData.severity} - {severityLabels[formData.severity]}
                </span>
              </label>
              <div className="px-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.severity}
                  onChange={(e) => updateFormData('severity', parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>Significant</span>
                  <span>High</span>
                  <span>Critical</span>
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Attach Photo/Video (Optional)
              </label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : errors.media
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-gray-50'
                } hover:bg-gray-100`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
              {errors.media && (
                <p className="mt-2 text-sm text-red-600">{errors.media}</p>
              )}
              <FilePreview file={formData.media} />
            </div>

            {/* Location Map */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location *
              </label>
              <div className={`rounded-xl border-2 overflow-hidden ${
                errors.location ? 'border-red-300' : 'border-gray-300'
              }`}>
                <MapContainer
                  center={formData.location ? [formData.location.lat, formData.location.lng] : [20, 80]}
                  zoom={formData.location ? 13 : 5}
                  style={{ height: "300px", width: "100%" }}
                  onClick={handleMapClick}
                >
                  <MapMarker position={formData.location} />
                </MapContainer>
              </div>
              {formData.location && (
                <p className="mt-2 text-sm text-gray-600">
                  📍 Selected: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                </p>
              )}
              {errors.location && (
                <p className="mt-2 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Submit Button */}
            <LoadingButton
              onClick={handleSubmit}
              loading={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200"
            >
              {isSubmitting ? "Submitting Report..." : 
               isOnline ? "Submit Hazard Report" : 
               "Save Report (Offline)"}
            </LoadingButton>

            {/* Offline Mode Info */}
            {!isOnline && (
              <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <Clock className="w-4 h-4 inline mr-2" />
                Reports are saved locally and will be automatically submitted when you're back online
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Emergency? Call local emergency services immediately.</p>
          <p className="mt-1">This system is for non-emergency hazard reporting.</p>
          {pendingReports.length > 0 && (
            <p className="mt-2 text-blue-600">
              {pendingReports.length} report{pendingReports.length > 1 ? 's' : ''} waiting to sync
            </p>
          )}
        </div>
      </div>
    </div>
  );
}