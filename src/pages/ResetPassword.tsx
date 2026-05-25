import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handle = async () => {
    if (password.length < 6) return toast.error("Senha precisa ter no mínimo 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não conferem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    await supabase.auth.signOut();
    nav("/agendar/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Redefinir senha</h1>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-card">
          {!ready ? (
            <p className="text-sm text-muted-foreground text-center">
              Abra o link de recuperação enviado para o seu e-mail para continuar.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Confirmar senha</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handle()} />
              </div>
              <Button onClick={handle} disabled={loading}
                className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
                {loading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
