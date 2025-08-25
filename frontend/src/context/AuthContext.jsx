import React, { createContext, useContext, useState, useEffect } from "react";
import {
  authenticate as authServiceLogin,
  logout as authServiceLogout,
  storeUserDetailsInDynamoDB,
  verifySecurityQuestionCheck,
  verifyCaesarCipher,
} from "../api/authService";
import sessionService from "../services/sessionService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem('auth')));
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // On initial load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('auth'));
    if (user) setAuthUser(user);
  }, []);

  // 1. Call Cognito login, return token + email (do not set authUser yet)
  const authenticate = (email, password) => {
    return authServiceLogin(email, password);
  };

  // 2. Store after verifying security & cipher
  const setVerifiedAuthUser = async (auth) => {
    try {
      localStorage.setItem("auth", JSON.stringify(auth.payload));
      localStorage.setItem("token", auth.jwtToken);
      
      setAuthUser(auth);
      setToken(auth.jwtToken);
      
      // Create user session
      await sessionService.createSession(auth.payload);
      
    } catch (error) {
      console.error('Error creating user session:', error);
      // Continue with login even if session creation fails
    }
  };

  // 3. Logout
  const logout = async () => {
    try {
      // End user session
      await sessionService.endSession();
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      // Always complete logout process
      authServiceLogout();
      setAuthUser(null);
      setToken(null);
    }
  };

  // Track page visibility for session management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from the app
        // Could implement session pause logic here
      } else {
        // User returned to the app
        // Could update session activity here
        if (sessionService.hasActiveSession()) {
          sessionService.updateSession({
            last_activity: new Date().toISOString()
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Session cleanup on browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionService.hasActiveSession()) {
        // Use sendBeacon for reliable session end on page unload
        navigator.sendBeacon('/api/sessions', JSON.stringify({
          action: 'logout',
          session_id: sessionService.getCurrentSessionId()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        authenticate,
        logout,
        token,
        storeUserDetailsInDynamoDB,
        verifySecurityQuestionCheck,
        verifyCaesarCipher,
        setVerifiedAuthUser,
        sessionService, // Expose session service
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);