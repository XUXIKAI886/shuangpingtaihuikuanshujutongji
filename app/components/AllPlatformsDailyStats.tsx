"use client";

import { Calendar, DollarSign, Store, TrendingUp } from "lucide-react";

interface DailyData {
  date: string;
  totalAmount: number;
  shopCount: number;
}

interface AllPlatformsDailyStatsProps {
  fixedFeeData: DailyData[];     // 饿了么固定费用
  elmCycleData: DailyData[];     // 饿了么代运营回款
  meituanData: DailyData[];      // 美团代运营回款
  meituanOfflineData: DailyData[]; // 美团线下收款
}

export default function AllPlatformsDailyStats({
  fixedFeeData,
  elmCycleData,
  meituanData,
  meituanOfflineData
}: AllPlatformsDailyStatsProps) {
  // 合并所有数据源的日期
  const allDates = new Set([
    ...fixedFeeData.map(d => d.date),
    ...elmCycleData.map(d => d.date),
    ...meituanData.map(d => d.date),
    ...meituanOfflineData.map(d => d.date)
  ]);

  // 转换为数组并排序
  const sortedDates = Array.from(allDates).sort();

  // 创建数据映射
  const fixedFeeMap = new Map(fixedFeeData.map(d => [d.date, d]));
  const elmCycleMap = new Map(elmCycleData.map(d => [d.date, d]));
  const meituanMap = new Map(meituanData.map(d => [d.date, d]));
  const meituanOfflineMap = new Map(meituanOfflineData.map(d => [d.date, d]));

  // 合并数据
  const combinedData = sortedDates.map(date => {
    const fixedFee = fixedFeeMap.get(date) || { totalAmount: 0, shopCount: 0 };
    const elmCycle = elmCycleMap.get(date) || { totalAmount: 0, shopCount: 0 };
    const meituan = meituanMap.get(date) || { totalAmount: 0, shopCount: 0 };
    const meituanOffline = meituanOfflineMap.get(date) || { totalAmount: 0, shopCount: 0 };

    return {
      date,
      fixedFeeAmount: fixedFee.totalAmount,
      fixedFeeShopCount: fixedFee.shopCount,
      elmCycleAmount: elmCycle.totalAmount,
      elmCycleShopCount: elmCycle.shopCount,
      meituanAmount: meituan.totalAmount,
      meituanShopCount: meituan.shopCount,
      meituanOfflineAmount: meituanOffline.totalAmount,
      totalAmount: fixedFee.totalAmount + elmCycle.totalAmount + meituan.totalAmount + meituanOffline.totalAmount,
      totalShopCount: elmCycle.shopCount + meituan.shopCount, // 总回款店铺数
    };
  });

  // 计算总计
  const totals = combinedData.reduce((acc, day) => ({
    fixedFeeAmount: acc.fixedFeeAmount + day.fixedFeeAmount,
    elmCycleAmount: acc.elmCycleAmount + day.elmCycleAmount,
    meituanAmount: acc.meituanAmount + day.meituanAmount,
    meituanOfflineAmount: acc.meituanOfflineAmount + day.meituanOfflineAmount,
    totalAmount: acc.totalAmount + day.totalAmount,
    fixedFeeShopCount: acc.fixedFeeShopCount + day.fixedFeeShopCount,
    elmCycleShopCount: acc.elmCycleShopCount + day.elmCycleShopCount,
    meituanShopCount: acc.meituanShopCount + day.meituanShopCount,
    totalShopCount: acc.totalShopCount + day.totalShopCount,
  }), {
    fixedFeeAmount: 0,
    elmCycleAmount: 0,
    meituanAmount: 0,
    meituanOfflineAmount: 0,
    totalAmount: 0,
    fixedFeeShopCount: 0,
    elmCycleShopCount: 0,
    meituanShopCount: 0,
    totalShopCount: 0,
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">每日回款统计</h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>统计周期: {sortedDates.length} 天</span>
          <span>饿了么固定费用: ¥{totals.fixedFeeAmount.toFixed(2)}</span>
          <span>饿了么代运营: ¥{totals.elmCycleAmount.toFixed(2)}</span>
          <span>美团代运营: ¥{totals.meituanAmount.toFixed(2)}</span>
          <span className="font-semibold text-purple-600">合计总金额: ¥{totals.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider" colSpan={2}>
                  饿了么固定费用
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider" colSpan={2}>
                  饿了么代运营
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-orange-600 uppercase tracking-wider" colSpan={2}>
                  美团代运营
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-pink-600 uppercase tracking-wider">
                  美团线下收款
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider" colSpan={2}>
                  每日总计
                </th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2"></th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">金额</th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">店铺</th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">金额</th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">店铺</th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">金额</th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">店铺</th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">金额</th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">总金额</th>
                <th className="px-2 py-2 text-xs font-medium text-gray-600">总店铺</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {combinedData.map((day) => {
                const hasFixedFee = day.fixedFeeAmount > 0;
                const hasElmCycle = day.elmCycleAmount > 0;
                const hasMeituan = day.meituanAmount > 0;
                const hasMeituanOffline = day.meituanOfflineAmount > 0;

                return (
                  <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {day.date}
                        </span>
                      </div>
                    </td>

                    {/* 饿了么固定费用 */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={`text-sm font-semibold ${
                        hasFixedFee ? 'text-blue-600' : 'text-gray-300'
                      }`}>
                        ¥{day.fixedFeeAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={`text-xs ${
                        hasFixedFee ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        {day.fixedFeeShopCount}
                      </span>
                    </td>

                    {/* 饿了么代运营 */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={`text-sm font-semibold ${
                        hasElmCycle ? 'text-green-600' : 'text-gray-300'
                      }`}>
                        ¥{day.elmCycleAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={`text-xs ${
                        hasElmCycle ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        {day.elmCycleShopCount}
                      </span>
                    </td>

                    {/* 美团代运营 */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={`text-sm font-semibold ${
                        hasMeituan ? 'text-orange-600' : 'text-gray-300'
                      }`}>
                        ¥{day.meituanAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={`text-xs ${
                        hasMeituan ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        {day.meituanShopCount}
                      </span>
                    </td>

                    {/* 美团线下收款 */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={`text-sm font-semibold ${
                        hasMeituanOffline ? 'text-pink-600' : 'text-gray-300'
                      }`}>
                        ¥{day.meituanOfflineAmount.toFixed(2)}
                      </span>
                    </td>

                    {/* 每日总计 */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-purple-600">
                        ¥{day.totalAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className="text-xs font-semibold text-purple-600">
                        {day.totalShopCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">总计</span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-blue-600">
                    ¥{totals.fixedFeeAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <span className="text-xs font-bold text-gray-900">
                    {totals.fixedFeeShopCount}次
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-green-600">
                    ¥{totals.elmCycleAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <span className="text-xs font-bold text-gray-900">
                    {totals.elmCycleShopCount}次
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-orange-600">
                    ¥{totals.meituanAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <span className="text-xs font-bold text-gray-900">
                    {totals.meituanShopCount}次
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-pink-600">
                    ¥{totals.meituanOfflineAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <span className="text-base font-bold text-purple-600">
                    ¥{totals.totalAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600 mr-1" />
                    <span className="text-sm font-bold text-purple-600">
                      {totals.totalShopCount}次
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 数据说明 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">饿了么固定费用</h3>
          </div>
          <p className="text-xs text-blue-800">
            固定费用账单，每店铺净结算33.95元
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-green-900">饿了么代运营</h3>
          </div>
          <p className="text-xs text-green-800">
            饿了么每日线上回款数据统计
          </p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-900">美团代运营</h3>
          </div>
          <p className="text-xs text-orange-800">
            美团每日线上回款数据统计
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-purple-900">每日总计</h3>
          </div>
          <p className="text-xs text-purple-800">
            三平台每日总收入汇总
          </p>
        </div>
      </div>
    </div>
  );
}
