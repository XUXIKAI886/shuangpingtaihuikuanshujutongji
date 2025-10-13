"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

interface DailyData {
  date: string;
  totalAmount: number;
  shopCount: number;
}

interface DailyChartsProps {
  fixedFeeData: DailyData[];
  elmCycleData: DailyData[];
  meituanData: DailyData[];
}

export default function DailyCharts({ fixedFeeData, elmCycleData, meituanData }: DailyChartsProps) {
  // 合并所有日期
  const allDates = new Set([
    ...fixedFeeData.map(d => d.date),
    ...elmCycleData.map(d => d.date),
    ...meituanData.map(d => d.date)
  ]);

  const sortedDates = Array.from(allDates).sort();

  // 移除最后一天的数据（因为美团数据晚一天，最后一天数据不完整）
  const displayDates = sortedDates.slice(0, -1);

  // 创建数据映射
  const fixedFeeMap = new Map(fixedFeeData.map(d => [d.date, d]));
  const elmCycleMap = new Map(elmCycleData.map(d => [d.date, d]));
  const meituanMap = new Map(meituanData.map(d => [d.date, d]));

  // 合并数据用于图表
  const chartData = displayDates.map(date => {
    const fixedFee = fixedFeeMap.get(date) || { totalAmount: 0, shopCount: 0 };
    const elmCycle = elmCycleMap.get(date) || { totalAmount: 0, shopCount: 0 };
    const meituan = meituanMap.get(date) || { totalAmount: 0, shopCount: 0 };

    return {
      date: date.substring(5), // 只显示月-日
      fullDate: date,
      totalAmount: fixedFee.totalAmount + elmCycle.totalAmount + meituan.totalAmount,
      totalShopCount: elmCycle.shopCount + meituan.shopCount,
    };
  });

  // 自定义 Tooltip - 总金额
  const AmountTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-200">
          <p className="text-sm font-bold text-gray-700 mb-2">{payload[0].payload.fullDate}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400"></div>
            <p className="text-base font-semibold text-rose-600">
              ¥{payload[0].value.toFixed(2)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // 自定义 Tooltip - 店铺数
  const ShopCountTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-200">
          <p className="text-sm font-bold text-gray-700 mb-2">{payload[0].payload.fullDate}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            <p className="text-base font-semibold text-cyan-600">
              {payload[0].value} 个店铺
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 总金额趋势图 */}
      <div className="bg-gradient-to-br from-white to-rose-50/30 rounded-2xl shadow-lg p-6 border border-rose-100/50 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-rose-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">每日总金额</h2>
              <p className="text-sm text-gray-500">收入趋势分析</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" stopOpacity={0.7}/>
                <stop offset="50%" stopColor="#fda4af" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#ffe4e6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              stroke="#e5e7eb"
              tickLine={false}
              axisLine={{ stroke: '#f3f4f6' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              stroke="#e5e7eb"
              tickLine={false}
              axisLine={{ stroke: '#f3f4f6' }}
              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<AmountTooltip />} cursor={{ stroke: '#fb7185', strokeWidth: 1.5, strokeOpacity: 0.5 }} />
            <Area
              type="monotone"
              dataKey="totalAmount"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorAmount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 总店铺数趋势图 */}
      <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl shadow-lg p-6 border border-cyan-100/50 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-50 p-3 rounded-xl">
              <Users className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">每日回款店铺</h2>
              <p className="text-sm text-gray-500">店铺数量变化</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorShopCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7}/>
                <stop offset="50%" stopColor="#67e8f9" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#cffafe" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              stroke="#e5e7eb"
              tickLine={false}
              axisLine={{ stroke: '#f3f4f6' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              stroke="#e5e7eb"
              tickLine={false}
              axisLine={{ stroke: '#f3f4f6' }}
            />
            <Tooltip content={<ShopCountTooltip />} cursor={{ stroke: '#22d3ee', strokeWidth: 1.5, strokeOpacity: 0.5 }} />
            <Area
              type="monotone"
              dataKey="totalShopCount"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorShopCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
