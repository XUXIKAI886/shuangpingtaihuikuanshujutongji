import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// 定义数据结构
interface RawData {
  [key: string]: any;
}

interface ShopData {
  shopId: string;
  shopName: string;
  contractStartDate: string;
  totalAmount: number;
}

interface DailyData {
  date: string;
  totalAmount: number;
  shopCount: number;
}

// 处理饿了么固定费用数据
function processFixedFeeData(rawData: RawData[]): { shopStats: ShopData[], dailyStats: DailyData[] } {
  const STANDARD_AMOUNT = 33.95;

  // 临时存储：按店铺+日期分组计算净结算金额
  const shopDailyMap = new Map<string, { shopId: string, shopName: string, contractStartDate: string, date: string, netAmount: number }>();

  rawData.forEach(row => {
    const shopId = row['门店ID']?.toString() || '';
    const shopName = row['店铺名称']?.toString() || '';
    const contractStartDate = row['合同开始时间']?.toString() || '';
    const settlementAmount = parseFloat(row['结算金额']?.toString() || '0');
    const date = row['结算日期']?.toString() || '';

    if (shopId && date) {
      const key = `${shopId}_${date}`;

      if (!shopDailyMap.has(key)) {
        shopDailyMap.set(key, {
          shopId,
          shopName,
          contractStartDate,
          date,
          netAmount: 0
        });
      }

      const record = shopDailyMap.get(key)!;
      record.netAmount += settlementAmount;
    }
  });

  const shopMap = new Map<string, ShopData>();
  const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

  // 处理净结算金额，只统计等于33.95的记录
  shopDailyMap.forEach(record => {
    if (Math.abs(record.netAmount - STANDARD_AMOUNT) < 0.01) {
      if (!shopMap.has(record.shopId)) {
        shopMap.set(record.shopId, {
          shopId: record.shopId,
          shopName: record.shopName,
          contractStartDate: record.contractStartDate,
          totalAmount: 0
        });
      }
      const shopData = shopMap.get(record.shopId)!;
      shopData.totalAmount += record.netAmount;

      if (!dailyMap.has(record.date)) {
        dailyMap.set(record.date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(record.date)!;
      dailyData.amount += record.netAmount;
      dailyData.shops.add(record.shopId);
    }
  });

  const shopStats = Array.from(shopMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalAmount: data.amount,
      shopCount: data.shops.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { shopStats, dailyStats };
}

// 处理饿了么代运营回款数据
function processElmCycleData(rawData: RawData[]): DailyData[] {
  const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

  console.log('开始处理饿了么代运营数据, 总记录数:', rawData.length);

  // 打印前3条记录的字段名
  if (rawData.length > 0) {
    console.log('第一条记录的字段:', Object.keys(rawData[0]));
    console.log('第一条记录示例:', rawData[0]);
  }

  let processedCount = 0;
  rawData.forEach((row, index) => {
    const shopId = row['门店id']?.toString() || '';
    const settlementAmountStr = row['代运营结算金额']?.toString() || '0';
    const settlementAmount = parseFloat(settlementAmountStr);
    const date = row['账单日期']?.toString() || '';

    if (index < 3) {
      console.log(`记录 ${index}: 门店id=${shopId}, 代运营结算金额=${settlementAmountStr}, 账单日期=${date}`);
    }

    if (date && shopId) {
      processedCount++;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(date)!;
      dailyData.amount += settlementAmount;
      dailyData.shops.add(shopId);
    }
  });

  console.log(`处理了 ${processedCount} 条有效记录`);

  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalAmount: data.amount,
      shopCount: data.shops.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  console.log(`生成了 ${dailyStats.length} 天的统计数据`);

  return dailyStats;
}

// 处理美团代运营回款数据
function processMeituanData(rawData: RawData[]): DailyData[] {
  const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

  // 跳过第一行（表头）
  rawData.slice(1).forEach(row => {
    const rawDate = row['代运营账单']?.toString() || '';
    const shopId = row['_1']?.toString() || '';
    const settlementAmount = parseFloat(row['_4']?.toString() || '0');

    // 过滤无效日期（如"日期"字符串）
    if (rawDate && rawDate !== '日期' && shopId && !isNaN(settlementAmount)) {
      // 美团数据日期减1天
      const dateObj = new Date(rawDate);
      dateObj.setDate(dateObj.getDate() - 1);
      const date = dateObj.toISOString().split('T')[0];

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(date)!;
      dailyData.amount += settlementAmount;
      dailyData.shops.add(shopId);
    }
  });

  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalAmount: data.amount,
      shopCount: data.shops.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return dailyStats;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('dataType') as string;

    if (!file) {
      return NextResponse.json({ error: '未找到上传文件' }, { status: 400 });
    }

    if (!dataType || !['fixedFee', 'elmCycle', 'meituan'].includes(dataType)) {
      return NextResponse.json({ error: '无效的数据类型' }, { status: 400 });
    }

    // 读取文件
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 解析Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet) as RawData[];

    // 保存处理后的数据
    const outputDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let dailyStats: DailyData[];
    let outputFile: string;
    let shopCount = 0;

    // 根据数据类型处理数据
    if (dataType === 'fixedFee') {
      const { shopStats, dailyStats: stats } = processFixedFeeData(rawData);
      dailyStats = stats;
      shopCount = shopStats.length;
      outputFile = 'daily-stats.json';

      // 保存店铺统计数据
      fs.writeFileSync(
        path.join(outputDir, 'shop-stats.json'),
        JSON.stringify(shopStats, null, 2)
      );
    } else if (dataType === 'elmCycle') {
      dailyStats = processElmCycleData(rawData);
      outputFile = 'cycle-daily-stats.json';
    } else {
      dailyStats = processMeituanData(rawData);
      outputFile = 'meituan-daily-stats.json';
    }

    // 保存每日统计数据
    fs.writeFileSync(
      path.join(outputDir, outputFile),
      JSON.stringify(dailyStats, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: '文件上传并处理成功',
      stats: {
        totalRecords: rawData.length,
        shopCount,
        dayCount: dailyStats.length,
        totalAmount: dailyStats.reduce((sum, day) => sum + day.totalAmount, 0)
      }
    });
  } catch (error) {
    console.error('文件处理失败:', error);
    return NextResponse.json(
      { error: '文件处理失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
