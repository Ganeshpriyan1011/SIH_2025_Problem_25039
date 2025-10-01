/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_AZURE_STORAGE_CONNECTION_STRING: string;
  readonly VITE_AZURE_CONTAINER_NAME: string;
  readonly VITE_DEFAULT_MAP_CENTER_LAT: string;
  readonly VITE_DEFAULT_MAP_CENTER_LNG: string;
  readonly VITE_DEFAULT_MAP_ZOOM: string;
  readonly VITE_ENABLE_SOCIAL_MEDIA: string;
  readonly VITE_ENABLE_AI_ANALYSIS: string;
  readonly VITE_ENABLE_NOTIFICATIONS: string;
  readonly VITE_ENABLE_HTTPS: string;
  readonly VITE_CORS_ORIGIN: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_ENABLE_API_LOGGING: string;
  readonly VITE_ENABLE_SERVICE_WORKER: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
