/**
 * INVENTRA API CLIENT SERVICE (api.js)
 * Standardized Fetch API client for all backend communication
 */

const API_BASE_URL = '/api';

class ApiClient {
  /**
   * Helper to make HTTP requests with JSON parsing and standardized error handling
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // If body is FormData, let browser set the boundary header
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Attempt to parse JSON response
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        const errorMessage = data?.error?.message || data?.error || data?.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`API Error [${options.method || 'GET'} ${url}]:`, err.message);
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

// Export singleton instance to window for vanilla JS compatibility
window.api = new ApiClient();

async function extractInventory(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const result = await window.api.upload('/ai/extract', formData);
  if (!result || result.success !== true || !result.data) {
    throw new Error('The server returned an invalid extraction response.');
  }

  return result.data;
}

async function saveVerifiedInventory(items) {
  const result = await window.api.post('/ai/verify', { items });
  if (!result || result.success !== true || !result.data || !result.data.summary) {
    throw new Error('The server returned an invalid inventory save response.');
  }

  return result.data;
}

window.InventraApi = { extractInventory, saveVerifiedInventory };
