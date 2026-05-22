import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PublicLayout } from "./PublicLayout";
import { Calendar, Clock, Scissors } from "lucide-react";
import { format } from "date-fns";

type Ag = {
  id: string; data: string; hora: string; status: string; preco: number;
  barbeiros: { nome: string } | null;
  servicos: { nome: string } | null;
};

export default function MeusAgendamentos() {
  const nav = useNavigate();
  const [list, setList] = useState<Ag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { nav("/agendar/login?next=/agendar/meus"); return; }
    const { data } = await supabase
      .from("agendamentos")
      .select("id, data, hora, status, preco, barbeiros(nome), servicos(nome)")
      .order("data", { ascending: false }).order("hora", { ascending: false });
    setList((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cancelar = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    const { error } = await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Agendamento cancelado"); load(); }
  };

  const statusColor: Record<string, string> = {
    confirmado: "bg-success/20 text-success border-success/30",
    concluido: "bg-info/20 text-info border-info/30",
    cancelado: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <PublicLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Meus agendamentos</h1>
          <Button onClick={() => nav("/agendar")} className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
            Novo agendamento
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : list.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Você ainda não tem agendamentos.
          </Card>
        ) : (
          list.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-primary" />
                    <span className="font-medium">{a.servicos?.nome}</span>
                    <Badge variant="outline" className={statusColor[a.status] || ""}>{a.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                    <span><Calendar className="w-3 h-3 inline mr-1" />{format(new Date(a.data + "T00:00:00"), "dd/MM/yyyy")}</span>
                    <span><Clock className="w-3 h-3 inline mr-1" />{a.hora.slice(0, 5)}</span>
                    <span>com {a.barbeiros?.nome}</span>
                    <span className="text-primary font-semibold">R$ {Number(a.preco).toFixed(2)}</span>
                  </div>
                </div>
                {a.status === "confirmado" && (
                  <Button variant="outline" size="sm" onClick={() => cancelar(a.id)}>Cancelar</Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </PublicLayout>
  );
}
