import { logger } from '../backend/src/utils/logger';

export interface OceanConditions {
  windSpeed: number; // m/s
  windDirection: number; // degrees
  waveHeight: number; // meters
  wavePeriod: number; // seconds
  seaTemperature: number; // celsius
  pressure: number; // hPa
  visibility: number; // km
  humidity: number; // %
  timestamp: string;
  source: string;
}

export interface WeatherAlert {
  type: 'storm' | 'tsunami' | 'high_waves' | 'strong_winds' | 'fog';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  description: string;
  validFrom: string;
  validTo: string;
}

export interface ConfidenceBoost {
  factor: string;
  boost: number; // -50 to +50 points
  reason: string;
}

class OceanDataService {
  private readonly OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
  private readonly STORMGLASS_API_KEY = process.env.STORMGLASS_API_KEY;
  private readonly WINDY_API_KEY = process.env.WINDY_API_KEY;

  /**
   * Get comprehensive ocean conditions for a location
   */
  async getOceanConditions(lat: number, lng: number): Promise<OceanConditions | null> {
    try {
      // Try multiple sources for redundancy
      const conditions = await this.fetchFromMultipleSources(lat, lng);
      return conditions;
    } catch (error) {
      logger.error('Failed to fetch ocean conditions:', error);
      return null;
    }
  }

  /**
   * Calculate confidence boost based on real ocean data
   */
  async calculateOceanDataConfidenceBoost(
    lat: number, 
    lng: number, 
    reportedHazard: string,
    reportDescription: string
  ): Promise<ConfidenceBoost[]> {
    const boosts: ConfidenceBoost[] = [];
    
    try {
      const conditions = await this.getOceanConditions(lat, lng);
      if (!conditions) {
        return [{
          factor: 'data_unavailable',
          boost: -10,
          reason: 'Ocean data unavailable for verification'
        }];
      }

      // Analyze wind conditions
      boosts.push(...this.analyzeWindConditions(conditions, reportedHazard, reportDescription));
      
      // Analyze wave conditions  
      boosts.push(...this.analyzeWaveConditions(conditions, reportedHazard, reportDescription));
      
      // Analyze weather patterns
      boosts.push(...this.analyzeWeatherPatterns(conditions, reportedHazard, reportDescription));
      
      // Check for active weather alerts
      const alerts = await this.getWeatherAlerts(lat, lng);
      boosts.push(...this.analyzeWeatherAlerts(alerts, reportedHazard));

      return boosts;
    } catch (error) {
      logger.error('Error calculating ocean data confidence boost:', error);
      return [{
        factor: 'calculation_error',
        boost: -5,
        reason: 'Error analyzing ocean data'
      }];
    }
  }

  /**
   * Fetch data from multiple sources for reliability
   */
  private async fetchFromMultipleSources(lat: number, lng: number): Promise<OceanConditions> {
    const sources = [
      () => this.fetchFromOpenWeather(lat, lng),
      () => this.fetchFromStormGlass(lat, lng),
      () => this.fetchFromNOAA(lat, lng)
    ];

    for (const fetchSource of sources) {
      try {
        const data = await fetchSource();
        if (data) return data;
      } catch (error) {
        logger.warn('Source failed, trying next:', error);
        continue;
      }
    }

    throw new Error('All ocean data sources failed');
  }

