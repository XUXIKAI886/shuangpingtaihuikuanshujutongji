"use client";

import { Calendar, TrendingUp, Store } from "lucide-react";

interface DailyData {
  date: string;
  totalAmount: number;
  shopCount: number;
}

interface DailyStatsProps {
  data: DailyData[];
}

export default function DailyStats({ data }: DailyStatsProps) {
  // 计算总金额
  const totalAmount = data.reduce((sum, day) => sum + day.totalAmount, 0);
  // 过滤掉金额为0的天数
  const activeDays = data.filter(day => day.totalAmount > 0);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">每日统计</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>统计周期: {data.length} 天</span>
          <span>活跃天数: {activeDays.length} 天</span>
          <span>总金额: ¥{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  结算金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  店铺数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均金额
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((day, index) => {
                const avgAmount = day.shopCount > 0 ? day.totalAmount / day.shopCount : 0;
                const isActive = day.totalAmount > 0;

                return (
                  <tr
                    key={day.date}
                    className={`hover:bg-gray-50 transition-colors ${
                      !isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {day.date}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                        <span className={`text-sm font-semibold ${
                          isActive ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          ¥{day.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Store className="w-4 h-4 text-purple-600 mr-2" />
                        <span className="text-sm text-gray-700">
                          {day.shopCount} 个
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        ¥{avgAmount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">总计</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-green-600">
                    ¥{totalAmount.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    {data.reduce((sum, day) => sum + day.shopCount, 0)} 店次
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    ¥{(totalAmount / activeDays.length || 0).toFixed(2)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
