import AllPlatformsDailyStats from "./components/AllPlatformsDailyStats";
import FileUpload from "./components/FileUpload";
import ClearDataButton from "./components/ClearDataButton";
import DailyCharts from "./components/DailyCharts";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import fixedFeeData from "../public/data/daily-stats.json";
import elmCycleData from "../public/data/cycle-daily-stats.json";
import meituanData from "../public/data/meituan-daily-stats.json";

export default function Home() {
  // 计算总金额 - 包含饿了么固定费用、饿了么代运营和美团代运营
  const fixedFeeTotal = fixedFeeData.reduce((sum, day) => sum + day.totalAmount, 0);
  const elmCycleTotal = elmCycleData.reduce((sum, day) => sum + day.totalAmount, 0);
  const meituanTotal = meituanData.reduce((sum, day) => sum + day.totalAmount, 0);
  const grandTotal = fixedFeeTotal + elmCycleTotal + meituanTotal;

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
            <ClearDataButton />
          </div>
        </div>

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
        <div className="mb-8">
          <DailyCharts
            fixedFeeData={fixedFeeData}
            elmCycleData={elmCycleData}
            meituanData={meituanData}
          />
        </div>

        {/* 每日统计表格 */}
        <div className="mb-8">
          <AllPlatformsDailyStats
            fixedFeeData={fixedFeeData}
            elmCycleData={elmCycleData}
            meituanData={meituanData}
          />
        </div>

        {/* 页脚 */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>数据来源: 饿了么固定费用 + 饿了么代运营 + 美团代运营</p>
          <p>统计平台: 饿了么 & 美团双平台回款数据</p>
        </div>
      </div>
    </main>
  );
}
