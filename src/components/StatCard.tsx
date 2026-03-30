import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  highlight?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, highlight }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl p-5 border transition-all ${
        highlight
          ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
          : "bg-card border-border shadow-card hover:border-primary/20"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wider ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {title}
          </p>
          <p className="text-2xl font-bold font-display">{value}</p>
          {subtitle && (
            <p className={`text-xs ${highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={`text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs ontem
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          highlight ? "bg-primary-foreground/20" : "bg-primary/10"
        }`}>
          <Icon className={`w-5 h-5 ${highlight ? "text-primary-foreground" : "text-primary"}`} />
        </div>
      </div>
    </motion.div>
  );
}
