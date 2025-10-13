import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// 定义数据结构
interface RawData {
  [key: string]: any;
}

interface CycleDailyData {
  date: string;            // 日期
  totalAmount: number;     // 当日代运营结算金额总和
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

// 处理周期账单数据
function processCycleData(rawData: RawData[]): CycleDailyData[] {
  // 用于存储每日的统计数据
  const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

  rawData.forEach(row => {
    // 提取关键字段
    const shopId = row['门店id']?.toString() || '';
    const settlementAmount = parseFloat(row['代运营结算金额']?.toString() || '0');
    const date = row['账单日期']?.toString() || '';

    if (date && shopId) {
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { amount: 0, shops: new Set() });
      }
      const dailyData = dailyMap.get(date)!;
      dailyData.amount += settlementAmount;
      dailyData.shops.add(shopId);
    }
  });

  // 转换为数组并排序
  const cycleDailyStats = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalAmount: data.amount,
      shopCount: data.shops.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return cycleDailyStats;
}

// 主函数
async function main() {
  try {
    // Excel文件路径
    const excelPath = path.join(process.cwd(), '5349094916_20250921_20251012周期账单_1760317630262.xlsx');

    console.log('正在读取周期账单Excel文件...');
    const rawData = readExcel(excelPath);
    console.log(`读取到 ${rawData.length} 条记录`);

    console.log('正在处理数据...');
    const cycleDailyStats = processCycleData(rawData);

    // 输出统计结果
    console.log('\n=== 每日代运营结算统计 ===');
    console.log(`共 ${cycleDailyStats.length} 天`);
    let totalAmount = 0;
    cycleDailyStats.forEach(day => {
      totalAmount += day.totalAmount;
      console.log(`${day.date}: ¥${day.totalAmount.toFixed(2)} (${day.shopCount} 个店铺)`);
    });
    console.log(`\n总计: ¥${totalAmount.toFixed(2)}`);

    // 保存处理后的数据为JSON
    const outputDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'cycle-daily-stats.json'),
      JSON.stringify(cycleDailyStats, null, 2)
    );

    console.log('\n数据已保存到 public/data/cycle-daily-stats.json');
  } catch (error) {
    console.error('处理失败:', error);
    process.exit(1);
  }
}

main();
