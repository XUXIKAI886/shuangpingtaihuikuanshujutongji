"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function ClearDataButton() {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearData = () => {
    setIsClearing(true);
    try {
      // 清空 localStorage 中的所有数据
      localStorage.removeItem('fixedFeeData');
      localStorage.removeItem('elmCycleData');
      localStorage.removeItem('meituanData');

      // 触发自定义事件通知其他组件数据已更新
      window.dispatchEvent(new Event('dataUpdated'));

      alert('数据已成功清空！页面将自动刷新。');
      window.location.reload();
    } catch (error) {
      console.error('清空数据失败:', error);
      alert('清空数据失败，请重试');
    } finally {
      setIsClearing(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isClearing}
      >
        <Trash2 className="w-5 h-5" />
        <span className="font-medium">清空数据</span>
      </button>

      {/* 确认对话框 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">确认清空数据</h3>
            </div>

            <p className="text-gray-600 mb-6">
              此操作将清空所有平台的数据（饿了么固定费用、饿了么代运营、美团代运营），且无法恢复。确定要继续吗？
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                disabled={isClearing}
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={isClearing}
              >
                {isClearing ? '清空中...' : '确认清空'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
