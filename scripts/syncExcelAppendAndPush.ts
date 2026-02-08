import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { execSync } from 'child_process';
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

  const files = fs.readdirSync(dirPath)
    .filter(fileName => isExcelFile(fileName))
    .map(fileName => {
      const fullPath = path.join(dirPath, fileName);
      const stat = fs.statSync(fullPath);
      return { fullPath, mtimeMs: stat.mtimeMs, isFile: stat.isFile() };
    })
    .filter(item => item.isFile)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return files[0]?.fullPath ?? null;
};

const readExcel = (filePath: string): any[] => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const isDailyDataArray = (value: unknown): value is DailyData[] => {
  if (!Array.isArray(value)) return false;
  return value.every(item => (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as DailyData).date === 'string' &&
    typeof (item as DailyData).totalAmount === 'number' &&
    typeof (item as DailyData).shopCount === 'number'
  ));
};

const readExistingJson = (filePath: string): DailyData[] => {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!isDailyDataArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const mergeAppendByDate = (
  existing: DailyData[],
  incoming: DailyData[]
): {
  mergedData: DailyData[];
  appendedDayCount: number;
  duplicateDayCount: number;
} => {
  const dateMap = new Map<string, DailyData>();
  let appendedDayCount = 0;
  let duplicateDayCount = 0;

  for (const item of existing) {
    dateMap.set(item.date, {
      date: item.date,
      totalAmount: item.totalAmount,
      shopCount: item.shopCount,
    });
  }

  for (const item of incoming) {
    const found = dateMap.get(item.date);
    if (!found) {
      dateMap.set(item.date, {
        date: item.date,
        totalAmount: item.totalAmount,
        shopCount: item.shopCount,
      });
      appendedDayCount += 1;
      continue;
    }

    duplicateDayCount += 1;
  }

  return {
    mergedData: Array.from(dateMap.values()).sort((left, right) => left.date.localeCompare(right.date)),
    appendedDayCount,
    duplicateDayCount,
  };
};

const runGit = (command: string): void => {
  execSync(command, { stdio: 'inherit' });
};

const hasStagedChanges = (): boolean => {
  try {
    execSync('git diff --cached --quiet', { stdio: 'ignore' });
    return false;
  } catch {
    return true;
  }
};

async function main() {
  const projectRoot = process.cwd();
  const inputRoot = path.join(projectRoot, 'excel-input');
  const outputRoot = path.join(projectRoot, 'public', 'data');
  ensureDir(outputRoot);

  const summary: Array<{
    type: UploadType;
    label: string;
    sourceFile: string | null;
    outputFile: string;
    beforeDayCount: number;
    appendedDayCount: number;
    afterDayCount: number;
    recordCount: number;
    skipped: boolean;
    reason?: string;
  }> = [];

  const changedFiles: string[] = [];
  let hasAnyNewDate = false;

  for (const config of SOURCE_CONFIGS) {
    const inputDir = path.join(inputRoot, config.folder);
    const latestExcelPath = findLatestExcelFile(inputDir);

    if (!latestExcelPath) {
      console.log(`⚠️  跳过 ${config.label}：目录 ${inputDir} 下未找到 Excel 文件`);
      summary.push({
        type: config.type,
        label: config.label,
        sourceFile: null,
        outputFile: config.outputFile,
        beforeDayCount: 0,
        appendedDayCount: 0,
        afterDayCount: 0,
        recordCount: 0,
        skipped: true,
        reason: '未找到 Excel 文件',
      });
      continue;
    }

    const rawData = readExcel(latestExcelPath);
    const { dailyStats } = processDataByType(config.type, rawData);
    const outputPath = path.join(outputRoot, config.outputFile);
    const existingData = readExistingJson(outputPath);
    const { mergedData, appendedDayCount, duplicateDayCount } = mergeAppendByDate(existingData, dailyStats);

    if (appendedDayCount > 0) {
      hasAnyNewDate = true;
    }

    const mergedJson = JSON.stringify(mergedData, null, 2);
    const existingJson = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : '';
    if (mergedJson !== existingJson) {
      fs.writeFileSync(outputPath, mergedJson, 'utf-8');
      changedFiles.push(outputPath);
    }

    console.log(
      `✅ ${config.label} 追加同步完成 -> ${config.outputFile}（源文件: ${path.basename(latestExcelPath)}，新增天数: ${appendedDayCount}，重复跳过: ${duplicateDayCount}，合并后天数: ${mergedData.length}）`
    );

    summary.push({
      type: config.type,
      label: config.label,
      sourceFile: latestExcelPath,
      outputFile: config.outputFile,
      beforeDayCount: existingData.length,
      appendedDayCount,
      afterDayCount: mergedData.length,
      recordCount: rawData.length,
      skipped: false,
    });
  }

  if (!hasAnyNewDate) {
    console.log('ℹ️ 本次未检测到新日期，已跳过写入与提交。');
    return;
  }

  const metaPath = path.join(outputRoot, 'sync-meta.json');
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        mode: 'append-new-by-date',
        updatedAt: new Date().toISOString(),
        sourceRoot: inputRoot,
        outputRoot,
        items: summary,
      },
      null,
      2
    ),
    'utf-8'
  );

  changedFiles.push(metaPath);
  console.log(`📦 同步汇总已写入: ${metaPath}`);

  const relativeChanged = changedFiles
    .map(filePath => path.relative(projectRoot, filePath).replace(/\\/g, '/'));

  if (relativeChanged.length === 0) {
    console.log('ℹ️ 没有可提交的变更。');
    return;
  }

  runGit(`git add ${relativeChanged.join(' ')}`);

  if (!hasStagedChanges()) {
    console.log('ℹ️ 数据与仓库一致，无需提交。');
    return;
  }

  const commitMessage = `feat: 同步五目录Excel数据 ${new Date().toISOString().slice(0, 10)}`;
  runGit(`git commit -m "${commitMessage}"`);

  try {
    runGit('git push origin master');
    console.log('🚀 已推送到远程仓库 origin/master');
  } catch {
    console.error('❌ 推送失败：请先完成认证后重试。');
    console.error('下一步：在当前终端执行 git push origin master');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
