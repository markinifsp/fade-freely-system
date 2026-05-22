import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PublicLayout } from "./PublicLayout";

export default function AgendarCadastro() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", password: "" });
  const nav = useNavigate();

  const handle = async () => {
    if (!form.nome || !form.email || !form.password || !form.telefone) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      // 1. Sign up
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/agendar`,
          data: { nome: form.nome },
        },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Falha ao criar conta");

      // 2. Find the barbearia (single)
      const { data: barbearia } = await supabase
        .from("barbearias").select("id").limit(1).maybeSingle();

      // 3. Insert cliente row linked to this user
      if (barbearia) {
        await supabase.from("clientes").insert({
          nome: form.nome,
          telefone: form.telefone,
          email: form.email,
          user_id: userId,
          barbearia_id: barbearia.id,
        });
      }

      // 4. Insert role
      await supabase.from("user_roles").insert({ user_id: userId, role: "cliente" });

      toast.success("Conta criada!");
      nav("/agendar");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-6 space-y-4 shadow-card">
        <h1 className="font-display text-2xl font-semibold text-center">Criar conta</h1>
        <div className="space-y-2">
          <Label>Nome completo</Label>
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Senha</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <Button onClick={handle} disabled={loading} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
          {loading ? "Criando..." : "Criar conta"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Já tem conta? <Link to="/agendar/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </PublicLayout>
  );
}
