"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import type { AuthSession } from "@/lib/types";

interface AuthContextValue {
  user: AuthSession | null;
  firebaseUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function establishSession(idToken: string): Promise<AuthSession> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    throw new Error("Failed to create session");
  }

  const data = await res.json();
  return data.user as AuthSession;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async (fbUser: User | null) => {
    if (!fbUser) {
      setUser(null);
      return;
    }
    const idToken = await fbUser.getIdToken(true);
    const session = await establishSession(idToken);
    setUser(session);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), async (fbUser) => {
      setFirebaseUser(fbUser);
      try {
        if (fbUser) {
          await refreshSession(fbUser);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [refreshSession]);

  const signUp = useCallback(async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(
      getClientAuth(),
      email,
      password
    );
    const idToken = await credential.user.getIdToken();
    const session = await establishSession(idToken);
    setUser(session);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(getClientAuth(), email, password);
    const idToken = await credential.user.getIdToken();
    const session = await establishSession(idToken);
    setUser(session);
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await firebaseSignOut(getClientAuth());
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      signUp,
      signIn,
      signOut,
      isAdmin: user?.role === "admin",
    }),
    [user, firebaseUser, loading, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
