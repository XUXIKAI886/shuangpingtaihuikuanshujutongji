"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { PlatformTrendRow } from '@/app/lib/summary/buildPlatformTrendData';

interface PlatformSummaryTrendChartProps {
  data: PlatformTrendRow[];
}

const formatAmount = (value: number) => `¥${value.toFixed(2)}`;

const SummaryTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number | null; color: string; name: string; payload: PlatformTrendRow }>;
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const [{ payload: trend }] = payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
      <p className="mb-3 text-sm font-bold text-slate-800">{trend.date}</p>
      <div className="space-y-2 text-sm">
        {payload.map(item => (
            <div key={item.name} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600">{item.name}</span>
              </div>
            <span className="font-semibold text-slate-900">
              {typeof item.value === 'number' ? formatAmount(item.value) : '--'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        当日回款店铺数：{trend.totalShopCount}
      </div>
    </div>
  );
};

export default function PlatformSummaryTrendChart({ data }: PlatformSummaryTrendChartProps) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">双平台汇总趋势</h2>
          <p className="text-sm text-slate-500">
            蓝色代表饿了么汇总，橙色代表美团汇总，深色折线代表双平台合计
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
          已计入美团线下收款，并扣减退款
        </div>
      </div>

      <ResponsiveContainer width="100%" height={460}>
        <ComposedChart data={data} margin={{ top: 12, right: 18, left: -8, bottom: 8 }}>
          <defs>
            <linearGradient id="elmArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.48} />
              <stop offset="100%" stopColor="#bfdbfe" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="meituanArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#fed7aa" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={value => `¥${(value / 1000).toFixed(0)}k`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip filterNull content={<SummaryTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 18, fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="elmTotal"
            name="饿了么汇总"
            stroke="#2563eb"
            fill="url(#elmArea)"
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="meituanTotal"
            name="美团汇总"
            stroke="#ea580c"
            fill="url(#meituanArea)"
            strokeWidth={2.5}
          />
          <Line
            type="monotone"
            dataKey="grandTotal"
            name="双平台合计"
            stroke="#0f172a"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: '#0f172a' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
