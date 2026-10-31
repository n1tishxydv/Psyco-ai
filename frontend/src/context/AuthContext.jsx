import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  auth,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from '../services/firebase.js';
import { profileService } from '../services/profileService.js';
import { isBackendConfigured } from '../services/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync token to localStorage and fetch backend user profile
  const syncBackendProfile = useCallback(async (token) => {
    if (token) {
      localStorage.setItem('psyco_token', token);
      // Skip backend sync if backend is not configured in this deployed build
      if (!isBackendConfigured()) {
        return null;
      }
      try {
        const response = await profileService.getMe();
        if (response?.data) {
          setUserProfile(response.data);
          return response.data;
        }
      } catch (err) {
        console.warn('Backend profile sync note:', err.message);
      }
    } else {
      localStorage.removeItem('psyco_token');
      setUserProfile(null);
    }
    return null;
  }, []);

  // Monitor Firebase Auth state change
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);
      if (currentFbUser) {
        try {
          const token = await currentFbUser.getIdToken();
          await syncBackendProfile(token);
        } catch (err) {
          console.error('Error fetching token during auth state change:', err);
        }
      } else {
        localStorage.removeItem('psyco_token');
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncBackendProfile]);

  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    const profile = await syncBackendProfile(token);
    return { user: userCredential.user, profile };
  };

  const registerWithEmail = async (email, password) => {
    setAuthError(null);
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('psyco_token', token);
    const profile = await syncBackendProfile(token);
    return { user: userCredential.user, profile };
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error('Google Sign-In is not configured.');
    }
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    const profile = await syncBackendProfile(token);
    return { user: result.user, profile };
  };

  const requestPasswordReset = async (email) => {
    setAuthError(null);
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } finally {
      localStorage.removeItem('psyco_token');
      setFirebaseUser(null);
      setUserProfile(null);
    }
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('psyco_token');
    if (token) {
      return syncBackendProfile(token);
    }
  };

  const role = userProfile?.role || null;
  const isAuthenticated = Boolean(firebaseUser || userProfile?.uid);
  const isOnboarded = userProfile?.onboardingStatus === 'completed';

  // Safe fallback user object when Firebase Auth succeeds before backend profile is synced
  const effectiveUser = userProfile || (firebaseUser ? {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    fullName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
    role: null,
    onboardingStatus: 'pending',
    isBackendConnected: false,
  } : null);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user: effectiveUser,
        role,
        isAuthenticated,
        isOnboarded,
        isLoading,
        isFirebaseConfigured,
        isBackendConfigured: isBackendConfigured(),
        authError,
        setAuthError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        requestPasswordReset,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
