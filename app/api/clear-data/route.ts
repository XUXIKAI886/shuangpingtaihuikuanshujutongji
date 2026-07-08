import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// 清空数据的API路由
export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');

    // 空数据结构
    const emptyData: any[] = [];

    // 清空当前页面读取的统一数据文件；旧文件一并清空，避免历史页面或缓存入口读到旧口径。
    const files = [
      'fixedFeeData.json',
      'elmCycleData.json',
      'meituanData.json',
      'meituanOfflineData.json',
      'meituanRefundData.json',
      'daily-stats.json',
      'cycle-daily-stats.json',
      'meituan-daily-stats.json',
      'shop-stats.json',
    ];

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: '数据已成功清空'
    });
  } catch (error) {
    console.error('清空数据失败:', error);
    return NextResponse.json({
      success: false,
      message: '清空数据失败'
    }, { status: 500 });
  }
}
