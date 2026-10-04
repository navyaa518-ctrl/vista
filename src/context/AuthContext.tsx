'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Profile, UserRole } from '@/types/database';
import { DEMO_ACCOUNTS, getTargetRoute, DemoAccount } from '@/lib/constants/auth';

export { DEMO_ACCOUNTS, getTargetRoute };
export type { DemoAccount };

const STORAGE_KEY = 'ashwa_active_session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    pass: string,
    fullName: string,
    productionCompany: string,
    phone: string
  ) => Promise<{ success: boolean; error?: string }>;
  signInDemo: (key: keyof typeof DEMO_ACCOUNTS) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();

  const persistSession = useCallback((u: any, p: any, r: UserRole) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user: u,
            profile: p,
            role: r,
            timestamp: Date.now(),
          })
        );
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, []);

  const clearPersistedSession = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('LocalStorage remove error:', e);
    }
  }, []);

  useEffect(() => {
    // 1. Check local cached session first for instantaneous loading
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.user) {
            setUser(parsed.user);
            setProfile(parsed.profile);
            setLoading(false);
          }
        }
      } catch (e) {
        console.warn('Error reading cached session:', e);
      }
    }

    // 2. Initialize Supabase session in the background
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          fetchProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Supabase getSession fallback:', err);
        setLoading(false);
      });

    // 3. Supabase auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id, session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, email?: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      } else if (email) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (byEmail) setProfile(byEmail as Profile);
      }
    } catch (err) {
      console.warn('Error fetching profile from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // Try same-origin Next.js server route first to bypass browser network / CORS issues
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: pass }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        setProfile(data.profile);
        setSession(data.session || null);
        persistSession(data.user, data.profile, data.role);

        // Optionally set supabase browser session
        if (data.session?.access_token && data.session?.refresh_token) {
          supabase.auth
            .setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            })
            .catch(() => {});
        }

        setAuthModalOpen(false);
        router.push(data.route || getTargetRoute(data.role));
        return { success: true };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }
    } catch (apiErr: any) {
      console.warn('API auth login error, checking demo match:', apiErr);
    }

    // Fallback: Check if credentials match any demo account directly
    const matchedDemo = Object.values(DEMO_ACCOUNTS).find(
      (acc) => acc.email.toLowerCase() === trimmedEmail && acc.password === pass
    );

    if (matchedDemo) {
      const demoUser = {
        id: `demo-${matchedDemo.role}`,
        email: matchedDemo.email,
        user_metadata: {
          full_name: matchedDemo.label,
          role: matchedDemo.role,
        },
      } as any;

      const demoProfile: Profile = {
        id: `demo-${matchedDemo.role}`,
        email: matchedDemo.email,
        full_name: matchedDemo.label,
        role: matchedDemo.role,
        phone: '+91 98200 44556',
        production_company: matchedDemo.role === 'client' ? 'Paramount Telugu Studios' : 'Ashwa Studios Ltd',
        created_at: new Date().toISOString(),
      };

      setUser(demoUser);
      setProfile(demoProfile);
      persistSession(demoUser, demoProfile, matchedDemo.role);
      setAuthModalOpen(false);
      router.push(matchedDemo.route);
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials. Please verify your email and password.' };
  };

  const signUp = async (
    email: string,
    pass: string,
    fullName: string,
    productionCompany: string,
    phone: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            production_company: productionCompany,
            role: 'client',
          },
        },
      });

      if (error) return { success: false, error: error.message };

      if (data.user) {
        const clientProfile: Profile = {
          id: data.user.id,
          email,
          full_name: fullName,
          production_company: productionCompany,
          phone,
          role: 'client',
          created_at: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert(clientProfile);
        } catch (dbErr) {
          console.warn('Could not upsert profile directly:', dbErr);
        }

        setUser(data.user);
        setProfile(clientProfile);
        persistSession(data.user, clientProfile, 'client');
        setAuthModalOpen(false);
        router.push('/portal/my-rentals');
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign up failed' };
    }
  };

  const signInDemo = async (key: keyof typeof DEMO_ACCOUNTS) => {
    const cred = DEMO_ACCOUNTS[key];
    if (!cred) return;

    try {
      // 1. Try same-origin API route
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleKey: key }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setProfile(data.profile);
          setSession(data.session || null);
          persistSession(data.user, data.profile, data.role);

          if (data.session?.access_token && data.session?.refresh_token) {
            supabase.auth
              .setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              })
              .catch(() => {});
          }

          setAuthModalOpen(false);
          router.push(data.route || cred.route);
          return;
        }
      }
    } catch (networkErr) {
      console.warn('Demo API network error, falling back to instant client session:', networkErr);
    }

    // 2. Guaranteed Fail-safe: Instant login without network blocking or alerts
    const fallbackProfile: Profile = {
      id: `demo-${key}`,
      email: cred.email,
      full_name: cred.label,
      role: cred.role,
      phone: '+91 98200 44556',
      production_company: cred.role === 'client' ? 'Paramount Telugu Studios' : 'Ashwa Studios Ltd',
      created_at: new Date().toISOString(),
    };

    const fallbackUser = {
      id: `demo-${key}`,
      email: cred.email,
      user_metadata: {
        full_name: cred.label,
        role: cred.role,
      },
    } as any;

    setUser(fallbackUser);
    setProfile(fallbackProfile);
    persistSession(fallbackUser, fallbackProfile, cred.role);
    setAuthModalOpen(false);
    router.push(cred.route);
  };

  const signOut = async () => {
    clearPersistedSession();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut warning:', e);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    router.push('/');
  };

  const role: UserRole = profile?.role || (user?.user_metadata?.role as UserRole) || 'client';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        authModalOpen,
        setAuthModalOpen,
        signIn,
        signUp,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      session: null,
      profile: null,
      role: 'client' as UserRole,
      loading: false,
      authModalOpen: false,
      setAuthModalOpen: () => {},
      signIn: async () => ({ success: false, error: 'Auth context not initialized' }),
      signUp: async () => ({ success: false, error: 'Auth context not initialized' }),
      signInDemo: async () => {},
      signOut: async () => {},
    };
  }
  return context;
}
