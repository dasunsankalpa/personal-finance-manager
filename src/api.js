const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// User Authentication APIs
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user profile');
    }

    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

export const saveUserDefault = async (data) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_BASE_URL}/userDefault`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const data_response = await response.json();
    if (!response.ok) throw new Error(data_response.message || 'Failed to save user defaults');
    return data_response;
  } catch (error) {
    console.error('Save user default error:', error);
    throw error;
  }
};

export const getUserDefault = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_BASE_URL}/userDefault/${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get user defaults');
    return data;
  } catch (error) {
    console.error('Get user default error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
    // Clear local storage regardless of API response
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage even if API call fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  }
};

export const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    // Store new token
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    // If refresh fails, logout user
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
};
