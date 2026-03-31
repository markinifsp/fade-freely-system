import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">BarberPro</h1>
          <p className="text-muted-foreground mt-1">Gestão Premium para Barbearias</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-card">
          <h2 className="font-display text-xl font-semibold text-foreground text-center">Entrar</h2>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold"
          >
            {loading ? "Carregando..." : "Entrar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
