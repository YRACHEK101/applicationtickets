import api from './api';

export const UserService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('v1/users');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`v1/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post('v1/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`v1/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`v1/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get users by role
  getUsersByRole: async (role) => {
    try {
      const response = await api.get(`v1/user/role/${role}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getClients: async (userId) => {
    try {
      const response = await api.get(`v1/user/clients/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('v1/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }, 

  // change password call 
  changePassword: async (userId, passwordData) => {
    try {
      const response = await api.put(`v1/user/${userId}/change-password`, passwordData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }
  },

  // Get leaders with developers
  getLeadersWithDevelopers: async () => {
    try {
      const response = await api.get('v1/user/leaders-with-developers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default UserService;