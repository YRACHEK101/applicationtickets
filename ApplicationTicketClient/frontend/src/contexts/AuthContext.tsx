import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  preferredLanguage?: string;
  company?: {
    id: string;
    name: string;
  };
  unreadNotificationsCount?: number;
}

interface tType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
}

const t = createContext<tType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Set language based on user preference
  useEffect(() => {
    if (user?.preferredLanguage) {
      i18n.changeLanguage(user.preferredLanguage);
    }
  }, [user?.preferredLanguage, i18n]);

  const fetchUser = async () => {
    try {
      const response = await api.get('v1/auth/me');
      const userData = response.data;

      setUser({
        id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        preferredLanguage: userData.preferredLanguage,
        company: userData.company ? {
          id: userData.company._id,
          name: userData.company.name
        } : undefined,
        unreadNotificationsCount: userData.unreadNotificationsCount
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsLoading(true);
      await fetchUser();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/v1/auth/login', { email, password });
    const { token, user: userData } = response.data;

    // Store token
    localStorage.setItem('token', token);

    // Set language based on user preference if available
    if (userData.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage);
    }

    // Set user data
    setUser({
      id: userData._id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      phone: userData.phone,
      preferredLanguage: userData.preferredLanguage,
      company: userData.company ? {
        id: userData.company._id,
        name: userData.company.name
      } : undefined,
      unreadNotificationsCount: userData.unreadNotificationsCount
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <t.Provider value={{
      user,
      login,
      logout,
      isLoading,
      isAuthenticated: !!user,
      setUser,
      refreshUser
    }}>
      {children}
    </t.Provider>
  );
}

export function useAuth() {
  const context = useContext(t);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}