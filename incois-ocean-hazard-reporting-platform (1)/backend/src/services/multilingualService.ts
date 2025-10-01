import { logger } from '../utils/logger';

export interface Translation {
  [key: string]: string | Translation;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  region: string[];
  isActive: boolean;
}

export interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  context?: 'hazard' | 'report' | 'warning' | 'general';
}

class MultilingualService {
  private supportedLanguages: Map<string, LanguageConfig> = new Map();
  private translations: Map<string, Translation> = new Map();
  private hazardTerminology: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.initializeSupportedLanguages();
    this.initializeTranslations();
    this.initializeHazardTerminology();
  }

  /**
   * Initialize supported languages for Indian coastal regions
   */
  private initializeSupportedLanguages(): void {
    const languages: LanguageConfig[] = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        region: ['all'],
        isActive: true
      },
      {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        direction: 'ltr',
        region: ['north', 'central'],
        isActive: true
      },
      {
        code: 'ta',
        name: 'Tamil',
        nativeName: 'தமிழ்',
        direction: 'ltr',
        region: ['tamil_nadu', 'puducherry'],
        isActive: true
      },
      {
        code: 'te',
        name: 'Telugu',
        nativeName: 'తెలుగు',
        direction: 'ltr',
        region: ['andhra_pradesh', 'telangana'],
        isActive: true
      },
      {
        code: 'kn',
        name: 'Kannada',
        nativeName: 'ಕನ್ನಡ',
        direction: 'ltr',
        region: ['karnataka'],
        isActive: true
      },
      {
        code: 'ml',
        name: 'Malayalam',
        nativeName: 'മലയാളം',
        direction: 'ltr',
        region: ['kerala', 'lakshadweep'],
        isActive: true
      },
      {
        code: 'bn',
        name: 'Bengali',
        nativeName: 'বাংলা',
        direction: 'ltr',
        region: ['west_bengal', 'odisha'],
        isActive: true
      },
      {
        code: 'gu',
        name: 'Gujarati',
        nativeName: 'ગુજરાતી',
        direction: 'ltr',
        region: ['gujarat', 'daman_diu'],
        isActive: true
      },
      {
        code: 'mr',
        name: 'Marathi',
        nativeName: 'मराठी',
        direction: 'ltr',
        region: ['maharashtra', 'goa'],
        isActive: true
      },
      {
        code: 'or',
        name: 'Odia',
        nativeName: 'ଓଡ଼ିଆ',
        direction: 'ltr',
        region: ['odisha'],
        isActive: true
      }
    ];

    for (const lang of languages) {
      this.supportedLanguages.set(lang.code, lang);
    }

    logger.info(`Initialized ${languages.length} supported languages`);
  }

  /**
   * Initialize base translations for UI elements
   */
  private initializeTranslations(): void {
    const translations = {
      en: {
        app: {
          title: 'INCOIS Ocean Hazard Reporting Platform',
          subtitle: 'Real-time coastal hazard monitoring and reporting'
        },
        auth: {
          login: 'Login',
          register: 'Register',
          email: 'Email Address',
          password: 'Password',
          name: 'Full Name',
          role: 'Select Role',
          verifyEmail: 'Verify Email',
          otpCode: 'Verification Code',
          resendOTP: 'Resend Code'
        },
        hazards: {
          tsunami: 'Tsunami',
          cyclone: 'Cyclone',
          flooding: 'Flooding',
          stormSurge: 'Storm Surge',
          earthquake: 'Earthquake',
          coastalErosion: 'Coastal Erosion'
        },
        dashboard: {
          reports: 'Reports',
          hotspots: 'Hotspots',
          warnings: 'Warnings',
          socialMedia: 'Social Media',
          map: 'Map View'
        },
        warnings: {
          critical: 'CRITICAL WARNING',
          high: 'HIGH ALERT',
          medium: 'MODERATE WARNING',
          low: 'ADVISORY',
          evacuate: 'EVACUATE IMMEDIATELY',
          shelter: 'SEEK SHELTER',
          monitor: 'MONITOR CONDITIONS'
        }
      },
      hi: {
        app: {
          title: 'इनकॉइस समुद्री आपदा रिपोर्टिंग प्लेटफॉर्म',
          subtitle: 'वास्तविक समय तटीय आपदा निगरानी और रिपोर्टिंग'
        },
        auth: {
          login: 'लॉगिन',
          register: 'पंजीकरण',
          email: 'ईमेल पता',
          password: 'पासवर्ड',
          name: 'पूरा नाम',
          role: 'भूमिका चुनें',
          verifyEmail: 'ईमेल सत्यापित करें',
          otpCode: 'सत्यापन कोड',
          resendOTP: 'कोड पुनः भेजें'
        },
        hazards: {
          tsunami: 'सुनामी',
          cyclone: 'चक्रवात',
          flooding: 'बाढ़',
          stormSurge: 'तूफानी लहर',
          earthquake: 'भूकंप',
          coastalErosion: 'तटीय कटाव'
        },
        dashboard: {
          reports: 'रिपोर्ट',
          hotspots: 'हॉटस्पॉट',
          warnings: 'चेतावनी',
          socialMedia: 'सोशल मीडिया',
          map: 'मानचित्र दृश्य'
        },
        warnings: {
          critical: 'गंभीर चेतावनी',
          high: 'उच्च अलर्ट',
          medium: 'मध्यम चेतावनी',
          low: 'सलाह',
          evacuate: 'तुरंत निकलें',
          shelter: 'आश्रय लें',
          monitor: 'स्थिति की निगरानी करें'
        }
      },
      ta: {
        app: {
          title: 'இன்கோயிஸ் கடல் அபாய அறிக்கை தளம்',
          subtitle: 'நிகழ்நேர கடலோர அபாய கண்காணிப்பு மற்றும் அறிக்கை'
        },
        auth: {
          login: 'உள்நுழைவு',
          register: 'பதிவு',
          email: 'மின்னஞ்சல் முகவரி',
          password: 'கடவுச்சொல்',
          name: 'முழு பெயர்',
          role: 'பங்கு தேர்ந்தெடுக்கவும்',
          verifyEmail: 'மின்னஞ்சல் சரிபார்க்கவும்',
          otpCode: 'சரிபார்ப்பு குறியீடு',
          resendOTP: 'குறியீட்டை மீண்டும் அனுப்பவும்'
        },
        hazards: {
          tsunami: 'சுனாமி',
          cyclone: 'சூறாவளி',
          flooding: 'வெள்ளம்',
          stormSurge: 'புயல் அலை',
          earthquake: 'நிலநடுக்கம்',
          coastalErosion: 'கடலோர அரிப்பு'
        },
        dashboard: {
          reports: 'அறிக்கைகள்',
          hotspots: 'ஹாட்ஸ்பாட்கள்',
          warnings: 'எச்சரிக்கைகள்',
          socialMedia: 'சமூக ஊடகம்',
          map: 'வரைபட காட்சி'
        },
        warnings: {
          critical: 'முக்கியமான எச்சரிக்கை',
          high: 'உயர் எச்சரிக்கை',
          medium: 'மிதமான எச்சரிக்கை',
          low: 'ஆலோசனை',
          evacuate: 'உடனடியாக வெளியேறவும்',
          shelter: 'பாதுகாப்பான இடத்தை தேடவும்',
          monitor: 'நிலைமைகளை கண்காணிக்கவும்'
        }
      },
      te: {
        app: {
          title: 'ఇన్కోయిస్ సముద్ర ప్రమాద రిపోర్టింగ్ ప్లాట్‌ఫారమ్',
          subtitle: 'రియల్ టైమ్ తీర ప్రమాద పర్యవేక్షణ మరియు రిపోర్టింగ్'
        },
        auth: {
          login: 'లాగిన్',
          register: 'నమోదు',
          email: 'ఇమెయిల్ చిరునామా',
          password: 'పాస్‌వర్డ్',
          name: 'పూర్తి పేరు',
          role: 'పాత్రను ఎంచుకోండి',
          verifyEmail: 'ఇమెయిల్ ధృవీకరించండి',
          otpCode: 'ధృవీకరణ కోడ్',
          resendOTP: 'కోడ్ మళ్లీ పంపండి'
        },
        hazards: {
          tsunami: 'సునామి',
          cyclone: 'తుఫాను',
          flooding: 'వరదలు',
          stormSurge: 'తుఫాను అలలు',
          earthquake: 'భూకంపం',
          coastalErosion: 'తీర కోత'
        },
        dashboard: {
          reports: 'నివేదికలు',
          hotspots: 'హాట్‌స్పాట్‌లు',
          warnings: 'హెచ్చరికలు',
          socialMedia: 'సోషల్ మీడియా',
          map: 'మ్యాప్ వ్యూ'
        },
        warnings: {
          critical: 'క్రిటికల్ హెచ్చరిక',
          high: 'అధిక అలర్ట్',
          medium: 'మధ్యస్థ హెచ్చరిక',
          low: 'సలహా',
          evacuate: 'వెంటనే ఖాళీ చేయండి',
          shelter: 'ఆశ్రయం వెతకండి',
          monitor: 'పరిస్థితులను పర్యవేక్షించండి'
        }
      }
    };

    for (const [langCode, translation] of Object.entries(translations)) {
      this.translations.set(langCode, translation);
    }

    logger.info('Initialized base translations');
  }

  /**
   * Initialize hazard-specific terminology
   */
  private initializeHazardTerminology(): void {
    const hazardTerms = {
      tsunami: {
        en: ['tsunami', 'tidal wave', 'seismic sea wave', 'harbor wave'],
        hi: ['सुनामी', 'समुद्री लहर', 'तूफानी लहर', 'भूकंपीय समुद्री लहर'],
        ta: ['சுனாமி', 'கடல் அலை', 'நிலநடுக்க கடல் அலை', 'பெரிய அலை'],
        te: ['సునామి', 'సముద్ర అలలు', 'భూకంప సముద్ర అలలు', 'పెద్ద అలలు'],
        ml: ['സുനാമി', 'കടൽ തിരമാല', 'ഭൂകമ്പ കടൽ തിരമാല'],
        bn: ['সুনামি', 'সমুদ্রের ঢেউ', 'ভূমিকম্প সমুদ্রের ঢেউ']
      },
      cyclone: {
        en: ['cyclone', 'hurricane', 'typhoon', 'tropical storm', 'storm system'],
        hi: ['चक्रवात', 'तूफान', 'आंधी', 'उष्णकटिबंधीय तूफान'],
        ta: ['சூறாவளி', 'புயல்', 'வெப்பமண்டல புயல்', 'காற்று'],
        te: ['తుఫాను', 'చక్రవాతం', 'ఉష్ణమండల తుఫాను'],
        ml: ['ചുഴലിക്കാറ്റ്', 'കൊടുങ്കാറ്റ്', 'ഉഷ്ണമേഖലാ കൊടുങ്കാറ്റ്'],
        bn: ['ঘূর্ণিঝড়', 'তুফান', 'ঝড়', 'ক্রান্তীয় ঝড়']
      },
      flooding: {
        en: ['flood', 'flooding', 'inundation', 'overflow', 'deluge'],
        hi: ['बाढ़', 'जलभराव', 'पानी भरना', 'जल प्रलय'],
        ta: ['வெள்ளம்', 'நீர் நிரம்புதல்', 'நீர் பெருக்கு'],
        te: ['వరదలు', 'నీరు నిండటం', 'జలప్రళయం'],
        ml: ['വെള്ളപ്പൊക്കം', 'നിറയൽ', 'ജലപ്രളയം'],
        bn: ['বন্যা', 'জলাবদ্ধতা', 'জলপ্লাবন']
      }
    };

    for (const [hazard, translations] of Object.entries(hazardTerms)) {
      const hazardMap = new Map<string, string>();
      for (const [lang, terms] of Object.entries(translations)) {
        hazardMap.set(lang, terms.join(', '));
      }
      this.hazardTerminology.set(hazard, hazardMap);
    }

    logger.info('Initialized hazard terminology');
  }

  /**
   * Get translation for a key in specified language
   */
  public getTranslation(key: string, language: string = 'en'): string {
    const translation = this.translations.get(language);
    if (!translation) {
      return this.getTranslation(key, 'en'); // Fallback to English
    }

    const keys = key.split('.');
    let current: any = translation;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English if key not found
        if (language !== 'en') {
          return this.getTranslation(key, 'en');
        }
        return key; // Return key itself if not found
      }
    }

    return typeof current === 'string' ? current : key;
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): LanguageConfig[] {
    return Array.from(this.supportedLanguages.values()).filter(lang => lang.isActive);
  }

  /**
   * Get languages for specific region
   */
  public getLanguagesForRegion(region: string): LanguageConfig[] {
    return Array.from(this.supportedLanguages.values())
      .filter(lang => lang.isActive && (lang.region.includes(region) || lang.region.includes('all')));
  }

  /**
   * Translate hazard name to specified language
   */
  public translateHazard(hazardType: string, language: string = 'en'): string {
    const hazardTerms = this.hazardTerminology.get(hazardType.toLowerCase());
    if (hazardTerms && hazardTerms.has(language)) {
      return hazardTerms.get(language)!.split(', ')[0]; // Return primary term
    }
    
    // Fallback to translation key
    return this.getTranslation(`hazards.${hazardType}`, language);
  }

  /**
   * Get all hazard terms for language (for NLP processing)
   */
  public getHazardTermsForLanguage(language: string): Map<string, string[]> {
    const result = new Map<string, string[]>();
    
    for (const [hazard, translations] of this.hazardTerminology) {
      if (translations.has(language)) {
        const terms = translations.get(language)!.split(', ');
        result.set(hazard, terms);
      }
    }
    
    return result;
  }

  /**
   * Auto-detect language from text
   */
  public detectLanguage(text: string): string {
    // Simple language detection based on character sets
    // In production, use a proper language detection library
    
    const devanagariPattern = /[\u0900-\u097F]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const teluguPattern = /[\u0C00-\u0C7F]/;
    const malayalamPattern = /[\u0D00-\u0D7F]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const gujaratiPattern = /[\u0A80-\u0AFF]/;
    const kannadaPattern = /[\u0C80-\u0CFF]/;
    const odiaPattern = /[\u0B00-\u0B7F]/;

    if (devanagariPattern.test(text)) return 'hi';
    if (tamilPattern.test(text)) return 'ta';
    if (teluguPattern.test(text)) return 'te';
    if (malayalamPattern.test(text)) return 'ml';
    if (bengaliPattern.test(text)) return 'bn';
    if (gujaratiPattern.test(text)) return 'gu';
    if (kannadaPattern.test(text)) return 'kn';
    if (odiaPattern.test(text)) return 'or';

    return 'en'; // Default to English
  }

  /**
   * Format emergency message in multiple languages
   */
  public formatEmergencyMessage(
    hazardType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    location: string,
    languages: string[] = ['en', 'hi']
  ): Map<string, string> {
    const messages = new Map<string, string>();

    for (const lang of languages) {
      const hazardName = this.translateHazard(hazardType, lang);
      const severityText = this.getTranslation(`warnings.${severity}`, lang);
      
      let actionText = '';
      if (severity === 'critical') {
        actionText = this.getTranslation('warnings.evacuate', lang);
      } else if (severity === 'high') {
        actionText = this.getTranslation('warnings.shelter', lang);
      } else {
        actionText = this.getTranslation('warnings.monitor', lang);
      }

      const message = `${severityText}: ${hazardName} ${location}. ${actionText}`;
      messages.set(lang, message);
    }

    return messages;
  }

  /**
   * Add custom translation
   */
  public addTranslation(language: string, key: string, value: string): void {
    if (!this.translations.has(language)) {
      this.translations.set(language, {});
    }

    const translation = this.translations.get(language)!;
    const keys = key.split('.');
    let current: any = translation;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
    logger.info(`Added translation: ${language}.${key} = ${value}`);
  }

  /**
   * Get translation statistics
   */
  public getTranslationStats(): {
    supportedLanguages: number;
    totalTranslations: number;
    completionByLanguage: Map<string, number>;
  } {
    const stats = {
      supportedLanguages: this.supportedLanguages.size,
      totalTranslations: 0,
      completionByLanguage: new Map<string, number>()
    };

    const englishTranslation = this.translations.get('en');
    const englishKeyCount = englishTranslation ? this.countKeys(englishTranslation) : 0;

    for (const [lang, translation] of this.translations) {
      const keyCount = this.countKeys(translation);
      stats.totalTranslations += keyCount;
      
      if (englishKeyCount > 0) {
        const completion = (keyCount / englishKeyCount) * 100;
        stats.completionByLanguage.set(lang, Math.round(completion));
      }
    }

    return stats;
  }

  private countKeys(obj: any): number {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        count += this.countKeys(obj[key]);
      } else {
        count++;
      }
    }
    return count;
  }
}

export const multilingualService = new MultilingualService();
