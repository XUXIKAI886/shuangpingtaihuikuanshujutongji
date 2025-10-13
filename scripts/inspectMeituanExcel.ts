import * as XLSX from 'xlsx';
import * as path from 'path';

async function main() {
  try {
    const excelPath = path.join(process.cwd(), '[2238+代运营账单明细表20250602-20251012+下载日期_20251013].xls');

    console.log('正在读取美团账单Excel文件...');
    const workbook = XLSX.readFile(excelPath);

    console.log(`\n发现 ${workbook.SheetNames.length} 个工作表:`);
    workbook.SheetNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });

    const sheetName = workbook.SheetNames[0];
    console.log(`\n使用第一个工作表: ${sheetName}`);

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`\n读取到 ${data.length} 条记录`);

    if (data.length > 0) {
      console.log('\n=== 第一条记录的所有字段 ===');
      const firstRow = data[0] as any;
      Object.keys(firstRow).forEach(key => {
        console.log(`字段名: "${key}" = ${firstRow[key]}`);
      });

      console.log('\n=== 前10条记录示例 ===');
      data.slice(0, 10).forEach((row: any, index) => {
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
