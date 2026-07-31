const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.getTokenFn = null;
  }

  setGetTokenFn(fn) {
    this.getTokenFn = fn;
  }

  async getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.getTokenFn) {
      try {
        const token = await this.getTokenFn();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("[ApiClient] Failed to get token", err);
      }
    }
    return headers;
  }

  async fetchApi(endpoint, options = {}) {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const rawText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    // Only log in development and keep it brief
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} | Content-Type: ${contentType}`);
    }

    if (!response.ok) {
      throw new Error(rawText || response.statusText);
    }
    
    if (contentType.includes('text/html')) {
      throw new Error(`API returned an HTML page instead of JSON. This usually indicates a routing issue (like hitting a SPA fallback) or a server crash. URL: ${API_URL}${endpoint}`);
    }
    
    return JSON.parse(rawText);
  }
}

export const apiClient = new ApiClient();
