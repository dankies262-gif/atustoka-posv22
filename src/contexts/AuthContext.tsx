import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Store } from '@/types/database';

// ── helpers ──────────────────────────────────────────────────────────────────

async function fetchStores(userId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchStores:', error); return []; }
  return Array.isArray(data) ? data : [];
}

async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('role, active_store_id')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

async function persistActiveStore(userId: string, storeId: string) {
  await supabase.from('profiles').update({ active_store_id: storeId }).eq('id', userId);
}

// ── context types ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  store: Store | null;       // currently active store
  stores: Store[];           // all stores owned by user
  isSuperAdmin: boolean;
  loading: boolean;
  switchStore: (storeId: string) => void;
  refreshStores: () => Promise<void>;
  signIn: (emailOrPhone: string, password: string) => Promise<{ error: Error | null; isSuperAdmin?: boolean }>;
  signUp: (email: string, password: string, metadata: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // legacy alias kept for pages that still call refreshStore()
  refreshStore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [stores, setStores]           = useState<Store[]>([]);
  const [store, setStore]             = useState<Store | null>(null);
  const [isSuperAdmin, setSuperAdmin] = useState(false);
  const [loading, setLoading]         = useState(true);

  // Load all stores for a user and pick the active one
  const loadStores = useCallback(async (userId: string) => {
    const [allStores, profile] = await Promise.all([
      fetchStores(userId),
      fetchProfile(userId),
    ]);

    setStores(allStores);
    setSuperAdmin(profile?.role === 'superadmin');

    if (allStores.length === 0) { setStore(null); return; }

    // Try previously-active store first, fall back to first store
    const active = allStores.find(s => s.id === profile?.active_store_id) ?? allStores[0];
    setStore(active);
  }, []);

  // Switch active store (also persists choice to DB)
  const switchStore = useCallback((storeId: string) => {
    const target = stores.find(s => s.id === storeId);
    if (!target || !user) return;
    setStore(target);
    persistActiveStore(user.id, storeId);
  }, [stores, user]);

  // Re-fetch stores (called after create/delete)
  const refreshStores = useCallback(async () => {
    if (!user) return;
    await loadStores(user.id);
  }, [user, loadStores]);

  // Bootstrap on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadStores(u.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadStores(u.id);
      else { setStores([]); setStore(null); setSuperAdmin(false); }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-check role & stores when user returns to the tab (picks up DB role changes)
  useEffect(() => {
    const onFocus = () => {
      if (user) loadStores(user.id);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, loadStores]);

  // ── auth actions ────────────────────────────────────────────────────────────

  const signIn = async (emailOrPhone: string, password: string) => {
    try {
      let loginEmail = emailOrPhone.trim();

      // If the identifier looks like a phone number, resolve it to an email first
      const looksLikePhone = /^[+\d][\d\s\-]{5,}$/.test(loginEmail);
      if (looksLikePhone) {
        const { data: resolved, error: lookupErr } = await supabase
          .rpc('get_email_by_phone_for_login', { p_phone: loginEmail });
        if (lookupErr || !resolved) {
          throw new Error('No account found for this phone number');
        }
        loginEmail = resolved as string;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) throw error;
      // Fetch role immediately so caller can redirect appropriately
      const profile = data.user ? await fetchProfile(data.user.id) : null;
      const adminFlag = profile?.role === 'superadmin';
      return { error: null, isSuperAdmin: adminFlag };
    } catch (err) {
      return { error: err as Error, isSuperAdmin: false };
    }
  };

  const signUp = async (email: string, password: string, metadata: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) throw error;

      if (data.user) {
        // Update profile with phone number
        if (metadata.phone) {
          await supabase.from('profiles').update({ phone: String(metadata.phone) }).eq('id', data.user.id);
        }

        // Insert first store
        const { error: storeError } = await supabase.from('stores').insert({
          owner_id: data.user.id,
          business_name: metadata.businessName,
          business_type: metadata.businessType,
          region: metadata.region,
          town: metadata.town ?? null,
          phone: metadata.phone ?? null,
        });
        if (storeError) {
          console.error('Error creating first store:', storeError);
        } else {
          // Fetch the just-created store and set it as active_store_id in profile
          const { data: newStore } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', data.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (newStore?.id) {
            await supabase
              .from('profiles')
              .update({ active_store_id: newStore.id })
              .eq('id', data.user.id);
          }
        }
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStores([]);
    setStore(null);
    setSuperAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user, store, stores, isSuperAdmin, loading,
      switchStore, refreshStores,
      signIn, signUp, signOut,
      refreshStore: refreshStores, // legacy alias
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
