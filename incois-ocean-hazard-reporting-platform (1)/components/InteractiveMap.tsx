import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Report, SocialMediaPost } from '../types';
import { HAZARD_HEX_COLORS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface InteractiveMapProps {
  reports: Report[];
  socialPosts?: SocialMediaPost[];
  selectedReport: Report | null;
  onSelectReport: (report: Report | null) => void;
}

const getConfidenceColor = (confidence: number) => {
    if (confidence < 40) return '#f87171'; // red-400
    if (confidence < 75) return '#fbbf24'; // amber-400
    return '#4ade80'; // green-400
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ reports, socialPosts, onSelectReport, selectedReport }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>({});
  const socialMarkersRef = useRef<any>({});
  const { t } = useLanguage();

  // Function to extract location coordinates from social media posts
  const getSocialMediaLocations = () => {
    if (!socialPosts || socialPosts.length === 0) return [];
    
    const locationMap: { [key: string]: { lat: number; lng: number } } = {
      'mumbai': { lat: 19.0330, lng: 72.8397 },
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'bay of bengal': { lat: 15.0000, lng: 87.0000 },
      'kochi': { lat: 9.9312, lng: 76.2673 },
      'kerala': { lat: 10.8505, lng: 76.2711 },
      'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
      'andhra pradesh': { lat: 15.9129, lng: 79.7400 },
      'tamil nadu': { lat: 11.1271, lng: 78.6569 },
      'kolkata': { lat: 22.5726, lng: 88.3639 },
      'goa': { lat: 15.2993, lng: 74.1240 },
      'puducherry': { lat: 11.9416, lng: 79.8083 },
      'mangalore': { lat: 12.9141, lng: 74.8560 },
      'kanyakumari': { lat: 8.0883, lng: 77.5385 },
      'rameswaram': { lat: 9.2876, lng: 79.3129 },
      'puri': { lat: 19.8135, lng: 85.8312 },
      'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
      'kozhikode': { lat: 11.2588, lng: 75.7804 },
      'alappuzha': { lat: 9.4981, lng: 76.3388 }
    };

    return socialPosts.map((post, index) => {
      const locationKey = post.location.toLowerCase();
      const coords = locationMap[locationKey] || { lat: 10.8505, lng: 76.2711 }; // Default to Kerala coast
      
      // Extract intensity from keywords or content
      const content = post.content.toLowerCase();
      let intensity = 'LOW';
      if (content.includes('massive') || content.includes('severe') || content.includes('critical')) {
        intensity = 'HIGH';
      } else if (content.includes('moderate') || content.includes('significant')) {
        intensity = 'MEDIUM';
      }

      return {
        id: `social-${post.id}`,
        name: post.location,
        lat: coords.lat,
        lng: coords.lng,
        hazard: post.keywords.includes('cyclone') ? 'cyclone' : 
               post.keywords.includes('flood') ? 'flooding' : 'high_waves',
        intensity,
        source: post.author,
        content: post.content,
        confidence: 70, // Default confidence for social media
        timestamp: post.timestamp
      };
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);
      
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      
      setTimeout(() => {
        if(mapRef.current) {
            mapRef.current.invalidateSize();
        }
      }, 100);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when reports change
  useEffect(() => {
    if (!mapRef.current) return;

    const existingMarkerIds = Object.keys(markersRef.current);
    const reportIds = reports.map(r => r.id);

    existingMarkerIds.forEach(id => {
      if (!reportIds.includes(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    reports.forEach(report => {
      const confidenceColor = getConfidenceColor(report.confidence);
      const hazardKey = `hazards.${report.hazard.replace(/\s/g, '')}`;
      const translatedHazard = t(hazardKey);

      if (markersRef.current[report.id]) {
        markersRef.current[report.id].setLatLng([report.location.lat, report.location.lng]);
      } else {
        const marker = L.circleMarker([report.location.lat, report.location.lng], {
          radius: 7,
          fillColor: HAZARD_HEX_COLORS[report.hazard],
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapRef.current);

        marker.on('click', () => onSelectReport(report));
        markersRef.current[report.id] = marker;
      }
      
      markersRef.current[report.id].bindPopup(`
        <div style="font-family: 'Inter', sans-serif; width: 200px;">
            <h4 style="margin: 0 0 5px 0; font-weight: bold; color: ${HAZARD_HEX_COLORS[report.hazard]};">${translatedHazard}</h4>
            <p style="margin: 0; font-size: 12px; color: #cbd5e1;">${report.location.name}</p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8; font-style: italic;">"${report.summary.substring(0, 50)}..."</p>
            <div style="margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">
                    <span>${t('reportList.confidenceScore')}</span>
                    <span style="color: ${confidenceColor}; font-weight: bold;">${report.confidence}%</span>
                </div>
                <div style="background-color: #334155; border-radius: 4px; overflow: hidden; height: 6px;">
                    <div style="width: ${report.confidence}%; background-color: ${confidenceColor}; height: 100%;"></div>
                </div>
            </div>
        </div>
      `);
    });

    // Add social media markers with animations
    const socialMediaLocations = getSocialMediaLocations();
    
    // Clear existing social markers
    Object.values(socialMarkersRef.current).forEach((marker: any) => {
      marker.remove();
    });
    socialMarkersRef.current = {};

    socialMediaLocations.forEach((location, index) => {
      const intensityColor = location.intensity === 'HIGH' ? '#ef4444' : 
                            location.intensity === 'MEDIUM' ? '#f59e0b' : '#8b5cf6';
      
      // Create animated marker with pulse effect
      const socialMarker = L.circleMarker([location.lat, location.lng], {
        radius: 12,
        fillColor: intensityColor,
        color: '#8b5cf6', // Purple border for social media
        weight: 3,
        opacity: 0,
        fillOpacity: 0,
        className: 'social-media-marker'
      }).addTo(mapRef.current);

      // Animate marker appearance with delay
      setTimeout(() => {
        socialMarker.setStyle({
          opacity: 1,
          fillOpacity: 0.8,
        });
        
        // Add pulse animation
        const pulseInterval = setInterval(() => {
          socialMarker.setStyle({ radius: 15 });
          setTimeout(() => {
            socialMarker.setStyle({ radius: 12 });
          }, 300);
        }, 2000);
        
        // Store interval for cleanup
        (socialMarker as any).pulseInterval = pulseInterval;
      }, index * 200); // Staggered animation

      socialMarker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; width: 280px; animation: fadeIn 0.3s ease-out;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #8b5cf6; font-size: 14px;">📱 Social Media Alert</h4>
          <p style="margin: 0; font-size: 13px; color: #1f2937; font-weight: bold;">${location.name}</p>
          <p style="margin: 4px 0; font-size: 11px; color: #6b7280;">Source: ${location.source}</p>
          <p style="margin: 8px 0; font-size: 12px; color: #374151; line-height: 1.5; background: #f9fafb; padding: 8px; border-radius: 6px;">"${location.content.substring(0, 100)}..."</p>
          <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #6b7280;">Intensity: <strong style="color: ${intensityColor}; font-size: 12px;">${location.intensity}</strong></span>
            <span style="font-size: 11px; color: #6b7280;">Confidence: <strong style="color: ${getConfidenceColor(location.confidence)}; font-size: 12px;">${location.confidence}%</strong></span>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <span style="font-size: 11px; color: #6b7280;">Hazard: <strong style="color: ${HAZARD_HEX_COLORS[location.hazard] || '#8b5cf6'}; font-size: 12px;">${location.hazard.replace('_', ' ')}</strong></span>
          </div>
        </div>
      `);

      socialMarkersRef.current[location.id] = socialMarker;
    });

  }, [reports, socialPosts, onSelectReport, t]);

  // Handle report selection
  useEffect(() => {
    if (!mapRef.current) return;
    
    Object.entries(markersRef.current).forEach(([id, marker]: [string, any]) => {
        if (selectedReport && id === selectedReport.id) {
            marker.setStyle({ weight: 3, radius: 12 });
            marker.bringToFront();
        } else {
            marker.setStyle({ weight: 1.5, radius: 7 });
        }
    });

    if (selectedReport) {
      const marker = markersRef.current[selectedReport.id];
      if (marker) {
          mapRef.current.flyTo(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 8), {
            animate: true,
            duration: 0.5
          });
          setTimeout(() => marker.openPopup(), 500);
      }
    }
  }, [selectedReport]);

  return (
    <div className="w-full h-full bg-gray-50 relative">
      <div id="map" className="w-full h-full z-10 rounded-lg shadow-lg" />
      
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-gray-200 text-xs z-20 shadow-lg animate-fade-in">
        <h3 className="font-bold mb-3 text-gray-800 text-sm">{t('map.legendTitle')}</h3>
        
        {/* Official Reports */}
        <div className="mb-3">
          <h4 className="font-semibold text-black mb-1">📋 Official Reports</h4>
          {Object.entries(HAZARD_HEX_COLORS).map(([hazard, color]) => (
            <div key={hazard} className="flex items-center mb-1">
              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: color }}></div>
              <span className="text-black">{t(`hazards.${hazard.replace(/\s/g, '')}`)}</span>
            </div>
          ))}
        </div>

        {/* Social Media Alerts */}
        <div>
          <h4 className="font-semibold text-black mb-1">📱 Social Media Alerts</h4>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-2 border-2" style={{ backgroundColor: '#ef4444', borderColor: '#8b5cf6' }}></div>
            <span className="text-black">High Intensity</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-2 border-2" style={{ backgroundColor: '#f59e0b', borderColor: '#8b5cf6' }}></div>
            <span className="text-black">Medium Intensity</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 rounded-full mr-2 border-2" style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}></div>
            <span className="text-black">Low Intensity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;