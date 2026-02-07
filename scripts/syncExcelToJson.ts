import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { processDataByType, UploadType, DailyData } from '../app/lib/upload/processors';

type SourceConfig = {
  type: UploadType;
  folder: string;
  label: string;
  outputFile: string;
};

const SOURCE_CONFIGS: SourceConfig[] = [
  { type: 'fixedFee', folder: '1', label: '饿了么固定费用', outputFile: 'fixedFeeData.json' },
  { type: 'elmCycle', folder: '2', label: '饿了么代运营回款', outputFile: 'elmCycleData.json' },
  { type: 'meituan', folder: '3', label: '美团代运营回款', outputFile: 'meituanData.json' },
  { type: 'meituanOffline', folder: '4', label: '美团线下收款', outputFile: 'meituanOfflineData.json' },
  { type: 'meituanRefund', folder: '5', label: '美团退款', outputFile: 'meituanRefundData.json' },
];

const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls']);

const isExcelFile = (fileName: string): boolean => {
  const ext = path.extname(fileName).toLowerCase();
  return EXCEL_EXTENSIONS.has(ext);
};

const findLatestExcelFile = (dirPath: string): string | null => {
  if (!fs.existsSync(dirPath)) return null;

  const candidates = fs
    .readdirSync(dirPath)
    .filter(fileName => isExcelFile(fileName))
    .map(fileName => {
      const fullPath = path.join(dirPath, fileName);
      const stat = fs.statSync(fullPath);
      return { fullPath, mtimeMs: stat.mtimeMs, isFile: stat.isFile() };
    })
    .filter(item => item.isFile)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates[0]?.fullPath ?? null;
};

const readExcel = (filePath: string): any[] => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const writeJson = (filePath: string, data: DailyData[]) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

async function main() {
  const inputRoot = path.join(process.cwd(), 'excel-input');
  const outputRoot = path.join(process.cwd(), 'public', 'data');
  ensureDir(outputRoot);

  const syncSummary: {
    type: UploadType;
    label: string;
    sourceFile: string | null;
    outputFile: string;
    recordCount: number;
    dayCount: number;
    skipped: boolean;
    reason?: string;
  }[] = [];

  for (const config of SOURCE_CONFIGS) {
    const inputDir = path.join(inputRoot, config.folder);
    const latestExcelPath = findLatestExcelFile(inputDir);

    if (!latestExcelPath) {
      console.log(`⚠️  跳过 ${config.label}：目录 ${inputDir} 下未找到 Excel 文件`);
      syncSummary.push({
        type: config.type,
        label: config.label,
        sourceFile: null,
        outputFile: config.outputFile,
        recordCount: 0,
        dayCount: 0,
        skipped: true,
        reason: '未找到 Excel 文件',
      });
      continue;
    }

    const rawData = readExcel(latestExcelPath);
    const { dailyStats } = processDataByType(config.type, rawData);
    const outputPath = path.join(outputRoot, config.outputFile);

    writeJson(outputPath, dailyStats);

    console.log(
      `✅ ${config.label} 同步完成 -> ${config.outputFile}（源文件: ${path.basename(latestExcelPath)}，记录: ${rawData.length}，天数: ${dailyStats.length}）`
    );

    syncSummary.push({
      type: config.type,
      label: config.label,
      sourceFile: latestExcelPath,
      outputFile: config.outputFile,
      recordCount: rawData.length,
      dayCount: dailyStats.length,
      skipped: false,
    });
  }

  const metaPath = path.join(outputRoot, 'sync-meta.json');
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        sourceRoot: inputRoot,
        outputRoot,
        items: syncSummary,
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(`\n📦 同步汇总已写入: ${metaPath}`);
}

main().catch(error => {
  console.error('❌ 同步失败:', error);
  process.exit(1);
});
