import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// 定义数据结构
interface RawData {
  [key: string]: any;
}

interface MeituanDailyData {
  date: string;            // 日期
  totalAmount: number;     // 当日结算金额总和
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

// 处理美团账单数据
function processMeituanData(rawData: RawData[]): MeituanDailyData[] {
  // 用于存储每日的统计数据
  const dailyMap = new Map<string, { amount: number, shops: Set<string> }>();

  // 跳过第一行（表头）
  rawData.slice(1).forEach(row => {
    // 提取关键字段
    const rawDate = row['代运营账单']?.toString() || '';
    const shopId = row['_1']?.toString() || '';  // 门店ID
    const settlementAmount = parseFloat(row['_4']?.toString() || '0');  // 结算金额(元)

    // 过滤无效日期（如"日期"字符串）
    if (rawDate && rawDate !== '日期' && shopId && !isNaN(settlementAmount)) {
      // 美团数据日期减1天（因为统计的是前一天的数据）
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

  // 转换为数组并排序
  const meituanDailyStats = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalAmount: data.amount,
      shopCount: data.shops.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return meituanDailyStats;
}

// 主函数
async function main() {
  try {
    // Excel文件路径
    const excelPath = path.join(process.cwd(), '[2238+代运营账单明细表20250602-20251012+下载日期_20251013].xls');

    console.log('正在读取美团账单Excel文件...');
    const rawData = readExcel(excelPath);
    console.log(`读取到 ${rawData.length} 条记录`);

    console.log('正在处理数据...');
    const meituanDailyStats = processMeituanData(rawData);

    // 输出统计结果
    console.log('\n=== 美团每日结算统计 ===');
    console.log(`共 ${meituanDailyStats.length} 天`);
    let totalAmount = 0;

    // 只显示前20天和后10天的数据
    const displayData = [
      ...meituanDailyStats.slice(0, 20),
      ...(meituanDailyStats.length > 30 ? ['...'] : []),
      ...meituanDailyStats.slice(-10)
    ];

    displayData.forEach(day => {
      if (typeof day === 'string') {
        console.log(day);
      } else {
        totalAmount += day.totalAmount;
        console.log(`${day.date}: ¥${day.totalAmount.toFixed(2)} (${day.shopCount} 个店铺)`);
      }
    });

    // 计算完整总额
    const fullTotalAmount = meituanDailyStats.reduce((sum, day) => sum + day.totalAmount, 0);
    console.log(`\n总计: ¥${fullTotalAmount.toFixed(2)}`);

    // 保存处理后的数据为JSON
    const outputDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'meituan-daily-stats.json'),
      JSON.stringify(meituanDailyStats, null, 2)
    );

    console.log('\n数据已保存到 public/data/meituan-daily-stats.json');
  } catch (error) {
    console.error('处理失败:', error);
    process.exit(1);
  }
}

main();
