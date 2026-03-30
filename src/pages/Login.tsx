import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", nome: "", nomeBarbearia: "" });

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!form.nome.trim() || !form.nomeBarbearia.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nome: form.nome } },
    });
    if (authError || !authData.user) {
      toast.error(authError?.message || "Erro ao criar conta");
      setLoading(false);
      return;
    }

    // 2. Create barbearia
    const { data: barbearia, error: barbError } = await supabase
      .from("barbearias")
      .insert({ nome: form.nomeBarbearia })
      .select()
      .single();

    if (barbError || !barbearia) {
      toast.error("Erro ao criar barbearia");
      setLoading(false);
      return;
    }

    // 3. Update profile with barbearia_id
    await supabase
      .from("profiles")
      .update({ barbearia_id: barbearia.id, nome: form.nome })
      .eq("id", authData.user.id);

    // 4. Assign admin role
    await supabase
      .from("user_roles")
      .insert({ user_id: authData.user.id, role: "admin" });

    toast.success("Conta criada com sucesso! Faça login.");
    setIsRegister(false);
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
          <h2 className="font-display text-xl font-semibold text-foreground text-center">
            {isRegister ? "Criar Conta" : "Entrar"}
          </h2>

          {isRegister && (
            <>
              <div className="space-y-2">
                <Label>Seu Nome</Label>
                <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Seu nome completo" />
              </div>
              <div className="space-y-2">
                <Label>Nome da Barbearia</Label>
                <Input value={form.nomeBarbearia} onChange={e => setForm({...form, nomeBarbearia: e.target.value})} placeholder="Ex: BarberShop Premium" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
          </div>

          <Button
            onClick={isRegister ? handleRegister : handleLogin}
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold"
          >
            {loading ? "Carregando..." : isRegister ? "Criar Conta" : "Entrar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? "Já tem conta?" : "Não tem conta?"}{" "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-primary hover:underline font-medium">
              {isRegister ? "Fazer login" : "Criar conta"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
