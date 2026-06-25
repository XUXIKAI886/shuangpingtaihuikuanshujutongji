import assert from 'node:assert/strict';
import { mergeDailyDataByDate } from './syncExcelMerge';

const existing = [
  { date: '2026-06-18', totalAmount: 1296.07, shopCount: 253 },
  { date: '2026-06-19', totalAmount: 1317.27, shopCount: 227 },
];

const incoming = [
  { date: '2026-06-18', totalAmount: 1350.96, shopCount: 253 },
  { date: '2026-06-20', totalAmount: 1533.38, shopCount: 241 },
];

{
  const result = mergeDailyDataByDate(existing, incoming, 'replace-existing-by-date');

  assert.deepEqual(result.mergedData, [
    { date: '2026-06-18', totalAmount: 1350.96, shopCount: 253 },
    { date: '2026-06-19', totalAmount: 1317.27, shopCount: 227 },
    { date: '2026-06-20', totalAmount: 1533.38, shopCount: 241 },
  ]);
  assert.equal(result.appendedDayCount, 1);
  assert.equal(result.duplicateDayCount, 1);
  assert.equal(result.replacedDayCount, 1);
}

{
  const result = mergeDailyDataByDate(existing, incoming, 'append-new-by-date');

  assert.deepEqual(result.mergedData, [
    { date: '2026-06-18', totalAmount: 1296.07, shopCount: 253 },
    { date: '2026-06-19', totalAmount: 1317.27, shopCount: 227 },
    { date: '2026-06-20', totalAmount: 1533.38, shopCount: 241 },
  ]);
  assert.equal(result.appendedDayCount, 1);
  assert.equal(result.duplicateDayCount, 1);
  assert.equal(result.replacedDayCount, 0);
}

console.log('syncExcelMerge tests passed');
