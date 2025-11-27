const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error('Invalid response from server');
  }
  
  if (!response.ok) {
    // Extract detailed error message from backend validation
    const message = data?.message || 'Request failed';
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
  const response = await fetch(`${API_URL}/api/v1/vocabulary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const updateVocabulary = async (id, payload) => {
  const response = await fetch(`${API_URL}/api/v1/vocabulary/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const deleteVocabulary = async (id) => {
  const response = await fetch(`${API_URL}/api/v1/vocabulary/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data?.message || 'Delete failed';
    throw new Error(message);
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
  const response = await fetch(url);
  return handleResponse(response);
};

export const fetchFlashcards = (params) => fetchVocabulary(params);

