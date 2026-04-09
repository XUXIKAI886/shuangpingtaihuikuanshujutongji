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
      meituanTotal: null,
      grandTotal: 80,
      totalShopCount: 2,
    },
  ]);
});

test('缺少平台数据的日期不应伪装为 0', () => {
  const result = buildPlatformTrendData({
    fixedFeeData: [],
    elmCycleData: [
      { date: '2026-04-07', totalAmount: 620.91, shopCount: 103 },
      { date: '2026-04-08', totalAmount: 617.88, shopCount: 110 },
    ],
    meituanData: [
      { date: '2026-04-07', totalAmount: 1656.14, shopCount: 230 },
    ],
    meituanOfflineData: [],
    meituanRefundData: [],
  });

  assert.deepEqual(result, [
    {
      date: '2026-04-07',
      label: '04-07',
      elmTotal: 620.91,
      meituanTotal: 1656.14,
      grandTotal: 2277.05,
      totalShopCount: 333,
    },
    {
      date: '2026-04-08',
      label: '04-08',
      elmTotal: 617.88,
      meituanTotal: null,
      grandTotal: 617.88,
      totalShopCount: 110,
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
