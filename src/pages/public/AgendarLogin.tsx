import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PublicLayout } from "./PublicLayout";

export default function AgendarLogin() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const nav = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("next") || "/agendar";

  const handle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) toast.error(error.message);
    else nav(redirect);
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!form.email) return toast.error("Digite seu email primeiro");
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Link de recuperação enviado para seu email");
  };

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-6 space-y-4 shadow-card">
        <h1 className="font-display text-2xl font-semibold text-center">Entrar</h1>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Senha</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handle()} />
        </div>
        <Button onClick={handle} disabled={loading} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
          {loading ? "Carregando..." : "Entrar"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Não tem conta? <Link to="/agendar/cadastro" className="text-primary hover:underline">Criar conta</Link>
        </p>
      </div>
    </PublicLayout>
  );
}
