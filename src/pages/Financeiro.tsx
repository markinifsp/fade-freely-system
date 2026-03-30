import { agendamentos, barbeiros } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";

const today = new Date().toISOString().split("T")[0];
const thisMonth = today.substring(0, 7);

const agHoje = agendamentos.filter(a => a.data === today && a.status !== "cancelado");
const agMes = agendamentos.filter(a => a.data.startsWith(thisMonth) && a.status !== "cancelado");

const fatHoje = agHoje.reduce((s, a) => s + a.preco, 0);
const fatMes = agMes.reduce((s, a) => s + a.preco, 0);

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe o faturamento e comissões</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Faturamento Hoje" value={`R$ ${fatHoje}`} icon={DollarSign} highlight />
        <StatCard title="Faturamento Mês" value={`R$ ${fatMes}`} icon={TrendingUp} />
        <StatCard title="Serviços Hoje" value={agHoje.length} icon={Calendar} />
        <StatCard title="Serviços Mês" value={agMes.length} icon={Users} />
      </div>

      {/* Comissões */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-foreground">Comissões dos Barbeiros</h2>
          <p className="text-xs text-muted-foreground mt-1">Baseado nos serviços realizados hoje</p>
        </div>
        <div className="divide-y divide-border">
          {barbeiros.filter(b => b.ativo).map(barb => {
            const bAgs = agHoje.filter(a => a.barbeiroId === barb.id);
            const bFat = bAgs.reduce((s, a) => s + a.preco, 0);
            const comissao = (bFat * barb.comissao) / 100;
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

      {/* Serviços realizados */}
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
              {agHoje.sort((a, b) => a.hora.localeCompare(b.hora)).map(ag => (
                <tr key={ag.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-3 font-medium text-primary">{ag.hora}</td>
                  <td className="p-3 text-foreground">{ag.clienteNome}</td>
                  <td className="p-3 text-muted-foreground">{ag.servicoNome}</td>
                  <td className="p-3 text-muted-foreground">{ag.barbeiroNome}</td>
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
