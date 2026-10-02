/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { getUserProfile, upsertUserProfile, initializeDatabaseIfEmpty } from '../services/db';
import {
  authenticateWithCredentials,
  getStoredSession,
  saveSession,
  clearSession,
  AuthVerificationResult
} from '../lib/auth-service';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  isStaff: boolean;
  isCoordinator: boolean;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  isStudentOrFaculty: boolean;
  loginWithCredentials: (identifier: string, pass: string, roleConstraint?: UserRole) => Promise<AuthVerificationResult>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize DB and connection check on mount
  useEffect(() => {
    async function boot() {
      try {
        await testConnection();
        await initializeDatabaseIfEmpty();
      } catch (err) {
        console.warn('Boot check note:', err);
      }
    }
    boot();
  }, []);

  // Initialize session from secure local storage or Firebase Auth
  useEffect(() => {
    // 1. Check stored active session first
    const activeSession = getStoredSession();
    if (activeSession && activeSession.user) {
      setCurrentUser(activeSession.user);
    } else {
      // User is not logged in by default. Do NOT auto-login as Alex Rivera!
      setCurrentUser(null);
    }

    // 2. Listen to Firebase Auth state for Google Sign-in users
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // User logged in via Firebase Auth
        const email = fbUser.email || '';
        const isAdminEmail = email.toLowerCase() === 'aqsaturk66@gmail.com' || email.toLowerCase() === 'admin@unilab.edu';

        let profile = await getUserProfile(fbUser.uid);
        if (!profile) {
          // Create initial profile
          profile = {
            id: fbUser.uid,
            name: fbUser.displayName || 'University User',
            email: email,
            role: isAdminEmail ? 'ADMIN' : 'STUDENT',
            departmentId: 'dept-cs',
            departmentName: 'Computer Science',
            studentId: isAdminEmail ? undefined : `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            active: true,
            avatarUrl: fbUser.photoURL || undefined,
            createdAt: new Date().toISOString()
          };
          try {
            await upsertUserProfile(profile);
          } catch (e) {
            console.warn('Could not write profile to firestore, keeping in memory:', e);
          }
        } else if (isAdminEmail && profile.role !== 'ADMIN') {
          profile.role = 'ADMIN';
          await upsertUserProfile(profile).catch(() => {});
        }
        setCurrentUser(profile);
        saveSession(profile);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithCredentials = async (
    identifier: string,
    pass: string,
    roleConstraint?: UserRole
  ): Promise<AuthVerificationResult> => {
    const result = authenticateWithCredentials(identifier, pass, roleConstraint);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      saveSession(result.user);
      // Also sync user profile to DB if needed
      try {
        await upsertUserProfile(result.user);
      } catch (e) {
        console.warn('Profile sync note:', e);
      }
    }
    return result;
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    clearSession();
    if (auth.currentUser) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn('Firebase signout note:', e);
      }
    }
    // Fully clear state on logout - do not revert to demo user
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      ...data,
      updatedAt: new Date().toISOString()
    };
    setCurrentUser(updated);
    saveSession(updated);
    try {
      await upsertUserProfile(updated);
    } catch (e) {
      console.warn('Profile sync warning:', e);
    }
  };

  const currentRole = currentUser?.role || null;
  const isAuthenticated = !!currentUser;
  const isAdmin = currentRole === 'ADMIN';
  const isCoordinator = currentRole === 'COORDINATOR' || isAdmin;
  const isStaff = currentRole === 'LAB_STAFF' || isCoordinator;
  const isFaculty = currentRole === 'FACULTY';
  const isStudent = currentRole === 'STUDENT';
  const isStudentOrFaculty = currentRole === 'STUDENT' || currentRole === 'FACULTY';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        isAuthenticated,
        role: currentRole,
        isStaff,
        isCoordinator,
        isAdmin,
        isFaculty,
        isStudent,
        isStudentOrFaculty,
        loginWithCredentials,
        loginWithGoogle,
        logout,
        updateProfileData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
