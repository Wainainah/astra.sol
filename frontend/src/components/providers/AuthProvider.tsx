"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface UserProfile {
  address: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  twitter: string | null;
  createdAt: string | null;
  isNewUser: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isNewUser: boolean;
  showProfileSetup: boolean;
  token: string | null;
  setShowProfileSetup: (show: boolean) => void;
  refreshUser: () => Promise<void>;
  authenticate: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, signMessage } = useWallet();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("astra_auth_token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Check user profile when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      checkUserProfile(publicKey.toBase58());
    } else if (!connected) {
      // Reset state when wallet disconnects
      setUser(null);
      setIsNewUser(false);
      setShowProfileSetup(false);
      setToken(null);
      localStorage.removeItem("astra_auth_token");
    }
  }, [connected, publicKey]);

  const checkUserProfile = async (address: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${address}/profile`);

      if (response.status === 404) {
        // New user with no activity
        setUser({
          address,
          username: null,
          displayName: null,
          bio: null,
          avatarUrl: null,
          twitter: null,
          createdAt: null,
          isNewUser: true,
        });
        setIsNewUser(true);
        setShowProfileSetup(true);
      } else if (response.ok) {
        const profile = await response.json();
        setUser(profile);
        setIsNewUser(profile.isNewUser);

        // Show profile setup if user hasn't set up their profile yet
        // Check if they have NO profile data at all (no username, no displayName, no bio, no avatar)
        const hasNoProfileData =
          !profile.username &&
          !profile.displayName &&
          !profile.bio &&
          !profile.avatarUrl;
        if (profile.isNewUser || hasNoProfileData) {
          setShowProfileSetup(true);
        }
      }
    } catch (error) {
      console.error("Failed to check user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async () => {
    if (!publicKey || !signMessage) return;

    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const message = `Sign in to Astra Protocol\nWallet: ${publicKey.toBase58()}\nTimestamp: ${timestamp}`;

      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = Buffer.from(signatureBytes).toString("base64");

      const response = await fetch("/api/auth/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature,
          message,
          timestamp,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        localStorage.setItem("astra_auth_token", data.token);

        if (data.user) {
          setUser(data.user);
          setIsNewUser(data.isNewUser);
        }
      }
    } catch (error) {
      console.error("Authentication failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!publicKey) return;
    await checkUserProfile(publicKey.toBase58());
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/users/${publicKey.toBase58()}/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profile),
        },
      );

      if (response.ok) {
        await refreshUser();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isNewUser,
        showProfileSetup,
        token,
        setShowProfileSetup,
        refreshUser,
        authenticate,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