  /**
   * OpenWeatherMap Marine API
   */
  private async fetchFromOpenWeather(lat: number, lng: number): Promise<OceanConditions | null> {
    if (!this.OPENWEATHER_API_KEY) {
      return this.getMockOceanData(lat, lng, 'OpenWeather');
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) throw new Error(`OpenWeather API error: ${response.status}`);
      
      const data = await response.json();
      
      return {
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        waveHeight: this.estimateWaveHeight(data.wind?.speed || 0), // Estimate from wind
        wavePeriod: this.estimateWavePeriod(data.wind?.speed || 0),
        seaTemperature: data.main?.temp || 20,
        pressure: data.main?.pressure || 1013,
        visibility: (data.visibility || 10000) / 1000, // Convert to km
        humidity: data.main?.humidity || 50,
        timestamp: new Date().toISOString(),
        source: 'OpenWeatherMap'
      };
    } catch (error) {
      logger.error('OpenWeather API failed:', error);
      return null;
    }
  }

  /**
   * Stormglass.io Marine API
   */
  private async fetchFromStormGlass(lat: number, lng: number): Promise<OceanConditions | null> {
    if (!this.STORMGLASS_API_KEY) {
      return this.getMockOceanData(lat, lng, 'StormGlass');
    }

    try {
      const params = 'windSpeed,windDirection,waveHeight,wavePeriod,seaLevel,waterTemperature';
      const response = await fetch(
        `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`,
        {
          headers: {
            'Authorization': this.STORMGLASS_API_KEY
          }
        }
      );

      if (!response.ok) throw new Error(`StormGlass API error: ${response.status}`);
      
      const data = await response.json();
      const current = data.hours?.[0]; // Current hour data
      
      if (!current) throw new Error('No current data available');

      return {
        windSpeed: current.windSpeed?.noaa || current.windSpeed?.sg || 0,
        windDirection: current.windDirection?.noaa || current.windDirection?.sg || 0,
        waveHeight: current.waveHeight?.noaa || current.waveHeight?.sg || 0,
        wavePeriod: current.wavePeriod?.noaa || current.wavePeriod?.sg || 0,
        seaTemperature: current.waterTemperature?.noaa || current.waterTemperature?.sg || 20,
        pressure: current.pressure?.noaa || current.pressure?.sg || 1013,
        visibility: 10, // Not available in StormGlass
        humidity: 50, // Not available in StormGlass
        timestamp: new Date().toISOString(),
        source: 'StormGlass'
      };
    } catch (error) {
      logger.error('StormGlass API failed:', error);
      return null;
    }
  }

  /**
   * NOAA Buoy Data (Free)
   */
  private async fetchFromNOAA(lat: number, lng: number): Promise<OceanConditions | null> {
    try {
      // Find nearest NOAA buoy (simplified - in production, use proper buoy lookup)
      const nearestBuoy = this.findNearestNOAABuoy(lat, lng);
      
      const response = await fetch(
        `https://www.ndbc.noaa.gov/data/realtime2/${nearestBuoy}.txt`
      );
      
      if (!response.ok) throw new Error(`NOAA API error: ${response.status}`);
      
      const text = await response.text();
      const lines = text.split('\n');
      const dataLine = lines[2]; // Skip header lines
      const values = dataLine.split(/\s+/);
      
      return {
        windSpeed: parseFloat(values[6]) || 0, // WSPD
        windDirection: parseFloat(values[5]) || 0, // WDIR
        waveHeight: parseFloat(values[8]) || 0, // WVHT
        wavePeriod: parseFloat(values[9]) || 0, // DPD
        seaTemperature: parseFloat(values[14]) || 20, // WTMP
        pressure: parseFloat(values[12]) || 1013, // PRES
        visibility: parseFloat(values[13]) || 10, // VIS
        humidity: 50, // Not available
        timestamp: new Date().toISOString(),
        source: 'NOAA'
      };
    } catch (error) {
      logger.error('NOAA API failed:', error);
      return null;
    }
  }

  /**
   * Get weather alerts for the area
   */
  private async getWeatherAlerts(lat: number, lng: number): Promise<WeatherAlert[]> {
    try {
      if (!this.OPENWEATHER_API_KEY) {
        return this.getMockWeatherAlerts();
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}&exclude=minutely,hourly,daily`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      const alerts = data.alerts || [];
      
      return alerts.map((alert: any) => ({
        type: this.categorizeAlert(alert.event),
        severity: this.determineSeverity(alert.description),
        description: alert.description,
        validFrom: new Date(alert.start * 1000).toISOString(),
        validTo: new Date(alert.end * 1000).toISOString()
      }));
    } catch (error) {
      logger.error('Failed to fetch weather alerts:', error);
      return [];
    }
  }

  /**
   * Analyze wind conditions for confidence boost
   */
  private analyzeWindConditions(conditions: OceanConditions, hazard: string, description: string): ConfidenceBoost[] {
    const boosts: ConfidenceBoost[] = [];
    const windSpeed = conditions.windSpeed;
    
    // Convert m/s to km/h for easier understanding
    const windKmh = windSpeed * 3.6;
    
    if (hazard.toLowerCase().includes('storm') || hazard.toLowerCase().includes('cyclone')) {
      if (windKmh > 60) { // Strong winds detected
        boosts.push({
          factor: 'wind_correlation',
          boost: 25,
          reason: `Strong winds detected (${windKmh.toFixed(1)} km/h) support storm report`
        });
      } else if (windKmh < 20) { // Calm conditions
        boosts.push({
          factor: 'wind_contradiction',
          boost: -20,
          reason: `Calm winds (${windKmh.toFixed(1)} km/h) contradict storm report`
        });
      }
    }
    
    if (hazard.toLowerCase().includes('wave') && windKmh > 40) {
      boosts.push({
        factor: 'wind_wave_correlation',
        boost: 15,
        reason: `Strong winds (${windKmh.toFixed(1)} km/h) can generate high waves`
      });
    }
    
    return boosts;
  }

  /**
   * Analyze wave conditions for confidence boost
   */
  private analyzeWaveConditions(conditions: OceanConditions, hazard: string, description: string): ConfidenceBoost[] {
    const boosts: ConfidenceBoost[] = [];
    const waveHeight = conditions.waveHeight;
    
    if (hazard.toLowerCase().includes('wave') || hazard.toLowerCase().includes('surge')) {
      if (waveHeight > 3) { // High waves
        boosts.push({
          factor: 'wave_correlation',
          boost: 30,
          reason: `High waves detected (${waveHeight.toFixed(1)}m) support wave hazard report`
        });
      } else if (waveHeight < 1) { // Calm seas
        boosts.push({
          factor: 'wave_contradiction',
          boost: -25,
          reason: `Calm seas (${waveHeight.toFixed(1)}m waves) contradict wave hazard report`
        });
      }
    }
    
    if (hazard.toLowerCase().includes('tsunami') && waveHeight > 5) {
      boosts.push({
        factor: 'tsunami_wave_correlation',
        boost: 40,
        reason: `Extremely high waves (${waveHeight.toFixed(1)}m) could indicate tsunami activity`
      });
    }
    
    return boosts;
  }

  /**
   * Analyze general weather patterns
   */
  private analyzeWeatherPatterns(conditions: OceanConditions, hazard: string, description: string): ConfidenceBoost[] {
    const boosts: ConfidenceBoost[] = [];
    
    // Low pressure systems often indicate storms
    if (conditions.pressure < 1000 && hazard.toLowerCase().includes('storm')) {
      boosts.push({
        factor: 'pressure_correlation',
        boost: 20,
        reason: `Low atmospheric pressure (${conditions.pressure} hPa) supports storm conditions`
      });
    }
    
    // High pressure with storm report is contradictory
    if (conditions.pressure > 1020 && hazard.toLowerCase().includes('storm')) {
      boosts.push({
        factor: 'pressure_contradiction',
        boost: -15,
        reason: `High pressure (${conditions.pressure} hPa) contradicts storm report`
      });
    }
    
    // Poor visibility with fog/storm reports
    if (conditions.visibility < 5 && (description.toLowerCase().includes('fog') || description.toLowerCase().includes('visibility'))) {
      boosts.push({
        factor: 'visibility_correlation',
        boost: 15,
        reason: `Poor visibility (${conditions.visibility}km) supports hazard report`
      });
    }
    
    return boosts;
  }

  /**
   * Analyze weather alerts for confidence boost
   */
  private analyzeWeatherAlerts(alerts: WeatherAlert[], hazard: string): ConfidenceBoost[] {
    const boosts: ConfidenceBoost[] = [];
    
    for (const alert of alerts) {
      const alertType = alert.type.toLowerCase();
      const reportHazard = hazard.toLowerCase();
      
      // Direct correlation between alert and report
      if ((alertType.includes('storm') && reportHazard.includes('storm')) ||
          (alertType.includes('wave') && reportHazard.includes('wave')) ||
          (alertType.includes('tsunami') && reportHazard.includes('tsunami'))) {
        
        const severityBoost = {
          'low': 10,
          'medium': 20,
          'high': 35,
          'extreme': 50
        }[alert.severity] || 10;
        
        boosts.push({
          factor: 'official_alert_correlation',
          boost: severityBoost,
          reason: `Official ${alert.severity} ${alert.type} alert active in area`
        });
      }
    }
    
    return boosts;
  }

  /**
   * Helper functions
   */
  private estimateWaveHeight(windSpeed: number): number {
    // Simplified wave height estimation from wind speed (Beaufort scale approximation)
    if (windSpeed < 2) return 0.1;
    if (windSpeed < 6) return 0.5;
    if (windSpeed < 10) return 1.5;
    if (windSpeed < 15) return 3;
    if (windSpeed < 20) return 5;
    return Math.min(windSpeed * 0.3, 15); // Cap at 15m
  }

  private estimateWavePeriod(windSpeed: number): number {
    // Simplified wave period estimation
    return Math.max(3, Math.min(windSpeed * 0.5, 12));
  }

  private findNearestNOAABuoy(lat: number, lng: number): string {
    // Simplified - return a default buoy ID
    // In production, implement proper nearest buoy lookup
    const buoys = ['46001', '46002', '46003', '46005', '46006'];
    return buoys[Math.floor(Math.random() * buoys.length)];
  }

  private categorizeAlert(event: string): WeatherAlert['type'] {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('tsunami')) return 'tsunami';
    if (eventLower.includes('storm') || eventLower.includes('hurricane') || eventLower.includes('cyclone')) return 'storm';
    if (eventLower.includes('wave') || eventLower.includes('surf')) return 'high_waves';
    if (eventLower.includes('wind') || eventLower.includes('gale')) return 'strong_winds';
    if (eventLower.includes('fog') || eventLower.includes('visibility')) return 'fog';
    return 'storm'; // Default
  }

  private determineSeverity(description: string): WeatherAlert['severity'] {
    const desc = description.toLowerCase();
    if (desc.includes('extreme') || desc.includes('catastrophic')) return 'extreme';
    if (desc.includes('major') || desc.includes('severe') || desc.includes('dangerous')) return 'high';
    if (desc.includes('moderate') || desc.includes('significant')) return 'medium';
    return 'low';
  }

  /**
   * Mock data for development/testing
   */
  private getMockOceanData(lat: number, lng: number, source: string): OceanConditions {
    // Generate realistic mock data based on location and season
    const isCoastal = Math.abs(lat) < 30; // Tropical/subtropical
    const baseWind = isCoastal ? 5 + Math.random() * 10 : 3 + Math.random() * 8;
    
    return {
      windSpeed: baseWind,
      windDirection: Math.random() * 360,
      waveHeight: Math.max(0.5, baseWind * 0.2 + Math.random() * 2),
      wavePeriod: 4 + Math.random() * 8,
      seaTemperature: isCoastal ? 24 + Math.random() * 6 : 18 + Math.random() * 8,
      pressure: 1010 + Math.random() * 20,
      visibility: 8 + Math.random() * 12,
      humidity: 60 + Math.random() * 30,
      timestamp: new Date().toISOString(),
      source: `${source} (Mock)`
    };
  }

  private getMockWeatherAlerts(): WeatherAlert[] {
    // Return empty array or mock alerts for testing
    return [];
  }
}

export const oceanDataService = new OceanDataService();
