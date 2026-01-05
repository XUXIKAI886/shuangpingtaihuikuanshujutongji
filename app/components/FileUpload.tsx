"use client";

import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { UploadType } from "@/app/lib/upload/processors";

const TYPE_CONFIG: Record<UploadType, {
  label: string;
  buttonActiveClass: string;
  guideBg: string;
  guideTitle: string;
  guideText: string;
}> = {
  fixedFee: {
    label: '饿了么固定费用',
    buttonActiveClass: 'bg-blue-500 text-white shadow-md',
    guideBg: 'bg-blue-50',
    guideTitle: 'text-blue-900',
    guideText: 'text-blue-800'
  },
  elmCycle: {
    label: '饿了么代运营回款',
    buttonActiveClass: 'bg-green-500 text-white shadow-md',
    guideBg: 'bg-green-50',
    guideTitle: 'text-green-900',
    guideText: 'text-green-800'
  },
  meituan: {
    label: '美团代运营回款',
    buttonActiveClass: 'bg-orange-500 text-white shadow-md',
    guideBg: 'bg-orange-50',
    guideTitle: 'text-orange-900',
    guideText: 'text-orange-800'
  },
  meituanOffline: {
    label: '美团线下收款',
    buttonActiveClass: 'bg-purple-500 text-white shadow-md',
    guideBg: 'bg-purple-50',
    guideTitle: 'text-purple-900',
    guideText: 'text-purple-800'
  },
  meituanRefund: {
    label: '美团退款',
    buttonActiveClass: 'bg-red-500 text-white shadow-md',
    guideBg: 'bg-red-50',
    guideTitle: 'text-red-900',
    guideText: 'text-red-800'
  }
};

const GUIDE_CONTENT: Record<UploadType, string[]> = {
  fixedFee: [
    '• 上传饿了么代运营固定费用账单Excel文件',
    '• 系统会自动统计净结算金额为 33.95 / 36.86 / 38.80 / 48.50 / 85.36 / 193.03 元的店铺',
    '• 数据会实时更新到统计表格和图表中'
  ],
  elmCycle: [
    '• 上传饿了么周期账单Excel文件',
    '• 系统会自动统计每日代运营结算金额和店铺数',
    '• 数据会实时更新到统计表格和图表中'
  ],
  meituan: [
    '• 上传美团代运营账单明细表Excel文件',
    '• 系统会自动统计每日结算金额（日期会自动减1天）',
    '• 数据会实时更新到统计表格和图表中'
  ],
  meituanOffline: [
    '• 上传包含日期与金额字段的美团线下收款Excel文件',
    '• 日期按照Excel原始日期展示（不会减1天）',
    '• 系统会自动按日期统计线下收款金额'
  ],
  meituanRefund: [
    '• 上传包含日期与退款字段的Excel文件',
    '• 系统会读取第三列"退款"字段的金额',
    '• 退款数据会显示在美团线下收款和每日总计之间'
  ]
};

const uploadTypes: UploadType[] = ['fixedFee', 'elmCycle', 'meituan', 'meituanOffline', 'meituanRefund'];
const inactiveButtonClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200';

export default function FileUpload() {
  const { uploading, message, selectedType, setSelectedType, handleFileUpload } = useFileUpload();
  const guideMeta = TYPE_CONFIG[selectedType];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">上传新的Excel文件</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {uploadTypes.map(type => {
            const isActive = selectedType === type;
            const buttonClass = isActive
              ? TYPE_CONFIG[type].buttonActiveClass
              : inactiveButtonClass;

            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                disabled={uploading}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${buttonClass} ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {TYPE_CONFIG[type].label}
              </button>
            );
          })}
        </div>

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

        <div className={`p-4 rounded-lg ${guideMeta.guideBg}`}>
          <h3 className={`text-sm font-semibold mb-2 ${guideMeta.guideTitle}`}>使用说明：</h3>
          <ul className={`text-sm space-y-1 ${guideMeta.guideText}`}>
            {GUIDE_CONTENT[selectedType].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
