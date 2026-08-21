import { useState } from "react";
import { useAgendamentosByRange, useBarbeiros } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, TrendingUp, Users, Calendar, ChevronDown, FileDown, FileText } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FORMAS_PAGAMENTO, formaLabel } from "@/components/ConcluirAgendamentoDialog";
import { exportCSV, exportPDF, type ReportSection } from "@/lib/export";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--info))",
  "hsl(var(--success))",
];

export default function Financeiro() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(today, "yyyy-MM-dd"));
  const [expandido, setExpandido] = useState<string | null>(null);

  const { data: allAg = [] } = useAgendamentosByRange(startDate, endDate);
  const { data: barbeiros = [] } = useBarbeiros();
  const { role } = useAuth();

  const agOk = allAg.filter(a => a.status !== "cancelado");
  const valorTotalAg = (a: any) => Number(a.preco) + Number(a.valor_extra || 0);
  const fatTotal = agOk.reduce((s, a) => s + valorTotalAg(a), 0);
  const totalExtras = agOk.reduce((s, a) => s + Number((a as any).valor_extra || 0), 0);

  // Breakdown por forma de pagamento (apenas concluídos)
  const agPagos = agOk.filter(a => a.status === "concluido");
  const porForma = FORMAS_PAGAMENTO.map(f => ({
    ...f,
    total: agPagos.filter(a => (a as any).forma_pagamento === f.value).reduce((s, a) => s + valorTotalAg(a), 0),
    qtd: agPagos.filter(a => (a as any).forma_pagamento === f.value).length,
  }));
  const semForma = agPagos.filter(a => !(a as any).forma_pagamento);

  // Daily revenue line chart
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  const fatDiario = days.map(d => {
    const dateStr = format(d, "yyyy-MM-dd");
    const val = allAg.filter(a => a.data === dateStr && a.status !== "cancelado").reduce((s, a) => s + valorTotalAg(a), 0);
    return { dia: format(d, days.length > 20 ? "dd" : "dd/MM"), valor: val };
  });

  // Barber performance
  const barbPerf = barbeiros.filter(b => b.ativo).map(barb => {
    const bAgs = agOk.filter(a => a.barbeiro_id === barb.id);
    const fat = bAgs.reduce((s, a) => s + valorTotalAg(a), 0);
    const comissao = (fat * (barb.comissao || 0)) / 100;
    return { nome: barb.nome.split(" ")[0], faturamento: fat, comissao: Math.round(comissao), servicos: bAgs.length };
  });

  // Today's appointments for the commission table
  const todayStr = format(today, "yyyy-MM-dd");
  const agHojeOk = allAg.filter(a => a.data === todayStr && a.status !== "cancelado");
  const fatHoje = agHojeOk.reduce((s, a) => s + valorTotalAg(a), 0);

  // ---- Relatório consolidado ----
  const periodoLabel = `${format(parseISO(startDate), "dd/MM/yyyy")} a ${format(parseISO(endDate), "dd/MM/yyyy")}`;
  const brl = (v: number) => `R$ ${v.toFixed(2)}`;

  const buildSections = (): ReportSection[] => {
    const formasRows = porForma.map(f => [f.label, f.qtd, brl(f.total)]);
    if (semForma.length) {
      formasRows.push([
        "Sem forma informada",
        semForma.length,
        brl(semForma.reduce((s, a) => s + valorTotalAg(a), 0)),
      ]);
    }
    formasRows.push(["TOTAL CONCLUÍDO", agPagos.length, brl(agPagos.reduce((s, a) => s + valorTotalAg(a), 0))]);

    const comissoesRows = barbeiros.filter(b => b.ativo).map(barb => {
      const bAgs = agOk.filter(a => a.barbeiro_id === barb.id);
      const bFat = bAgs.reduce((s, a) => s + valorTotalAg(a), 0);
      return [barb.nome, bAgs.length, `${barb.comissao || 0}%`, brl(bFat), brl((bFat * (barb.comissao || 0)) / 100)];
    });
    const totalComissao = comissoesRows.reduce((s, r) => s + Number(String(r[4]).replace("R$ ", "")), 0);
    comissoesRows.push(["TOTAL", agOk.length, "", brl(fatTotal), brl(totalComissao)]);

    return [
      {
        title: "Resumo do período",
        head: ["Indicador", "Valor"],
        rows: [
          ["Faturamento total", brl(fatTotal)],
          ["Entradas extras", brl(totalExtras)],
          ["Atendimentos", agOk.length],
          ["Atendimentos concluídos", agPagos.length],
          ["Ticket médio", brl(agOk.length ? fatTotal / agOk.length : 0)],
        ],
      },
      { title: "Por forma de pagamento", head: ["Forma", "Qtd", "Total"], rows: formasRows },
      { title: "Comissões dos barbeiros", head: ["Barbeiro", "Serviços", "%", "Faturamento", "Comissão"], rows: comissoesRows },
    ];
  };

  const meta = ["Relatório consolidado — Financeiro", `Período: ${periodoLabel}`, `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`];
  const fileBase = `relatorio-financeiro-${startDate}_a_${endDate}`;

  const mesAtual = () => {
    setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
  };
  const mesAnterior = () => {
    const ref = subDays(startOfMonth(today), 1);
    setStartDate(format(startOfMonth(ref), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(ref), "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe o faturamento e comissões</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full sm:w-[150px] h-9 text-sm" />
          </div>
          <div className="space-y-1 flex-1 min-w-[130px] sm:flex-none">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full sm:w-[150px] h-9 text-sm" />
          </div>
          <Button variant="outline" size="sm" className="h-9 flex-1 sm:flex-none" onClick={mesAtual}>Mês atual</Button>
          <Button variant="outline" size="sm" className="h-9 flex-1 sm:flex-none" onClick={mesAnterior}>Mês anterior</Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 flex-1 sm:flex-none" onClick={() => exportCSV(`${fileBase}.csv`, buildSections(), meta)}>
            <FileDown className="w-4 h-4" /> CSV
          </Button>
          <Button size="sm" className="h-9 gap-1.5 flex-1 sm:flex-none" onClick={() => exportPDF(`${fileBase}.pdf`, "Relatório Financeiro", buildSections(), meta.slice(1))}>
            <FileText className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Faturamento Hoje" value={`R$ ${fatHoje.toFixed(2)}`} icon={DollarSign} highlight />
        <StatCard title="Faturamento Período" value={`R$ ${fatTotal.toFixed(2)}`} icon={TrendingUp} />
        <StatCard title="Serviços Hoje" value={agHojeOk.length} icon={Calendar} />
        <StatCard title="Serviços Período" value={agOk.length} icon={Users} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Fluxo por forma de pagamento</h2>
            <p className="text-xs text-muted-foreground">Atendimentos concluídos no período</p>
          </div>
          <p className="text-xs text-muted-foreground">Entradas extras: <span className="text-primary font-semibold">R$ {totalExtras.toFixed(2)}</span></p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {porForma.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.value} className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" /> {f.label}</p>
                <p className="text-lg font-semibold text-foreground mt-1">R$ {f.total.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">{f.qtd} atendimentos</p>
              </div>
            );
          })}
        </div>
        {semForma.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">{semForma.length} atendimento(s) concluído(s) sem forma de pagamento informada.</p>
        )}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl shadow-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1">Faturamento Diário</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {format(parseISO(startDate), "dd/MM/yyyy")} — {format(parseISO(endDate), "dd/MM/yyyy")}
          </p>
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
          <p className="text-xs text-muted-foreground mb-4">Faturamento e comissão no período</p>
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
          <p className="text-xs text-muted-foreground mt-1">Clique em um barbeiro para ver os serviços do período</p>
        </div>
        <div className="divide-y divide-border">
          {barbeiros.filter(b => b.ativo).map(barb => {
            const bAgs = agOk.filter(a => a.barbeiro_id === barb.id)
              .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
            const bFat = bAgs.reduce((s, a) => s + valorTotalAg(a), 0);
            const comissao = (bFat * (barb.comissao || 0)) / 100;
            const aberto = expandido === barb.id;
            return (
              <div key={barb.id}>
                <button
                  onClick={() => setExpandido(aberto ? null : barb.id)}
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {barb.nome.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{barb.nome}</p>
                    <p className="text-xs text-muted-foreground">{bAgs.length} serviços • {barb.comissao}% comissão</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">R$ {bFat.toFixed(2)}</p>
                    <p className="text-xs text-primary font-medium">R$ {comissao.toFixed(0)} comissão</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`} />
                </button>
                {aberto && (
                  <div className="bg-muted/10 border-t border-border">
                    {bAgs.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">Nenhum serviço no período.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Data</th>
                              <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Hora</th>
                              <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                              <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Serviço</th>
                              <th className="p-3 text-xs font-medium text-muted-foreground uppercase text-right">Valor</th>
                              <th className="p-3 text-xs font-medium text-muted-foreground uppercase text-right">Comissão</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bAgs.map(ag => (
                              <tr key={ag.id} className="border-b border-border/50">
                                <td className="p-3 text-muted-foreground">{format(parseISO(ag.data), "dd/MM", { locale: ptBR })}</td>
                                <td className="p-3 font-medium text-primary">{ag.hora?.substring(0, 5)}</td>
                                <td className="p-3 text-foreground">{(ag.clientes as any)?.nome || "—"}</td>
                                <td className="p-3 text-muted-foreground">
                                  {(ag.servicos as any)?.nome}
                                  {Number((ag as any).valor_extra) > 0 && (
                                    <span className="block text-[10px] text-primary">+R$ {Number((ag as any).valor_extra).toFixed(2)} {(ag as any).obs_pagamento || "extra"}</span>
                                  )}
                                  <span className="block text-[10px] text-muted-foreground">{ag.status === "concluido" ? formaLabel((ag as any).forma_pagamento) : "—"}</span>
                                </td>
                                <td className="p-3 text-right font-semibold text-foreground">R$ {valorTotalAg(ag).toFixed(2)}</td>
                                <td className="p-3 text-right text-primary">R$ {((valorTotalAg(ag) * (barb.comissao || 0)) / 100).toFixed(0)}</td>

                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={4} className="p-3 font-semibold text-foreground">Total</td>
                              <td className="p-3 text-right font-bold text-foreground">R$ {bFat.toFixed(2)}</td>
                              <td className="p-3 text-right font-bold text-primary">R$ {comissao.toFixed(0)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
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
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Pagamento</th>
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
                  <td className="p-3 text-muted-foreground">{ag.status === "concluido" ? formaLabel((ag as any).forma_pagamento) : "—"}</td>
                  <td className="p-3 text-right font-semibold text-foreground">R$ {valorTotalAg(ag).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={5} className="p-3 font-semibold text-foreground">Total</td>
                <td className="p-3 text-right font-bold text-primary text-lg">R$ {fatHoje.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}