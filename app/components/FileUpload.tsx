"use client";

import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type DataType = 'fixedFee' | 'elmCycle' | 'meituan';

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedType, setSelectedType] = useState<DataType>('fixedFee');

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', selectedType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `上传成功！处理了 ${result.stats.totalRecords} 条记录，统计了 ${result.stats.dayCount} 天数据。请手动刷新页面查看最新数据。`
        });
      } else {
        setMessage({ type: 'error', text: result.error || '上传失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '上传失败: ' + (error as Error).message });
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
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedType('fixedFee')}
            disabled={uploading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
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
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
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
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              selectedType === 'meituan'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            美团代运营回款
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
          'bg-orange-50'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 ${
            selectedType === 'fixedFee' ? 'text-blue-900' :
            selectedType === 'elmCycle' ? 'text-green-900' :
            'text-orange-900'
          }`}>使用说明：</h3>
          <ul className={`text-sm space-y-1 ${
            selectedType === 'fixedFee' ? 'text-blue-800' :
            selectedType === 'elmCycle' ? 'text-green-800' :
            'text-orange-800'
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
          </ul>
        </div>
      </div>
    </div>
  );
}
