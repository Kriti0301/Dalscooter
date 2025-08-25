// src/services/sessionService.js

import axiosInstance from '../api/axiosInstance';

class SessionService {
  constructor() {
    this.currentSessionId = localStorage.getItem('session_id');
  }

  /**
   * Create a new session on login
   */
  async createSession(userData) {
    try {
      const sessionData = {
        action: 'login',
        user_id: userData.sub || userData.user_id || userData.email,
        user_role: userData['custom:role'] || userData.role || 'user',
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      };

      console.log('Creating session with data:', sessionData); // Debug log

      const response = await axiosInstance.post('/sessions', sessionData);
      
      if (response.data.session_id) {
        this.currentSessionId = response.data.session_id;
        localStorage.setItem('session_id', this.currentSessionId);
        
        // Store session start time for duration calculation
        localStorage.setItem('session_start', response.data.login_time);
        
        console.log('Session created successfully:', this.currentSessionId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      // Don't throw error to prevent login from failing
      return null;
    }
  }

  /**
   * End the current session on logout
   */
  async endSession() {
    try {
      if (!this.currentSessionId) {
        // Try to end by user_id if no session_id
        const authUser = JSON.parse(localStorage.getItem('auth') || '{}');
        if (authUser.sub || authUser.email) {
          await axiosInstance.post('/sessions', {
            action: 'logout',
            user_id: authUser.sub || authUser.email
          });
        }
        return;
      }

      const response = await axiosInstance.post('/sessions', {
        action: 'logout',
        session_id: this.currentSessionId
      });
      
      // Clear local session data
      this.clearLocalSession();
      
      console.log('Session ended successfully');
      return response.data;
    } catch (error) {
      console.error('Error ending session:', error);
      // Clear local data anyway
      this.clearLocalSession();
      // Don't throw error to prevent logout from failing
    }
  }

  /**
   * Update session information
   */
  async updateSession(updates) {
    try {
      if (!this.currentSessionId) return;

      const response = await axiosInstance.post('/sessions', {
        action: 'update',
        session_id: this.currentSessionId,
        ...updates
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating session:', error);
      // Don't throw error
      return null;
    }
  }

  /**
   * Get client IP address
   */
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not get client IP:', error);
      return 'unknown';
    }
  }

  /**
   * Clear local session data
   */
  clearLocalSession() {
    this.currentSessionId = null;
    localStorage.removeItem('session_id');
    localStorage.removeItem('session_start');
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId() {
    return this.currentSessionId;
  }

  /**
   * Check if user has an active session
   */
  hasActiveSession() {
    return !!this.currentSessionId;
  }

  /**
   * Get session duration in minutes
   */
  getSessionDuration() {
    const startTime = localStorage.getItem('session_start');
    if (!startTime) return 0;
    
    try {
      const start = new Date(startTime);
      const now = new Date();
      return Math.floor((now - start) / (1000 * 60));
    } catch (error) {
      return 0;
    }
  }
}

export default new SessionService();