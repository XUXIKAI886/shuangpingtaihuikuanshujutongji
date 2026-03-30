'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import AllPlatformsDailyStats from "./AllPlatformsDailyStats";
import FileUpload from "./FileUpload";
import ClearDataButton from "./ClearDataButton";
import DailyCharts from "./DailyCharts";
import { BarChart3, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useDashboardData } from "@/app/hooks/useDashboardData";
import type { DailyData } from "@/app/lib/dashboard/types";

export default function ClientHome() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' 或 'YYYY-MM' 格式
  const {
    fixedFeeData,
    elmCycleData,
    meituanData,
    meituanOfflineData,
    meituanRefundData,
    hasData,
  } = useDashboardData();

  // 提取所有可用月份（从所有数据源）
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();

    [...fixedFeeData, ...elmCycleData, ...meituanData, ...meituanOfflineData, ...meituanRefundData].forEach(item => {
      const month = item.date.substring(0, 7); // 提取 YYYY-MM
      monthSet.add(month);
    });

    return Array.from(monthSet).sort().reverse(); // 降序排列，最新的月份在前
  }, [fixedFeeData, elmCycleData, meituanData, meituanOfflineData, meituanRefundData]);

  // 根据选中的月份过滤数据
  const filteredData = useMemo(() => {
    const filterByMonth = (data: DailyData[]) => {
      if (selectedMonth === 'all') return data;
      return data.filter(item => item.date.startsWith(selectedMonth));
    };

    return {
      fixedFeeData: filterByMonth(fixedFeeData),
      elmCycleData: filterByMonth(elmCycleData),
      meituanData: filterByMonth(meituanData),
      meituanOfflineData: filterByMonth(meituanOfflineData),
      meituanRefundData: filterByMonth(meituanRefundData),
    };
  }, [fixedFeeData, elmCycleData, meituanData, meituanOfflineData, meituanRefundData, selectedMonth]);

  // 计算总金额（使用过滤后的数据）
  const fixedFeeTotal = filteredData.fixedFeeData.reduce((sum, day) => sum + day.totalAmount, 0);
  const elmCycleTotal = filteredData.elmCycleData.reduce((sum, day) => sum + day.totalAmount, 0);
  const meituanTotal = filteredData.meituanData.reduce((sum, day) => sum + day.totalAmount, 0);
  const meituanOfflineTotal = filteredData.meituanOfflineData.reduce((sum, day) => sum + day.totalAmount, 0);
  const meituanRefundTotal = filteredData.meituanRefundData.reduce((sum, day) => sum + day.totalAmount, 0);
  const grandTotal = fixedFeeTotal + elmCycleTotal + meituanTotal + meituanOfflineTotal - meituanRefundTotal;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-800">
                  饿了么 & 美团回款数据统计系统
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  呈尚策划 - 双平台回款综合分析
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/summary"
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                查看汇总趋势
              </Link>
              <ClearDataButton />
            </div>
          </div>
        </div>

        {/* 月份筛选器 */}
        {availableMonths.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-semibold text-gray-700">筛选月份:</label>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="all">全部月份</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {month} ({new Date(month + '-01').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })})
                  </option>
                ))}
              </select>
              {selectedMonth !== 'all' && (
                <button
                  onClick={() => setSelectedMonth('all')}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  清除筛选
                </button>
              )}
              <div className="text-sm text-gray-500">
                当前显示: <span className="font-semibold text-gray-700">
                  {selectedMonth === 'all' ? '所有数据' : `${selectedMonth} 月数据`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 总金额概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">饿了么固定费用</p>
                <p className="text-2xl font-bold">
                  ¥{fixedFeeTotal.toFixed(2)}
                </p>
              </div>
              <div className="bg-blue-400 bg-opacity-50 p-3 rounded-full">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">饿了么代运营</p>
                <p className="text-2xl font-bold">
                  ¥{elmCycleTotal.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-400 bg-opacity-50 p-3 rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm mb-1">美团代运营</p>
                <p className="text-2xl font-bold">
                  ¥{meituanTotal.toFixed(2)}
                </p>
              </div>
              <div className="bg-orange-400 bg-opacity-50 p-3 rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">总金额</p>
                <p className="text-2xl font-bold">
                  ¥{grandTotal.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-400 bg-opacity-50 p-3 rounded-full">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* 文件上传 */}
        <FileUpload />

        {/* 可视化图表 */}
        {hasData && (
          <div className="mb-8">
            <DailyCharts
              fixedFeeData={filteredData.fixedFeeData}
              elmCycleData={filteredData.elmCycleData}
              meituanData={filteredData.meituanData}
              meituanOfflineData={filteredData.meituanOfflineData}
            />
          </div>
        )}

        {/* 每日统计表格 */}
        {hasData && (
          <div className="mb-8">
            <AllPlatformsDailyStats
              fixedFeeData={filteredData.fixedFeeData}
              elmCycleData={filteredData.elmCycleData}
              meituanData={filteredData.meituanData}
              meituanOfflineData={filteredData.meituanOfflineData}
              meituanRefundData={filteredData.meituanRefundData}
            />
          </div>
        )}

        {/* 空状态提示 */}
        {!hasData && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">暂无数据</p>
            <p className="text-gray-400">请上传 Excel 文件开始统计分析</p>
          </div>
        )}

        {/* 页脚 */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>数据来源: 饿了么固定费用 + 饿了么代运营 + 美团代运营</p>
          <p>统计平台: 饿了么 & 美团双平台回款数据</p>
          <p className="mt-2 text-xs text-gray-400">数据存储在浏览器本地,不会上传到服务器</p>
        </div>
      </div>
    </main>
  );
}
