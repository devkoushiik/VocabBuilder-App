const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://vocab-app-express-backend-j6sd4lic0-koushik-ahmeds-projects.vercel.app';

// Debug: Log API URL (remove in production if needed)
if (__DEV__) {
  console.log('API URL configured:', API_URL);
}

const handleResponse = async (response) => {
  // Get response as text first (React Native compatible)
  const text = await response.text();
  
  // Check for HTML responses (Vercel deployment protection)
  if (text.trim().startsWith('<!') || text.includes('<html') || text.includes('Authentication Required') || text.includes('Vercel Authentication')) {
    console.error('Received HTML response - Vercel deployment protection is enabled:', text.substring(0, 300));
    throw new Error('API is protected. Please disable Vercel Deployment Protection in your Vercel project settings. Check VERCEL_PROTECTION_FIX.md for instructions.');
  }
  
  // Parse JSON
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error('JSON parse error. Response text:', text.substring(0, 200));
    throw new Error(`Invalid JSON response from server. Status: ${response.status}`);
  }
  
  // Check if response is not OK
  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    const details = data?.details || [];
    const errorMsg = details.length > 0 
      ? `${message}: ${details.join(', ')}`
      : message;
    throw new Error(errorMsg);
  }
  
  return data;
};

const buildQuery = (params = {}) => {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    // Skip undefined, null, and empty strings
    if (value === undefined || value === null || value === '') {
      return;
    }
    // Convert numbers to strings for URL params
    cleaned[key] = typeof value === 'number' ? String(value) : String(value);
  });
  return new URLSearchParams(cleaned).toString();
};

export const createVocabulary = async (payload) => {
  try {
    if (__DEV__) {
      console.log('Creating vocabulary:', payload);
    }
    
    const response = await fetch(`${API_URL}/api/v1/vocabulary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Create vocabulary error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Failed to create vocabulary. Check your internet connection and API URL.'}`);
  }
};

export const updateVocabulary = async (id, payload) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/vocabulary/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  } catch (error) {
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Failed to update vocabulary. Check your internet connection and API URL.'}`);
  }
};

export const deleteVocabulary = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/vocabulary/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    // For DELETE, 204 is success (no content)
    if (response.status === 204) {
      return;
    }
    
    // Use handleResponse for error cases
    return handleResponse(response);
  } catch (error) {
    console.error('Delete vocabulary error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Failed to delete vocabulary. Check your internet connection and API URL.'}`);
  }
};

export const deleteAllVocabulary = async () => {
  try {
    const response = await fetch(`${API_URL}/api/v1/vocabulary/delete-all-vocabulary`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Handle 204 No Content response (common for DELETE operations)
    if (response.status === 204 || response.status === 200) {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return { deletedCount: 0, message: 'All vocabulary deleted successfully' };
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        return { deletedCount: 0, message: 'All vocabulary deleted successfully' };
      }
    }

    return handleResponse(response);
  } catch (error) {
    console.error('Delete all vocabulary error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Failed to delete all vocabulary. Check your internet connection and API URL.'}`);
  }
};

export const fetchVocabulary = async (params = {}) => {
  // Ensure limit is always a valid number (default to 5 if invalid/missing)
  const cleanedParams = { ...params };
  if (cleanedParams.limit !== undefined && cleanedParams.limit !== null && cleanedParams.limit !== '') {
    const limitNum = Number(cleanedParams.limit);
    if (!Number.isNaN(limitNum) && limitNum > 0 && limitNum <= 50) {
      cleanedParams.limit = limitNum;
    } else {
      cleanedParams.limit = 5; // Default fallback if invalid
    }
  } else {
    cleanedParams.limit = 5; // Default if not provided
  }
  
  // Convert month and year to numbers if provided (only if they're valid)
  if (cleanedParams.month !== undefined && cleanedParams.month !== null && cleanedParams.month !== '') {
    const monthNum = Number(cleanedParams.month);
    if (!Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      cleanedParams.month = monthNum;
    } else {
      delete cleanedParams.month; // Remove invalid month
    }
  } else {
    delete cleanedParams.month; // Remove empty month
  }
  
  if (cleanedParams.year !== undefined && cleanedParams.year !== null && cleanedParams.year !== '') {
    const yearNum = Number(cleanedParams.year);
    if (!Number.isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
      cleanedParams.year = yearNum;
    } else {
      delete cleanedParams.year; // Remove invalid year
    }
  } else {
    delete cleanedParams.year; // Remove empty year
  }

  if (cleanedParams.page !== undefined && cleanedParams.page !== null && cleanedParams.page !== '') {
    const pageNum = Number(cleanedParams.page);
    if (!Number.isNaN(pageNum) && pageNum > 0) {
      cleanedParams.page = pageNum;
    } else {
      delete cleanedParams.page;
    }
  } else {
    delete cleanedParams.page;
  }
  
  const query = buildQuery(cleanedParams);
  const url = query
    ? `${API_URL}/api/v1/vocabulary?${query}`
    : `${API_URL}/api/v1/vocabulary`;
  
  try {
    if (__DEV__) {
      console.log('Fetching from URL:', url);
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (__DEV__) {
      console.log('Response status:', response.status, response.statusText);
    }
    
    return handleResponse(response);
  } catch (error) {
    console.error('Fetch error:', error);
    // Handle network errors
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Failed to fetch data. Check your internet connection and API URL.'}`);
  }
};

export const fetchFlashcards = (params) => fetchVocabulary(params);

