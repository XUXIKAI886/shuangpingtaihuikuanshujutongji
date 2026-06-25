import type { DailyData } from '../app/lib/upload/processors';

export type DailyDataMergeMode = 'append-new-by-date' | 'replace-existing-by-date';

export type DailyDataMergeResult = {
  mergedData: DailyData[];
  appendedDayCount: number;
  duplicateDayCount: number;
  replacedDayCount: number;
};

export function mergeDailyDataByDate(
  existing: DailyData[],
  incoming: DailyData[],
  mode: DailyDataMergeMode
): DailyDataMergeResult {
  const dateMap = new Map<string, DailyData>();
  let appendedDayCount = 0;
  let duplicateDayCount = 0;
  let replacedDayCount = 0;

  for (const item of existing) {
    dateMap.set(item.date, {
      date: item.date,
      totalAmount: item.totalAmount,
      shopCount: item.shopCount,
    });
  }

  for (const item of incoming) {
    const nextItem = {
      date: item.date,
      totalAmount: item.totalAmount,
      shopCount: item.shopCount,
    };
    const found = dateMap.get(item.date);

    if (!found) {
      dateMap.set(item.date, nextItem);
      appendedDayCount += 1;
      continue;
    }

    duplicateDayCount += 1;
    if (mode !== 'replace-existing-by-date') {
      continue;
    }

    if (
      found.totalAmount !== item.totalAmount ||
      found.shopCount !== item.shopCount
    ) {
      replacedDayCount += 1;
    }
    dateMap.set(item.date, nextItem);
  }

  return {
    mergedData: Array.from(dateMap.values()).sort((left, right) =>
      left.date.localeCompare(right.date)
    ),
    appendedDayCount,
    duplicateDayCount,
    replacedDayCount,
  };
}
