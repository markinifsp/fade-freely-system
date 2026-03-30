import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type AppRole = "admin" | "barbeiro";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  barbeariaId: string | null;
  barbeiroId: string | null;
  profile: { nome: string; email: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, role: null, barbeariaId: null, barbeiroId: null,
  profile: null, loading: true, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null);
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ nome: string; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    try {
      const [rolesRes, profileRes, barbeiroRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("nome, email, barbearia_id").eq("id", userId).single(),
        supabase.from("barbeiros").select("id").eq("user_id", userId).maybeSingle(),
      ]);

      if (rolesRes.data?.length) setRole(rolesRes.data[0].role as AppRole);
      if (profileRes.data) {
        setProfile({ nome: profileRes.data.nome, email: profileRes.data.email });
        setBarbeariaId(profileRes.data.barbearia_id);
      }
      if (barbeiroRes.data) setBarbeiroId(barbeiroRes.data.id);
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => loadUserData(session.user.id), 0);
      } else {
        setRole(null);
        setBarbeariaId(null);
        setBarbeiroId(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadUserData(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setBarbeariaId(null);
    setBarbeiroId(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, barbeariaId, barbeiroId, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
