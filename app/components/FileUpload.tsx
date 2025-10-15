"use client";

import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';

type DataType = 'fixedFee' | 'elmCycle' | 'meituan' | 'meituanOffline';

interface DailyData {
  date: string;
  totalAmount: number;
  shopCount: number;
}

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedType, setSelectedType] = useState<DataType>('fixedFee');

  // 处理饿了么固定费用数据
  const processFixedFeeData = (rawData: any[]): DailyData[] => {
    const shopDataMap = new Map<string, { amount: number, dates: Set<string> }>();
    const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

    rawData.forEach(row => {
      const shopId = row['门店ID']?.toString() || '';
      const shopName = row['店铺名称']?.toString() || '';
      const settlementAmount = parseFloat(row['结算金额']?.toString() || '0');
      const rawDate = row['结算日期']?.toString() || '';

      if (!shopId || !rawDate) return;

      const dateObj = new Date(rawDate);
      const date = dateObj.toISOString().split('T')[0];

      const key = `${shopId}_${date}`;
      if (!shopDataMap.has(key)) {
        shopDataMap.set(key, { amount: 0, dates: new Set() });
      }
      const shopData = shopDataMap.get(key)!;
      shopData.amount += settlementAmount;
      shopData.dates.add(date);

      // 检查是否为 33.95 元
      if (Math.abs(shopData.amount - 33.95) < 0.01) {
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { amount: 0, shops: new Set() });
        }
        const dailyData = dailyMap.get(date)!;
        dailyData.amount += shopData.amount;
        dailyData.shops.add(shopName || shopId);
      }
    });

    const dailyStats: DailyData[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        totalAmount: data.amount,
        shopCount: data.shops.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return dailyStats;
  };

  // 处理饿了么代运营数据
  const processElmCycleData = (rawData: any[]): DailyData[] => {
    const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

    rawData.forEach(row => {
      const shopId = row['门店id']?.toString() || '';
      const settlementAmount = parseFloat(row['代运营结算金额']?.toString() || '0');
      const rawDate = row['账单日期']?.toString() || '';

      if (!rawDate || settlementAmount === 0) return;

      const dateObj = new Date(rawDate);
      const date = dateObj.toISOString().split('T')[0];

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(date)!;
      dailyData.amount += settlementAmount;
      if (shopId) dailyData.shops.add(shopId);
    });

    const dailyStats: DailyData[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        totalAmount: data.amount,
        shopCount: data.shops.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return dailyStats;
  };

  // 处理美团代运营数据
  const processMeituanData = (rawData: any[]): DailyData[] => {
    const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

    rawData.slice(1).forEach(row => {
      const rawDate = row['代运营账单']?.toString() || '';
      const shopId = row['_1']?.toString() || '';
      const settlementAmount = parseFloat(row['_4']?.toString() || '0');

      if (!rawDate || settlementAmount === 0) return;

      // 美团数据日期减1天
      const dateObj = new Date(rawDate);
      dateObj.setDate(dateObj.getDate() - 1);
      const date = dateObj.toISOString().split('T')[0];

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(date)!;
      dailyData.amount += settlementAmount;
      if (shopId) dailyData.shops.add(shopId);
    });

    const dailyStats: DailyData[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        totalAmount: data.amount,
        shopCount: data.shops.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return dailyStats;
  };

  // 处理美团线下收款数据
  // 注意: 线下收款日期按照Excel中的原始日期展示,不减1天(与美团代运营不同)
  const processMeituanOfflineData = (rawData: any[]): DailyData[] => {
    const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

    rawData.forEach(row => {
      // 尝试多种可能的日期字段名
      const rawDateValue = row['日期'] || row['收款日期'] || row['账单日期'] || '';
      // 尝试多种可能的金额字段名
      const amount = parseFloat(row['金额']?.toString() || row['收款金额']?.toString() || row['线下收款']?.toString() || '0');
      // 尝试获取店铺信息
      const shopId = row['店铺ID']?.toString() || row['门店ID']?.toString() || row['店铺']?.toString() || '';

      if (!rawDateValue || amount === 0) return;

      let dateObj: Date;

      // 判断是否为Excel日期序列号(数字类型)
      if (typeof rawDateValue === 'number') {
        // Excel日期序列号转换: 从1900年1月1日开始计算
        // Excel的bug: 1900年被错误地认为是闰年,所以需要减2天
        const excelEpoch = new Date(1900, 0, 1);
        const daysOffset = rawDateValue - 2; // 减去2天修正Excel的bug
        dateObj = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      } else {
        // 如果是字符串日期,直接解析
        dateObj = new Date(rawDateValue.toString());
      }

      // 注意: 线下收款使用原始日期,不像美团代运营那样减1天
      const date = dateObj.toISOString().split('T')[0];

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(date)!;
      dailyData.amount += amount;
      if (shopId) dailyData.shops.add(shopId);
    });

    const dailyStats: DailyData[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        totalAmount: data.amount,
        shopCount: data.shops.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return dailyStats;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage({ type: 'error', text: '请上传Excel文件（.xlsx 或 .xls）' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // ��取文件
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      let dailyStats: DailyData[] = [];
      let storageKey = '';

      // 根据类型处理数据
      if (selectedType === 'fixedFee') {
        dailyStats = processFixedFeeData(rawData);
        storageKey = 'fixedFeeData';
      } else if (selectedType === 'elmCycle') {
        dailyStats = processElmCycleData(rawData);
        storageKey = 'elmCycleData';
      } else if (selectedType === 'meituan') {
        dailyStats = processMeituanData(rawData);
        storageKey = 'meituanData';
      } else {
        dailyStats = processMeituanOfflineData(rawData);
        storageKey = 'meituanOfflineData';
      }

      // 保存到 localStorage
      localStorage.setItem(storageKey, JSON.stringify(dailyStats));

      // 触发自定义事件通知其他组件数据已更新
      window.dispatchEvent(new Event('dataUpdated'));

      setMessage({
        type: 'success',
        text: `上传成功！处理了 ${rawData.length} 条记录，统计了 ${dailyStats.length} 天数据。页面将自动刷新。`
      });

      // 延迟刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('处理文件失败:', error);
      setMessage({ type: 'error', text: '处理文件失败: ' + (error as Error).message });
    } finally {
      setUploading(false);
      // 清空input以便再次上传同一文件
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">上传新的Excel文件</h2>
      </div>

      <div className="space-y-4">
        {/* 数据类型选择 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedType('fixedFee')}
            disabled={uploading}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              selectedType === 'fixedFee'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            饿了么固定费用
          </button>
          <button
            onClick={() => setSelectedType('elmCycle')}
            disabled={uploading}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              selectedType === 'elmCycle'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            饿了么代运营回款
          </button>
          <button
            onClick={() => setSelectedType('meituan')}
            disabled={uploading}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              selectedType === 'meituan'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            美团代运营回款
          </button>
          <button
            onClick={() => setSelectedType('meituanOffline')}
            disabled={uploading}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              selectedType === 'meituanOffline'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            美团线下收款
          </button>
        </div>

        {/* 文件上传区域 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400" />
              )}
              <p className="text-gray-600">
                {uploading ? '正在处理...' : '点击上传Excel文件'}
              </p>
              <p className="text-sm text-gray-400">
                支持 .xlsx 和 .xls 格式
              </p>
            </div>
          </label>
        </div>

        {message && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* 使用说明 */}
        <div className={`p-4 rounded-lg ${
          selectedType === 'fixedFee' ? 'bg-blue-50' :
          selectedType === 'elmCycle' ? 'bg-green-50' :
          selectedType === 'meituan' ? 'bg-orange-50' :
          'bg-purple-50'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 ${
            selectedType === 'fixedFee' ? 'text-blue-900' :
            selectedType === 'elmCycle' ? 'text-green-900' :
            selectedType === 'meituan' ? 'text-orange-900' :
            'text-purple-900'
          }`}>使用说明：</h3>
          <ul className={`text-sm space-y-1 ${
            selectedType === 'fixedFee' ? 'text-blue-800' :
            selectedType === 'elmCycle' ? 'text-green-800' :
            selectedType === 'meituan' ? 'text-orange-800' :
            'text-purple-800'
          }`}>
            {selectedType === 'fixedFee' && (
              <>
                <li>• 上传饿了么代运营固定费用账单Excel文件</li>
                <li>• 系统会自动统计净结算金额为33.95元的店铺</li>
                <li>• 上传成功后页面会自动刷新显示最新数据</li>
              </>
            )}
            {selectedType === 'elmCycle' && (
              <>
                <li>• 上传饿了么周期账单Excel文件</li>
                <li>• 系统会自动统计每日代运营结算金额</li>
                <li>• 上传成功后页面会自动刷新显示最新数据</li>
              </>
            )}
            {selectedType === 'meituan' && (
              <>
                <li>• 上传美团代运营账单明细表Excel文件</li>
                <li>• 系统会自动统计每日结算金额（日期会自动减1天）</li>
                <li>• 上传成功后页面会自动刷新显示最新数据</li>
              </>
            )}
            {selectedType === 'meituanOffline' && (
              <>
                <li>• 上传美团线下收款Excel文件</li>
                <li>• Excel需包含: 日期、金额等字段</li>
                <li>• 日期按照Excel中的原始日期展示(不减1天)</li>
                <li>• 系统会自动按日期统计线下收款金额</li>
                <li>• 上传成功后页面会自动刷新显示最新数据</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
