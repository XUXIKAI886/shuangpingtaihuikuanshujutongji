import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPlatformTrendData } from './buildPlatformTrendData';

test('汇总两个平台的每日趋势数据并扣除退款', () => {
  const result = buildPlatformTrendData({
    fixedFeeData: [
      { date: '2026-03-01', totalAmount: 100, shopCount: 2 },
      { date: '2026-03-02', totalAmount: 120, shopCount: 3 },
    ],
    elmCycleData: [
      { date: '2026-03-01', totalAmount: 50, shopCount: 1 },
      { date: '2026-03-03', totalAmount: 80, shopCount: 2 },
    ],
    meituanData: [
      { date: '2026-03-01', totalAmount: 200, shopCount: 4 },
      { date: '2026-03-02', totalAmount: 220, shopCount: 5 },
    ],
    meituanOfflineData: [
      { date: '2026-03-02', totalAmount: 40, shopCount: 0 },
    ],
    meituanRefundData: [
      { date: '2026-03-02', totalAmount: 10, shopCount: 0 },
    ],
  });

  assert.deepEqual(result, [
    {
      date: '2026-03-01',
      label: '03-01',
      elmTotal: 150,
      meituanTotal: 200,
      grandTotal: 350,
      totalShopCount: 5,
    },
    {
      date: '2026-03-02',
      label: '03-02',
      elmTotal: 120,
      meituanTotal: 250,
      grandTotal: 370,
      totalShopCount: 5,
    },
    {
      date: '2026-03-03',
      label: '03-03',
      elmTotal: 80,
      meituanTotal: 0,
      grandTotal: 80,
      totalShopCount: 2,
    },
  ]);
});

test('没有任何数据时返回空数组', () => {
  const result = buildPlatformTrendData({
    fixedFeeData: [],
    elmCycleData: [],
    meituanData: [],
    meituanOfflineData: [],
    meituanRefundData: [],
  });

  assert.deepEqual(result, []);
});
