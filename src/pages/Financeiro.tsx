import { useAgendamentos, useBarbeiros } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--info))",
  "hsl(var(--success))",
];

export default function Financeiro() {
  const today = new Date().toISOString().split("T")[0];
  const { data: allAg = [] } = useAgendamentos();
  const { data: agHoje = [] } = useAgendamentos(today);
  const { data: barbeiros = [] } = useBarbeiros();
  const { role } = useAuth();

  const thisMonth = today.substring(0, 7);
  const agMes = allAg.filter(a => (a.data || "").startsWith(thisMonth) && a.status !== "cancelado");
  const agHojeOk = agHoje.filter(a => a.status !== "cancelado");

  const fatHoje = agHojeOk.reduce((s, a) => s + Number(a.preco), 0);
  const fatMes = agMes.reduce((s, a) => s + Number(a.preco), 0);

  // Daily revenue for current month (line chart)
  const daysInMonth = new Date(parseInt(thisMonth.split("-")[0]), parseInt(thisMonth.split("-")[1]), 0).getDate();
  const fatDiario = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const date = `${thisMonth}-${day}`;
    const val = allAg.filter(a => a.data === date && a.status !== "cancelado").reduce((s, a) => s + Number(a.preco), 0);
    return { dia: i + 1, valor: val };
  });

  // Barber performance (bar chart)
  const barbPerf = barbeiros.filter(b => b.ativo).map(barb => {
    const bAgs = agMes.filter(a => a.barbeiro_id === barb.id);
    const fat = bAgs.reduce((s, a) => s + Number(a.preco), 0);
    const comissao = (fat * (barb.comissao || 0)) / 100;
    return { nome: barb.nome.split(" ")[0], faturamento: fat, comissao: Math.round(comissao), servicos: bAgs.length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe o faturamento e comissões</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Faturamento Hoje" value={`R$ ${fatHoje}`} icon={DollarSign} highlight />
        <StatCard title="Faturamento Mês" value={`R$ ${fatMes}`} icon={TrendingUp} />
        <StatCard title="Serviços Hoje" value={agHojeOk.length} icon={Calendar} />
        <StatCard title="Serviços Mês" value={agMes.length} icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl shadow-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1">Faturamento Diário</h2>
          <p className="text-xs text-muted-foreground mb-4">{new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={fatDiario}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                formatter={(v: number) => [`R$ ${v}`, "Faturamento"]}
              />
              <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl shadow-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1">Performance dos Barbeiros</h2>
          <p className="text-xs text-muted-foreground mb-4">Faturamento e comissão no mês</p>
          {barbPerf.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barbPerf} barGap={4}>
                <XAxis dataKey="nome" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  formatter={(v: number, name: string) => [`R$ ${v}`, name === "faturamento" ? "Faturamento" : "Comissão"]}
                />
                <Bar dataKey="faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comissao" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-xl shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-foreground">Comissões dos Barbeiros</h2>
          <p className="text-xs text-muted-foreground mt-1">Baseado nos serviços realizados hoje</p>
        </div>
        <div className="divide-y divide-border">
          {barbeiros.filter(b => b.ativo).map(barb => {
            const bAgs = agHojeOk.filter(a => a.barbeiro_id === barb.id);
            const bFat = bAgs.reduce((s, a) => s + Number(a.preco), 0);
            const comissao = (bFat * (barb.comissao || 0)) / 100;
            return (
              <div key={barb.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {barb.nome.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{barb.nome}</p>
                  <p className="text-xs text-muted-foreground">{bAgs.length} serviços • {barb.comissao}% comissão</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">R$ {bFat}</p>
                  <p className="text-xs text-primary font-medium">R$ {comissao.toFixed(0)} comissão</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-foreground">Serviços Realizados Hoje</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Hora</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Serviço</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Barbeiro</th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {agHojeOk.sort((a, b) => (a.hora || "").localeCompare(b.hora || "")).map(ag => (
                <tr key={ag.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-3 font-medium text-primary">{ag.hora?.substring(0, 5)}</td>
                  <td className="p-3 text-foreground">{(ag.clientes as any)?.nome || "—"}</td>
                  <td className="p-3 text-muted-foreground">{(ag.servicos as any)?.nome}</td>
                  <td className="p-3 text-muted-foreground">{(ag.barbeiros as any)?.nome}</td>
                  <td className="p-3 text-right font-semibold text-foreground">R$ {ag.preco}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={4} className="p-3 font-semibold text-foreground">Total</td>
                <td className="p-3 text-right font-bold text-primary text-lg">R$ {fatHoje}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
