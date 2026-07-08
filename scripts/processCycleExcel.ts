import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

import { processDataByType } from '../app/lib/upload/processors';

const readExcel = (filePath: string): any[] => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

async function main() {
  try {
    const excelPath = path.join(process.cwd(), '5349094916_20250921_20251012周期账单_1760317630262.xlsx');

    console.log('正在读取周期账单Excel文件...');
    const rawData = readExcel(excelPath);
    console.log(`读取到 ${rawData.length} 条记录`);

    console.log('正在使用统一处理器处理饿了么代运营回款数据...');
    const { dailyStats, storageKey } = processDataByType('elmCycle', rawData);

    console.log('\n=== 每日代运营结算统计 ===');
    console.log(`共 ${dailyStats.length} 天`);
    dailyStats.forEach(day => {
      console.log(`${day.date}: ¥${day.totalAmount.toFixed(2)} (${day.shopCount} 个店铺)`);
    });

    const totalAmount = dailyStats.reduce((sum, day) => sum + day.totalAmount, 0);
    console.log(`\n总计: ¥${totalAmount.toFixed(2)}`);

    const outputDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = `${storageKey}.json`;
    fs.writeFileSync(
      path.join(outputDir, outputFile),
      JSON.stringify(dailyStats, null, 2),
      'utf-8'
    );

    console.log(`\n数据已保存到 public/data/${outputFile}`);
  } catch (error) {
    console.error('处理失败:', error);
    process.exit(1);
  }
}

main();
