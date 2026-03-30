import type { DailyData } from '@/app/lib/dashboard/types';

export interface PlatformTrendInput {
  fixedFeeData: DailyData[];
  elmCycleData: DailyData[];
  meituanData: DailyData[];
  meituanOfflineData: DailyData[];
  meituanRefundData: DailyData[];
}

export interface PlatformTrendRow {
  date: string;
  label: string;
  elmTotal: number;
  meituanTotal: number;
  grandTotal: number;
  totalShopCount: number;
}

const createAmountMap = (items: DailyData[]) =>
  new Map(items.map(item => [item.date, item.totalAmount]));

const createShopCountMap = (items: DailyData[]) =>
  new Map(items.map(item => [item.date, item.shopCount]));

export const buildPlatformTrendData = ({
  fixedFeeData,
  elmCycleData,
  meituanData,
  meituanOfflineData,
  meituanRefundData,
}: PlatformTrendInput): PlatformTrendRow[] => {
  const allDates = new Set([
    ...fixedFeeData.map(item => item.date),
    ...elmCycleData.map(item => item.date),
    ...meituanData.map(item => item.date),
    ...meituanOfflineData.map(item => item.date),
    ...meituanRefundData.map(item => item.date),
  ]);

  if (allDates.size === 0) {
    return [];
  }

  const fixedFeeMap = createAmountMap(fixedFeeData);
  const elmCycleAmountMap = createAmountMap(elmCycleData);
  const elmCycleShopCountMap = createShopCountMap(elmCycleData);
  const meituanAmountMap = createAmountMap(meituanData);
  const meituanShopCountMap = createShopCountMap(meituanData);
  const meituanOfflineMap = createAmountMap(meituanOfflineData);
  const meituanRefundMap = createAmountMap(meituanRefundData);

  return Array.from(allDates)
    .sort((left, right) => left.localeCompare(right))
    .map(date => {
      const elmTotal = (fixedFeeMap.get(date) ?? 0) + (elmCycleAmountMap.get(date) ?? 0);
      const meituanTotal =
        (meituanAmountMap.get(date) ?? 0) +
        (meituanOfflineMap.get(date) ?? 0) -
        (meituanRefundMap.get(date) ?? 0);

      return {
        date,
        label: date.slice(5),
        elmTotal,
        meituanTotal,
        grandTotal: elmTotal + meituanTotal,
        totalShopCount: (elmCycleShopCountMap.get(date) ?? 0) + (meituanShopCountMap.get(date) ?? 0),
      };
    });
};
