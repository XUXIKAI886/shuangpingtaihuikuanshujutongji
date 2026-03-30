"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, Building2, CalendarRange, LineChart, Wallet } from 'lucide-react';

import { useDashboardData } from '@/app/hooks/useDashboardData';
import PlatformSummaryTrendChart from '@/app/components/PlatformSummaryTrendChart';
import { buildPlatformTrendData } from '@/app/lib/summary/buildPlatformTrendData';

const formatAmount = (value: number) => `¥${value.toFixed(2)}`;

export default function SummaryTrendsPage() {
  const dashboardData = useDashboardData();

  const trendData = useMemo(
    () => buildPlatformTrendData(dashboardData),
    [
      dashboardData.fixedFeeData,
      dashboardData.elmCycleData,
      dashboardData.meituanData,
      dashboardData.meituanOfflineData,
      dashboardData.meituanRefundData,
    ]
  );

  const totals = useMemo(() => {
    return trendData.reduce(
      (acc, item) => ({
        elmTotal: acc.elmTotal + item.elmTotal,
        meituanTotal: acc.meituanTotal + item.meituanTotal,
        grandTotal: acc.grandTotal + item.grandTotal,
      }),
      { elmTotal: 0, meituanTotal: 0, grandTotal: 0 }
    );
  }, [trendData]);

  const dateRangeLabel = trendData.length > 0
    ? `${trendData[0].date} 至 ${trendData[trendData.length - 1].date}`
    : '暂无可展示的汇总区间';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.14),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-7 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                <LineChart className="h-3.5 w-3.5" />
                Summary Trend
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">
                双平台汇总趋势页
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                这里把饿了么与美团两个平台的回款数据拉到同一条时间轴上，直接看平台汇总走势和双平台总盘子变化。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                返回主页面
              </Link>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">饿了么汇总</p>
                  <p className="mt-2 text-3xl font-bold">{formatAmount(totals.elmTotal)}</p>
                </div>
                <Building2 className="h-7 w-7 text-blue-100" />
              </div>
            </div>
            <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-50">美团汇总</p>
                  <p className="mt-2 text-3xl font-bold">{formatAmount(totals.meituanTotal)}</p>
                </div>
                <Wallet className="h-7 w-7 text-orange-50" />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">双平台合计</p>
                  <p className="mt-2 text-3xl font-bold">{formatAmount(totals.grandTotal)}</p>
                </div>
                <CalendarRange className="h-7 w-7 text-slate-300" />
              </div>
              <p className="mt-4 text-xs text-slate-400">{dateRangeLabel}</p>
            </div>
          </div>
        </section>

        {dashboardData.hasData ? (
          <PlatformSummaryTrendChart data={trendData} />
        ) : (
          <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">暂无汇总数据</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              请先回到主页面上传 Excel，或同步 `public/data/*.json` 后再查看双平台汇总趋势。
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
