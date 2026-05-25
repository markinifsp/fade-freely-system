import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scissors, LogOut, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    nav("/agendar");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/agendar" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">BarberPro</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {authed ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/agendar/meus")}>
                  <CalendarCheck className="w-4 h-4 mr-1" /> Meus agendamentos
                </Button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => nav("/agendar/login")}>
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
