import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

import { processDataByType, UploadType } from '@/app/lib/upload/processors';

const SUPPORTED_TYPES: UploadType[] = [
  'fixedFee',
  'elmCycle',
  'meituan',
  'meituanOffline',
  'meituanRefund',
];

const isUploadType = (value: FormDataEntryValue | null): value is UploadType =>
  typeof value === 'string' && SUPPORTED_TYPES.includes(value as UploadType);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const dataType = formData.get('dataType');

    if (!file) {
      return NextResponse.json({ error: '未找到上传文件' }, { status: 400 });
    }

    if (!isUploadType(dataType)) {
      return NextResponse.json({ error: '无效的数据类型' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    const { dailyStats, storageKey } = processDataByType(dataType, rawData);

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

    return NextResponse.json({
      success: true,
      message: '文件上传并处理成功',
      outputFile,
      storageKey,
      stats: {
        totalRecords: rawData.length,
        dayCount: dailyStats.length,
        totalAmount: dailyStats.reduce((sum, day) => sum + day.totalAmount, 0),
      },
    });
  } catch (error) {
    console.error('文件处理失败:', error);
    return NextResponse.json(
      { error: '文件处理失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
