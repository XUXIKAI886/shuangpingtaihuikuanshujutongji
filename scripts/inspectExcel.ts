import * as XLSX from 'xlsx';
import * as path from 'path';

async function main() {
  try {
    const excelPath = path.join(process.cwd(), '5349094916_20250921_20251012代运营固定费用账单_1760320611486.xlsx');

    console.log('正在读取Excel文件...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`\n读取到 ${data.length} 条记录`);

    if (data.length > 0) {
      console.log('\n=== 第一条记录的所有字段 ===');
      const firstRow = data[0] as any;
      Object.keys(firstRow).forEach(key => {
        console.log(`字段名: "${key}" = ${firstRow[key]}`);
      });

      console.log('\n=== 前5条记录示例 ===');
      data.slice(0, 5).forEach((row: any, index) => {
        console.log(`\n记录 ${index + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      });
    }
  } catch (error) {
    console.error('处理失败:', error);
    process.exit(1);
  }
}

main();
