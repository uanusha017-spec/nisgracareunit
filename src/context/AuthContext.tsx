import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { sanitizeText, SCHEMA_LIMITS, type UserProfile } from '../types/hospital';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isBootstrapAdmin: boolean;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBootstrapAdmin, setIsBootstrapAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthError(null);

      if (!firebaseUser) {
        setProfile(null);
        setIsAdmin(false);
        setIsBootstrapAdmin(false);
        setAuthReady(true);
        return;
      }

      const bootstrap =
        Boolean(firebaseUser.emailVerified) &&
        firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      setIsBootstrapAdmin(bootstrap);

      let adminAccess = bootstrap;
      if (!adminAccess && firebaseUser.emailVerified) {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
          adminAccess = adminSnap.exists();
        } catch {
          adminAccess = false;
        }
      }
      setIsAdmin(adminAccess);

      const userDocPath = `users/${firebaseUser.uid}`;
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else if (firebaseUser.emailVerified) {
          const displayName = sanitizeText(
            firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Nisarga Member',
            SCHEMA_LIMITS.DISPLAY_NAME_MAX,
          );
          const email = sanitizeText(firebaseUser.email || '', SCHEMA_LIMITS.EMAIL_MAX);
          const role: 'patient' | 'admin' = adminAccess ? 'admin' : 'patient';

          await setDoc(userRef, {
            uid: firebaseUser.uid,
            displayName,
            email,
            phone: '',
            role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const createdSnap = await getDoc(userRef);
          if (createdSnap.exists()) {
            setProfile(createdSnap.data() as UserProfile);
          }
        }
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.GET, userDocPath);
        } catch (wrapped) {
          console.error(wrapped);
        }
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to complete Google sign-in.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError('Sign-in could not be completed. Please allow the sign-in window and try again.');
      }
      return null;
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthBusy(true);
    try {
      await firebaseSignOut(auth);
    } finally {
      setAuthBusy(false);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isBootstrapAdmin,
        authReady,
        authBusy,
        authError,
        signInWithGoogle,
        signOut,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
