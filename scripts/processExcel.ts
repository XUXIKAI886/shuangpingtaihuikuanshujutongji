import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// 定义数据结构
interface RawData {
  [key: string]: any;
}

interface ShopData {
  shopId: string;          // 门店ID
  shopName: string;        // 店铺名称
  contractStartDate: string; // 合同开始时间
  totalAmount: number;     // 结算金额之和
}

interface DailyData {
  date: string;            // 日期
  totalAmount: number;     // 当日总结算金额
  shopCount: number;       // 当日店铺数
}

// 读取Excel文件
function readExcel(filePath: string): RawData[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  return data as RawData[];
}

// 处理数据
function processData(rawData: RawData[]): { shopStats: ShopData[], dailyStats: DailyData[] } {
  // 固定费用标准金额：33.95元 (35 - 1.05) 和 36.86元 (38 - 1.14)
  const STANDARD_AMOUNTS = [33.95, 36.86];

  // 临时存储：按店铺+日期分组计算净结算金额
  const shopDailyMap = new Map<string, { shopId: string, shopName: string, contractStartDate: string, date: string, netAmount: number }>();

  rawData.forEach(row => {
    // 提取关键字段
    const shopId = row['门店ID']?.toString() || '';
    const shopName = row['店铺名称']?.toString() || '';
    const contractStartDate = row['合同开始时间']?.toString() || '';
    const settlementAmount = parseFloat(row['结算金额']?.toString() || '0');
    const date = row['结算日期']?.toString() || '';
    const settlementType = row['结算类型']?.toString() || '';

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

  // 用于存储每个店铺的统计数据
  const shopMap = new Map<string, ShopData>();
  // 用于存储每日的统计数据
  const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

  // 处理净结算金额，统计等于 33.95元 或 36.86元 的记录
  shopDailyMap.forEach(record => {
    // 检查是否为目标金额（33.95 或 36.86）
    const isTargetAmount = STANDARD_AMOUNTS.some(amount =>
      Math.abs(record.netAmount - amount) < 0.01
    );

    if (isTargetAmount) {
      // 统计店铺数据
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

      // 统计每日数据
      if (!dailyMap.has(record.date)) {
        dailyMap.set(record.date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(record.date)!;
      dailyData.amount += record.netAmount;
      dailyData.shops.add(record.shopId);
    }
  });

  // 转换为数组并排序
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

// 主函数
async function main() {
  try {
    // Excel文件路径
    const excelPath = path.join(process.cwd(), '5349094916_20250921_20251012代运营固定费用账单_1760320611486.xlsx');

    console.log('正在读取Excel文件...');
    const rawData = readExcel(excelPath);
    console.log(`读取到 ${rawData.length} 条记录`);

    console.log('正在处理数据...');
    const { shopStats, dailyStats } = processData(rawData);

    // 输出统计结果
    console.log('\n=== 店铺统计 ===');
    console.log(`共 ${shopStats.length} 个店铺`);
    shopStats.forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.shopName} (${shop.shopId})`);
      console.log(`   合同开始时间: ${shop.contractStartDate}`);
      console.log(`   结算金额合计: ¥${shop.totalAmount.toFixed(2)}`);
    });

    console.log('\n=== 每日统计 ===');
    console.log(`共 ${dailyStats.length} 天`);
    dailyStats.forEach(day => {
      console.log(`${day.date}: ¥${day.totalAmount.toFixed(2)} (${day.shopCount} 个店铺)`);
    });

    // 保存处理后的数据为JSON
    const outputDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'shop-stats.json'),
      JSON.stringify(shopStats, null, 2)
    );

    fs.writeFileSync(
      path.join(outputDir, 'daily-stats.json'),
      JSON.stringify(dailyStats, null, 2)
    );

    console.log('\n数据已保存到 public/data/ 目录');
  } catch (error) {
    console.error('处理失败:', error);
    process.exit(1);
  }
}

main();
