export type UploadType = 'fixedFee' | 'elmCycle' | 'meituan' | 'meituanOffline' | 'meituanRefund';

export interface DailyData {
  date: string;
  totalAmount: number;
  shopCount: number;
}

// 饿了么固定费用允许的净结算金额
// 计算公式: 固定费用 - 抽佣(3%) = 净结算金额
// 35.00 - 1.05 = 33.95 | 38.00 - 1.14 = 36.86 | 40.00 - 1.20 = 38.80
// 50.00 - 1.50 = 48.50 | 88.00 - 2.64 = 85.36 | 199.00 - 5.97 = 193.03
const FIXED_FEE_AMOUNTS = [33.95, 36.86, 38.80, 48.5, 85.36, 193.03];

const EXCEL_BASE_DATE = new Date(1900, 0, 1);

const mapToDailyStats = (dailyMap: Map<string, { amount: number; shops: Set<string> }>): DailyData[] =>
  Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalAmount: data.amount,
      shopCount: data.shops.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

// 兼容 Excel 日期序列号与标准日期字符串
const parseExcelDate = (value: number | string): Date => {
  if (typeof value === 'number') {
    // Excel 将 1900 错误视为闰年，因此需要减去 1 天
    const daysOffset = value - 1;
    return new Date(EXCEL_BASE_DATE.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  }
  return new Date(value);
};

export const processFixedFeeData = (rawData: any[]): DailyData[] => {
  const shopDataMap = new Map<string, { amount: number; dates: Set<string> }>();
  const dailyMap = new Map<string, { amount: number; shops: Set<string> }>();

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

    const isTargetAmount = FIXED_FEE_AMOUNTS.some(amount =>
      Math.abs(shopData.amount - amount) < 0.01
    );

    if (isTargetAmount) {
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(date)!;
      dailyData.amount += shopData.amount;
      dailyData.shops.add(shopName || shopId);
    }
  });

  return mapToDailyStats(dailyMap);
};

export const processElmCycleData = (rawData: any[]): DailyData[] => {
  const dailyMap = new Map<string, { amount: number; shops: Set<string> }>();

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

  return mapToDailyStats(dailyMap);
};

export const processMeituanData = (rawData: any[]): DailyData[] => {
  const dailyMap = new Map<string, { amount: number; shops: Set<string> }>();

  rawData.slice(1).forEach(row => {
    const rawDate = row['代运营账单']?.toString() || '';
    const shopId = row['_1']?.toString() || '';
    const settlementAmount = parseFloat(row['_4']?.toString() || '0');

    if (!rawDate || settlementAmount === 0) return;

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

  return mapToDailyStats(dailyMap);
};

// 处理美团线下收款时保持原始日期（不减 1 天）
export const processMeituanOfflineData = (rawData: any[]): DailyData[] => {
  const dailyMap = new Map<string, { amount: number; shops: Set<string> }>();

  rawData.forEach(row => {
    const rawDateValue = row['日期'] || row['收款日期'] || row['账单日期'] || '';
    const amount = parseFloat(
      row['金额']?.toString() ||
      row['收款金额']?.toString() ||
      row['线下收款']?.toString() ||
      '0'
    );
    const shopId = row['店铺ID']?.toString() ||
      row['门店ID']?.toString() ||
      row['店铺']?.toString() ||
      '';

    if (!rawDateValue || amount === 0) return;

    const dateObj = parseExcelDate(rawDateValue);
    const date = dateObj.toISOString().split('T')[0];

    if (!dailyMap.has(date)) {
      dailyMap.set(date, { amount: 0, shops: new Set() });
    }
    const dailyData = dailyMap.get(date)!;
    dailyData.amount += amount;
    if (shopId) dailyData.shops.add(shopId);
  });

  return mapToDailyStats(dailyMap);
};

// 处理美团退款数据（从第三列"退款"字段读取）
export const processMeituanRefundData = (rawData: any[]): DailyData[] => {
  const dailyMap = new Map<string, { amount: number; shops: Set<string> }>();

  rawData.forEach(row => {
    const rawDateValue = row['日期'] || row['收款日期'] || row['账单日期'] || '';
    const refundAmount = parseFloat(
      row['退款']?.toString() ||
      row['退款金额']?.toString() ||
      '0'
    );
    const shopId = row['店铺ID']?.toString() ||
      row['门店ID']?.toString() ||
      row['店铺']?.toString() ||
      '';

    if (!rawDateValue || refundAmount === 0) return;

    const dateObj = parseExcelDate(rawDateValue);
    const date = dateObj.toISOString().split('T')[0];

    if (!dailyMap.has(date)) {
      dailyMap.set(date, { amount: 0, shops: new Set() });
    }
    const dailyData = dailyMap.get(date)!;
    dailyData.amount += refundAmount;
    if (shopId) dailyData.shops.add(shopId);
  });

  return mapToDailyStats(dailyMap);
};

export const processDataByType = (
  type: UploadType,
  rawData: any[]
): { dailyStats: DailyData[]; storageKey: string } => {
  switch (type) {
    case 'fixedFee':
      return { dailyStats: processFixedFeeData(rawData), storageKey: 'fixedFeeData' };
    case 'elmCycle':
      return { dailyStats: processElmCycleData(rawData), storageKey: 'elmCycleData' };
    case 'meituan':
      return { dailyStats: processMeituanData(rawData), storageKey: 'meituanData' };
    case 'meituanOffline':
      return { dailyStats: processMeituanOfflineData(rawData), storageKey: 'meituanOfflineData' };
    case 'meituanRefund':
      return { dailyStats: processMeituanRefundData(rawData), storageKey: 'meituanRefundData' };
    default:
      return { dailyStats: processMeituanOfflineData(rawData), storageKey: 'meituanOfflineData' };
  }
};
