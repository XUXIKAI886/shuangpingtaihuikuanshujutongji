import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { execSync } from 'child_process';
import { processDataByType, UploadType, DailyData } from '../app/lib/upload/processors';
import { DailyDataMergeMode, mergeDailyDataByDate } from './syncExcelMerge';

type SourceConfig = {
  type: UploadType;
  folder: string;
  label: string;
  outputFile: string;
  patterns: RegExp[];
  mergeMode?: DailyDataMergeMode;
};

const SOURCE_CONFIGS: SourceConfig[] = [
  {
    type: 'fixedFee',
    folder: '1',
    label: '饿了么固定费用',
    outputFile: 'fixedFeeData.json',
    patterns: [/固定费用/i],
  },
  {
    type: 'elmCycle',
    folder: '2',
    label: '饿了么代运营回款',
    outputFile: 'elmCycleData.json',
    patterns: [/周期账单/i],
    mergeMode: 'replace-existing-by-date',
  },
  {
    type: 'meituan',
    folder: '3',
    label: '美团代运营回款',
    outputFile: 'meituanData.json',
    patterns: [/代运营账单明细表/i],
  },
  {
    type: 'meituanOffline',
    folder: '4',
    label: '美团线下收款',
    outputFile: 'meituanOfflineData.json',
    patterns: [/线下收款/i],
  },
  {
    type: 'meituanRefund',
    folder: '5',
    label: '美团退款',
    outputFile: 'meituanRefundData.json',
    patterns: [/退款/i, /线下收款/i],
  },
];

const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls']);
const PUSH_REMOTE = 'https://XUXIKAI886@github.com/XUXIKAI886/shuangpingtaihuikuanshujutongji.git';
const PUSH_BRANCH = 'master';

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

const listExcelCandidates = (dirPath: string): Array<{ fullPath: string; mtimeMs: number }> => {
  if (!fs.existsSync(dirPath)) return [];

  return fs.readdirSync(dirPath)
    .filter(fileName => isExcelFile(fileName))
    .map(fileName => {
      const fullPath = path.join(dirPath, fileName);
      const stat = fs.statSync(fullPath);
      return { fullPath, mtimeMs: stat.mtimeMs, isFile: stat.isFile() };
    })
    .filter(item => item.isFile)
    .map(({ fullPath, mtimeMs }) => ({ fullPath, mtimeMs }));
};

const findLatestMatchingExcelFile = (dirPaths: string[], patterns: RegExp[]): string | null => {
  const normalizedPatterns = patterns.length > 0 ? patterns : [/.*/];

  const candidates = dirPaths.flatMap(listExcelCandidates)
    .filter(candidate => normalizedPatterns.some(pattern => pattern.test(path.basename(candidate.fullPath))));

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0]?.fullPath ?? null;
};

const clearExcelFiles = (dirPath: string, keepFileName?: string): void => {
  if (!fs.existsSync(dirPath)) return;

  for (const fileName of fs.readdirSync(dirPath)) {
    if (!isExcelFile(fileName)) continue;
    if (keepFileName && fileName === keepFileName) continue;
    fs.unlinkSync(path.join(dirPath, fileName));
  }
};

const syncLatestSourceFile = (projectRoot: string, inputRoot: string, config: SourceConfig): string | null => {
  const targetDir = path.join(inputRoot, config.folder);
  ensureDir(targetDir);

  const latestInputPath = findLatestMatchingExcelFile([targetDir], config.patterns);
  const latestRootPath = findLatestMatchingExcelFile([projectRoot], config.patterns);
  const latestSourcePath = latestInputPath ?? latestRootPath;
  if (!latestSourcePath) {
    return null;
  }

  const targetPath = path.join(targetDir, path.basename(latestSourcePath));
  const shouldCopy = path.resolve(latestSourcePath) !== path.resolve(targetPath);

  clearExcelFiles(targetDir, shouldCopy ? undefined : path.basename(targetPath));
  if (shouldCopy) {
    fs.copyFileSync(latestSourcePath, targetPath);
    const sourceLabel = latestInputPath ? 'excel-input' : 'project-root';
    console.log(`📥 已自动准备 ${config.label}：${path.basename(latestSourcePath)} (${sourceLabel}) -> excel-input/${config.folder}`);
  } else {
    console.log(`📦 已自动复用 ${config.label}：excel-input/${config.folder}/${path.basename(targetPath)}`);
  }

  return targetPath;
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
    mergeMode?: DailyDataMergeMode;
    replacedDayCount: number;
    skipped: boolean;
    reason?: string;
  }> = [];

  const changedFiles: string[] = [];
  let hasAnyDataChange = false;

  for (const config of SOURCE_CONFIGS) {
    const latestExcelPath = syncLatestSourceFile(projectRoot, inputRoot, config);

    if (!latestExcelPath) {
      console.log(`⚠️  跳过 ${config.label}：未找到可自动匹配的 Excel 文件`);
      summary.push({
        type: config.type,
        label: config.label,
        sourceFile: null,
        outputFile: config.outputFile,
        beforeDayCount: 0,
        appendedDayCount: 0,
        afterDayCount: 0,
        recordCount: 0,
        mergeMode: config.mergeMode ?? 'append-new-by-date',
        replacedDayCount: 0,
        skipped: true,
        reason: '未找到可自动匹配的 Excel 文件',
      });
      continue;
    }

    const rawData = readExcel(latestExcelPath);
    const { dailyStats } = processDataByType(config.type, rawData);
    const outputPath = path.join(outputRoot, config.outputFile);
    const existingData = readExistingJson(outputPath);
    const mergeMode = config.mergeMode ?? 'append-new-by-date';
    const {
      mergedData,
      appendedDayCount,
      duplicateDayCount,
      replacedDayCount,
    } = mergeDailyDataByDate(existingData, dailyStats, mergeMode);

    if (appendedDayCount > 0 || replacedDayCount > 0) {
      hasAnyDataChange = true;
    }

    const mergedJson = JSON.stringify(mergedData, null, 2);
    const existingJson = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : '';
    if (mergedJson !== existingJson) {
      fs.writeFileSync(outputPath, mergedJson, 'utf-8');
      changedFiles.push(outputPath);
    }

    console.log(
      `✅ ${config.label} 同步完成 -> ${config.outputFile}（源文件: ${path.basename(latestExcelPath)}，模式: ${mergeMode}，新增天数: ${appendedDayCount}，重复日期: ${duplicateDayCount}，覆盖更新: ${replacedDayCount}，合并后天数: ${mergedData.length}）`
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
      mergeMode,
      replacedDayCount,
      skipped: false,
    });
  }

  if (!hasAnyDataChange) {
    console.log('ℹ️ 本次未检测到新日期或历史日期更新，已跳过写入与提交。');
    return;
  }

  const metaPath = path.join(outputRoot, 'sync-meta.json');
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        mode: 'mixed-by-source',
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
    runGit(`git push "${PUSH_REMOTE}" ${PUSH_BRANCH}`);
    console.log(`🚀 已推送到远程仓库 ${PUSH_REMOTE} ${PUSH_BRANCH}`);
  } catch {
    console.error('❌ 推送失败：请先完成认证后重试。');
    console.error(`下一步：在当前终端执行 git push "${PUSH_REMOTE}" ${PUSH_BRANCH}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
