// API Configuration utility for environment-based endpoint detection

export interface ApiConfig {
  baseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  source: 'VITE_API_URL' | 'development_proxy' | 'current_origin';
}

export function getApiConfig(): ApiConfig {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;
  
  let baseUrl: string;
  let source: ApiConfig['source'];
  
  if (viteApiUrl) {
    baseUrl = viteApiUrl;
    source = 'VITE_API_URL';
  } else if (isDev) {
    baseUrl = '';
    source = 'development_proxy';
  } else {
    baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    source = 'current_origin';
  }
  
  return {
    baseUrl,
    isProduction: isProd,
    isDevelopment: isDev,
    source
  };
}

export function logApiConfig(): void {
  const config = getApiConfig();
  console.group('🔍 API Configuration');
  console.log('Base URL:', config.baseUrl || '(relative/proxy)');
  console.log('Source:', config.source);
  console.log('Environment:', config.isDevelopment ? 'development' : 'production');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || '(not set)');
  console.log('Mode:', import.meta.env.MODE);
  console.groupEnd();
}

export function buildApiUrl(endpoint: string): string {
  const config = getApiConfig();
  
  // If endpoint is already absolute, return as-is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // If no base URL (development mode), return relative
  if (!config.baseUrl) {
    return endpoint;
  }
  
  // Combine base URL with endpoint
  return `${config.baseUrl.replace(/\/$/, '')}${endpoint}`;
}