import { Calendar, DollarSign, Users, TrendingUp, Scissors } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useAgendamentos, useBarbeiros, useServicos } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const statusColors: Record<string, string> = {
  confirmado: "bg-info/20 text-info",
  concluido: "bg-success/20 text-success",
  cancelado: "bg-destructive/20 text-destructive",
};

const statusLabels: Record<string, string> = {
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning, 45 93% 47%))",
  "hsl(var(--destructive))",
];

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];
  const { data: agendamentos = [] } = useAgendamentos(today);
  const { data: allAg = [] } = useAgendamentos();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();

  const agHoje = agendamentos;
  const confirmados = agHoje.filter(a => a.status === "confirmado");
  const concluidos = agHoje.filter(a => a.status === "concluido");
  const faturamento = agHoje.filter(a => a.status !== "cancelado").reduce((s, a) => s + Number(a.preco), 0);

  const proximos = confirmados.sort((a, b) => (a.hora || "").localeCompare(b.hora || "")).slice(0, 5);

  // Last 7 days revenue chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const fatPorDia = last7.map(date => {
    const dayAgs = allAg.filter(a => a.data === date && a.status !== "cancelado");
    return {
      dia: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }),
      valor: dayAgs.reduce((s, a) => s + Number(a.preco), 0),
    };
  });

  // Popular services pie
  const servicoCount: Record<string, number> = {};
  allAg.filter(a => a.status !== "cancelado").forEach(a => {
    const nome = (a.servicos as any)?.nome || "Outro";
    servicoCount[nome] = (servicoCount[nome] || 0) + 1;
  });
  const servicoPie = Object.entries(servicoCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do dia — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Agendamentos" value={agHoje.length} subtitle="hoje" icon={Calendar} />
        <StatCard title="Faturamento" value={`R$ ${faturamento}`} subtitle="previsto hoje" icon={DollarSign} highlight />
        <StatCard title="Concluídos" value={concluidos.length} subtitle={`de ${agHoje.length} agendados`} icon={TrendingUp} />
        <StatCard title="Barbeiros Ativos" value={barbeiros.filter(b => b.ativo).length} icon={Users} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl shadow-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Faturamento — Últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fatPorDia} barSize={28}>
              <XAxis dataKey="dia" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                formatter={(v: number) => [`R$ ${v}`, "Faturamento"]}
              />
              <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl shadow-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Serviços Mais Populares</h2>
          {servicoPie.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={servicoPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={2} stroke="hsl(var(--card))">
                    {servicoPie.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {servicoPie.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-foreground truncate">{s.name}</span>
                    <span className="ml-auto text-muted-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-xl shadow-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Próximos Horários</h2>
          </div>
          <div className="divide-y divide-border">
            {proximos.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Nenhum agendamento próximo.</p>
            ) : (
              proximos.map((ag) => (
                <div key={ag.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-12 text-center">
                    <p className="text-lg font-bold text-primary">{ag.hora?.substring(0, 5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{(ag.clientes as any)?.nome || "—"}</p>
                    <p className="text-xs text-muted-foreground">{(ag.servicos as any)?.nome} • {(ag.barbeiros as any)?.nome}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ag.status || "confirmado"]}`}>
                    {statusLabels[ag.status || "confirmado"]}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl shadow-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Barbeiros Hoje</h2>
            <Scissors className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {barbeiros.filter(b => b.ativo).map((barb) => {
              const bAgs = agHoje.filter(a => a.barbeiro_id === barb.id && a.status !== "cancelado");
              const bFat = bAgs.reduce((s, a) => s + Number(a.preco), 0);
              return (
                <div key={barb.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {barb.nome.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{barb.nome}</p>
                    <p className="text-xs text-muted-foreground">{bAgs.length} atendimentos</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">R$ {bFat}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
