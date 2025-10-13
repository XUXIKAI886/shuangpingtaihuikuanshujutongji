"use client";

import { Calendar, DollarSign, Store, TrendingUp } from "lucide-react";

interface DailyData {
  date: string;
  totalAmount: number;
  shopCount: number;
}

interface CombinedDailyStatsProps {
  fixedFeeData: DailyData[];  // 固定费用数据
  cycleData: DailyData[];      // 周期账单数据
}

export default function CombinedDailyStats({ fixedFeeData, cycleData }: CombinedDailyStatsProps) {
  // 合并两个数据源的日期
  const allDates = new Set([
    ...fixedFeeData.map(d => d.date),
    ...cycleData.map(d => d.date)
  ]);

  // 转换为数组并排序
  const sortedDates = Array.from(allDates).sort();

  // 创建数据映射
  const fixedFeeMap = new Map(fixedFeeData.map(d => [d.date, d]));
  const cycleMap = new Map(cycleData.map(d => [d.date, d]));

  // 合并数据
  const combinedData = sortedDates.map(date => {
    const fixedFee = fixedFeeMap.get(date) || { totalAmount: 0, shopCount: 0 };
    const cycle = cycleMap.get(date) || { totalAmount: 0, shopCount: 0 };

    return {
      date,
      fixedFeeAmount: fixedFee.totalAmount,
      fixedFeeShopCount: fixedFee.shopCount,
      cycleAmount: cycle.totalAmount,
      cycleShopCount: cycle.shopCount,
      totalAmount: fixedFee.totalAmount + cycle.totalAmount,
    };
  });

  // 计算总计
  const totals = combinedData.reduce((acc, day) => ({
    fixedFeeAmount: acc.fixedFeeAmount + day.fixedFeeAmount,
    cycleAmount: acc.cycleAmount + day.cycleAmount,
    totalAmount: acc.totalAmount + day.totalAmount,
    fixedFeeShopCount: acc.fixedFeeShopCount + day.fixedFeeShopCount,
    cycleShopCount: acc.cycleShopCount + day.cycleShopCount,
  }), {
    fixedFeeAmount: 0,
    cycleAmount: 0,
    totalAmount: 0,
    fixedFeeShopCount: 0,
    cycleShopCount: 0,
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">每日回款统计</h2>
        <div className="flex gap-6 text-sm text-gray-600">
          <span>统计周期: {sortedDates.length} 天</span>
          <span>饿了么固定费用总计: ¥{totals.fixedFeeAmount.toFixed(2)}</span>
          <span>饿了么代运营回款总计: ¥{totals.cycleAmount.toFixed(2)}</span>
          <span className="font-semibold text-blue-600">合计总金额: ¥{totals.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider" colSpan={2}>
                  饿了么固定费用
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-green-700 uppercase tracking-wider" colSpan={2}>
                  饿了么代运营回款
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">
                  每日总计
                </th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-2"></th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600">金额</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600">店铺数</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600">金额</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600">店铺数</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-600">总金额</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {combinedData.map((day) => {
                const hasFixedFee = day.fixedFeeAmount > 0;
                const hasCycle = day.cycleAmount > 0;

                return (
                  <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {day.date}
                        </span>
                      </div>
                    </td>

                    {/* 固定费用金额 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-semibold ${
                        hasFixedFee ? 'text-blue-600' : 'text-gray-300'
                      }`}>
                        ¥{day.fixedFeeAmount.toFixed(2)}
                      </span>
                    </td>

                    {/* 固定费用店铺数 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm ${
                        hasFixedFee ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        {day.fixedFeeShopCount}
                      </span>
                    </td>

                    {/* 代运营金额 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-semibold ${
                        hasCycle ? 'text-green-600' : 'text-gray-300'
                      }`}>
                        ¥{day.cycleAmount.toFixed(2)}
                      </span>
                    </td>

                    {/* 代运营店铺数 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm ${
                        hasCycle ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        {day.cycleShopCount}
                      </span>
                    </td>

                    {/* 每日总计 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-purple-600 mr-1" />
                        <span className="text-sm font-bold text-purple-600">
                          ¥{day.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">总计</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-blue-600">
                    ¥{totals.fixedFeeAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-gray-900">
                    {totals.fixedFeeShopCount} 店次
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-green-600">
                    ¥{totals.cycleAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-gray-900">
                    {totals.cycleShopCount} 店次
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 mr-1" />
                    <span className="text-base font-bold text-purple-600">
                      ¥{totals.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 数据说明 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">饿了么固定费用</h3>
          </div>
          <p className="text-xs text-blue-800">
            代运营固定费用账单，每个店铺净结算金额为33.95元（35元 - 1.05元抽佣）
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-green-900">饿了么代运营回款</h3>
          </div>
          <p className="text-xs text-green-800">
            每日线上回款数据，按代运营结算金额统计各店铺的实际回款
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-purple-900">每日总计</h3>
          </div>
          <p className="text-xs text-purple-800">
            固定费用 + 代运营回款的每日总和，反映当日总收入情况
          </p>
        </div>
      </div>
    </div>
  );
}
