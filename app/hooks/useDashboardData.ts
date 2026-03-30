"use client";

import { useEffect, useMemo, useState } from 'react';

import { DashboardDataSet, DailyData, EMPTY_DASHBOARD_DATA } from '@/app/lib/dashboard/types';

const DATA_TARGETS: Array<{
  key: keyof DashboardDataSet;
  fileName: string;
  storageKey: string;
}> = [
  { key: 'fixedFeeData', fileName: 'fixedFeeData.json', storageKey: 'fixedFeeData' },
  { key: 'elmCycleData', fileName: 'elmCycleData.json', storageKey: 'elmCycleData' },
  { key: 'meituanData', fileName: 'meituanData.json', storageKey: 'meituanData' },
  { key: 'meituanOfflineData', fileName: 'meituanOfflineData.json', storageKey: 'meituanOfflineData' },
  { key: 'meituanRefundData', fileName: 'meituanRefundData.json', storageKey: 'meituanRefundData' },
];

const APP_BASE_PATH = process.env.NODE_ENV === 'production' ? '/shuangpingtaihuikuanshujutongji' : '';

const isDailyDataArray = (value: unknown): value is DailyData[] => {
  if (!Array.isArray(value)) return false;

  return value.every(item => (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as DailyData).date === 'string' &&
    typeof (item as DailyData).totalAmount === 'number' &&
    typeof (item as DailyData).shopCount === 'number'
  ));
};

const loadFromLocalStorage = (): DashboardDataSet => {
  const nextData: DashboardDataSet = { ...EMPTY_DASHBOARD_DATA };

  for (const target of DATA_TARGETS) {
    try {
      const storedValue = localStorage.getItem(target.storageKey);
      const parsedValue = storedValue ? JSON.parse(storedValue) : null;

      if (isDailyDataArray(parsedValue)) {
        nextData[target.key] = parsedValue;
      }
    } catch (error) {
      console.error(`读取 ${target.storageKey} 失败:`, error);
    }
  }

  return nextData;
};

const createJsonUrl = (fileName: string) =>
  `${APP_BASE_PATH}/data/${fileName}?t=${Date.now()}`;

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardDataSet>(EMPTY_DASHBOARD_DATA);

  useEffect(() => {
    const loadData = async () => {
      try {
        const nextData: DashboardDataSet = { ...EMPTY_DASHBOARD_DATA };
        let loadedFromJson = 0;

        await Promise.all(
          DATA_TARGETS.map(async target => {
            const response = await fetch(createJsonUrl(target.fileName), { cache: 'no-store' });
            if (!response.ok) return;

            const payload: unknown = await response.json();
            if (!isDailyDataArray(payload)) return;

            nextData[target.key] = payload;
            loadedFromJson += 1;
          })
        );

        setData(loadedFromJson > 0 ? nextData : loadFromLocalStorage());
      } catch (error) {
        console.error('加载 JSON 数据失败，回退到 localStorage:', error);
        setData(loadFromLocalStorage());
      }
    };

    void loadData();

    const handleStorageChange = () => {
      void loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dataUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataUpdated', handleStorageChange);
    };
  }, []);

  const hasData = useMemo(
    () => Object.values(data).some(items => items.length > 0),
    [data]
  );

  return {
    ...data,
    hasData,
  };
};
