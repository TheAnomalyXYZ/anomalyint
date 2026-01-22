import { Card } from "../ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { KPIStat as KPIStatType } from "../../lib/types";

interface KPIStatProps {
  stat: KPIStatType;
}

export function KPIStat({ stat }: KPIStatProps) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow border-2">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        {stat.change !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              stat.trend === 'up'
                ? 'bg-emerald-100 text-emerald-700'
                : stat.trend === 'down'
                ? 'bg-red-100 text-red-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {stat.trend === 'up' && <ArrowUp className="h-3 w-3" />}
            {stat.trend === 'down' && <ArrowDown className="h-3 w-3" />}
            {stat.trend === 'neutral' && <Minus className="h-3 w-3" />}
            <span>
              {stat.trend === 'up' ? '+' : ''}{stat.change}
            </span>
          </div>
        )}
      </div>
      <div className="text-3xl">{stat.value}</div>
    </Card>
  );
}
