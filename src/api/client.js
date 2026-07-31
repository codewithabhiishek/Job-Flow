const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async fetchApi(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const rawText = await response.text();
    console.log(`[API Response] Status: ${response.status}`);
    console.log(`[API Response] Content-Type: ${response.headers.get('content-type')}`);
    console.log(`[API Response] Raw text (first 500 chars):`, rawText.substring(0, 500));

    if (!response.ok) {
      throw new Error(rawText || response.statusText);
    }
    
    return JSON.parse(rawText);
  }
}

export const apiClient = new ApiClient();
