import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// 清空数据的API路由
export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');

    // 空数据结构
    const emptyData: any[] = [];

    // 清空三个数据文件
    const files = [
      'daily-stats.json',           // 饿了么固定费用
      'cycle-daily-stats.json',     // 饿了么代运营
      'meituan-daily-stats.json'    // 美团代运营
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
