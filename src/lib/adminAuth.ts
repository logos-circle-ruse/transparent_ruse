import type { Session, User } from "@supabase/supabase-js";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

export interface AdminAuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

export async function signInAdmin(email: string, password: string) {
  if (!hasSupabaseEnv || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  return data;
}

export async function signOutAdmin() {
  if (!hasSupabaseEnv || !supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getAdminSession() {
  if (!hasSupabaseEnv || !supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
}

export function onAdminAuthChange(callback: (session: Session | null) => void) {
  if (!hasSupabaseEnv || !supabase) {
    callback(null);
    return () => undefined;
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
