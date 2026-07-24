import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAdminSession, onAdminAuthChange } from "../lib/adminAuth";

export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getAdminSession()
      .then((currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setIsLoading(false);
      });

    const unsubscribe = onAdminAuthChange((nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    isAuthenticated: Boolean(session?.access_token),
    isLoading,
  };
}
