import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PublicLayout } from "./PublicLayout";
import { Clock, Scissors, User as UserIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Servico = { id: string; nome: string; preco: number; duracao: number };
type Barbeiro = { id: string; nome: string; hora_inicio: string; hora_fim: string; dias_folga: number[] };
type Barbearia = { id: string; nome: string; hora_abertura: string; hora_fechamento: string; dias_funcionamento: number[]; intervalo_inicio: string | null; intervalo_fim: string | null };
type Bloqueio = { dia_inteiro: boolean; hora_inicio: string | null; hora_fim: string | null };

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default function Agendar() {
  const nav = useNavigate();
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [busy, setBusy] = useState<{ hora: string; duracao: number }[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [servico, setServico] = useState<Servico | null>(null);
  const [barbeiro, setBarbeiro] = useState<Barbeiro | null>(null);
  const [data, setData] = useState<Date | undefined>(new Date());
  const [hora, setHora] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [b, s, br] = await Promise.all([
        supabase.from("barbearias").select("*").limit(1).maybeSingle(),
        supabase.from("servicos").select("id, nome, preco, duracao").eq("ativo", true).order("nome"),
        supabase.from("barbeiros").select("id, nome, hora_inicio, hora_fim, dias_folga").eq("ativo", true).order("nome"),
      ]);
      if (b.data) setBarbearia(b.data as any);
      if (s.data) setServicos(s.data as any);
      if (br.data) setBarbeiros(br.data as any);
    })();
  }, []);

  useEffect(() => {
    if (!barbeiro || !data) return;
    const dStr = format(data, "yyyy-MM-dd");
    (async () => {
      const [busyRes, blqRes] = await Promise.all([
        supabase.rpc("get_busy_slots", { _barbeiro_id: barbeiro.id, _data: dStr }),
        supabase.from("barbeiro_bloqueios").select("dia_inteiro, hora_inicio, hora_fim")
          .eq("barbeiro_id", barbeiro.id).eq("data", dStr),
      ]);
      setBusy((busyRes.data as any) || []);
      setBloqueios((blqRes.data as any) || []);
    })();
  }, [barbeiro, data]);

  const slots = useMemo(() => {
    if (!barbeiro || !servico || !data || !barbearia) return [];
    const dow = data.getDay();
    if (!barbearia.dias_funcionamento.includes(dow)) return [];
    if (barbeiro.dias_folga?.includes(dow)) return [];
    if (bloqueios.some((b) => b.dia_inteiro)) return [];

    const start = Math.max(toMin(barbeiro.hora_inicio), toMin(barbearia.hora_abertura));
    const end = Math.min(toMin(barbeiro.hora_fim), toMin(barbearia.hora_fechamento));
    const intIni = barbearia.intervalo_inicio ? toMin(barbearia.intervalo_inicio) : null;
    const intFim = barbearia.intervalo_fim ? toMin(barbearia.intervalo_fim) : null;

    const out: string[] = [];
    for (let m = start; m + servico.duracao <= end; m += 30) {
      const endSlot = m + servico.duracao;
      // intervalo da barbearia
      if (intIni !== null && intFim !== null && m < intFim && endSlot > intIni) continue;
      // bloqueio parcial
      const blocked = bloqueios.some((b) => {
        if (b.dia_inteiro || !b.hora_inicio || !b.hora_fim) return false;
        const bi = toMin(b.hora_inicio); const bf = toMin(b.hora_fim);
        return m < bf && endSlot > bi;
      });
      if (blocked) continue;
      // agendamento existente
      const occupied = busy.some((a) => {
        const ai = toMin(a.hora); const af = ai + a.duracao;
        return m < af && endSlot > ai;
      });
      if (occupied) continue;
      // se hoje, ignorar horários passados
      const today = new Date();
      if (data.toDateString() === today.toDateString()) {
        if (m <= today.getHours() * 60 + today.getMinutes()) continue;
      }
      out.push(fromMin(m));
    }
    return out;
  }, [barbeiro, servico, data, barbearia, busy, bloqueios]);

  const confirm = async () => {
    if (!servico || !barbeiro || !data || !hora || !barbearia) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { nav("/agendar/login?next=/agendar"); return; }

    setSubmitting(true);
    try {
      const { data: cli } = await supabase.from("clientes").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!cli) throw new Error("Cadastro de cliente não encontrado");

      const { error } = await supabase.from("agendamentos").insert({
        cliente_id: cli.id,
        barbeiro_id: barbeiro.id,
        servico_id: servico.id,
        barbearia_id: barbearia.id,
        data: format(data, "yyyy-MM-dd"),
        hora,
        duracao: servico.duracao,
        preco: servico.preco,
        status: "confirmado",
      });
      if (error) throw error;
      toast.success("Agendamento confirmado!");
      nav("/agendar/meus");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">{barbearia?.nome || "Agendar horário"}</h1>
          <p className="text-muted-foreground mt-1">
            {["Escolha um serviço", "Escolha o barbeiro", "Escolha data e hora", "Confirme"][step - 1]}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`h-1.5 w-12 rounded-full ${n <= step ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {servicos.map((s) => (
              <Card key={s.id} className="p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => { setServico(s); setStep(2); }}>
                <div className="flex items-center gap-3">
                  <Scissors className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">{s.nome}</div>
                    <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                      <span><Clock className="w-3 h-3 inline mr-1" />{s.duracao} min</span>
                      <span className="text-primary font-semibold">R$ {Number(s.preco).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {servicos.length === 0 && <p className="text-muted-foreground text-center col-span-2">Nenhum serviço disponível.</p>}
          </div>
        )}

        {step === 2 && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              {barbeiros.map((b) => (
                <Card key={b.id} className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => { setBarbeiro(b); setStep(3); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{b.nome}</div>
                      <div className="text-xs text-muted-foreground">{b.hora_inicio.slice(0, 5)} - {b.hora_fim.slice(0, 5)}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep(1)}>← Voltar</Button>
          </>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card className="p-4">
              <Calendar mode="single" selected={data} onSelect={setData}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={ptBR} className="mx-auto" />
            </Card>
            {data && (
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-3">Horários disponíveis para {format(data, "dd 'de' MMMM", { locale: ptBR })}:</div>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum horário disponível.</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map((s) => (
                      <Button key={s} variant={hora === s ? "default" : "outline"} size="sm"
                        onClick={() => { setHora(s); setStep(4); }}>{s}</Button>
                    ))}
                  </div>
                )}
              </Card>
            )}
            <Button variant="ghost" onClick={() => setStep(2)}>← Voltar</Button>
          </div>
        )}

        {step === 4 && servico && barbeiro && data && hora && (
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">Confirmar agendamento</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Serviço</span><span className="font-medium">{servico.nome}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Barbeiro</span><span className="font-medium">{barbeiro.nome}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span className="font-medium">{format(data, "dd/MM/yyyy")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horário</span><span className="font-medium">{hora}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duração</span><span className="font-medium">{servico.duracao} min</span></div>
              <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Total</span><span className="text-primary font-bold">R$ {Number(servico.preco).toFixed(2)}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Voltar</Button>
              <Button className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold" onClick={confirm} disabled={submitting}>
                <Check className="w-4 h-4 mr-1" />{submitting ? "Confirmando..." : "Confirmar"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
