'use client';

import { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { processDataByType, UploadType } from '../lib/upload/processors';

type UploadMessage = { type: 'success' | 'error'; text: string } | null;

export const useFileUpload = (defaultType: UploadType = 'fixedFee') => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<UploadMessage>(null);
  const [selectedType, setSelectedType] = useState<UploadType>(defaultType);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage({ type: 'error', text: '请上传Excel文件（.xlsx 或 .xls）' });
      event.target.value = '';
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      const { dailyStats, storageKey } = processDataByType(selectedType, rawData);

      localStorage.setItem(storageKey, JSON.stringify(dailyStats));
      window.dispatchEvent(new Event('dataUpdated'));

      setMessage({
        type: 'success',
        text: `上传成功！处理了 ${rawData.length} 条记录，统计了 ${dailyStats.length} 天数据。`
      });
    } catch (error) {
      console.error('处理文件失败:', error);
      setMessage({ type: 'error', text: '处理文件失败: ' + (error as Error).message });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return { uploading, message, selectedType, setSelectedType, handleFileUpload };
};
