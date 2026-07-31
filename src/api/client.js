const API_URL = 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.userId = null;
  }

  setUserId(id) {
    this.userId = id;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.userId || '',
    };
  }

  async fetchApi(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();
