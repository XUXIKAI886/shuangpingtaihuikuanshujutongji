# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

这是一个基于 Next.js 的饿了么和美团双平台代运营回款数据统计分析系统。系统使用浏览器 localStorage 存储数据，支持纯静态部署到 GitHub Pages，所有 Excel 数据处理都在客户端完成。

**品牌**: 呈尚策划 - 双平台回款综合分析系统

## 常用命令

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器 (访问 http://localhost:3000)
npm run dev

# 代码检查
npm run lint

# 构建静态站点 (输出到 out/ 目录)
npm run build

# 本地预览生产版本
npx serve@latest out
```

### 命令行工具 (可选，仅用于开发调试)

```bash
# 处理饿了么固定费用账单
npx tsx scripts/processExcel.ts

# 处理饿了么代运营回款账单
npx tsx scripts/processCycleExcel.ts

# 处理美团代运营回款账单
npx tsx scripts/processMeituanExcel.ts

# 查看 Excel 文件结构
npx tsx scripts/inspectExcel.ts
npx tsx scripts/inspectCycleExcel.ts
npx tsx scripts/inspectMeituanExcel.ts
```

## 架构设计

### 核心架构模式

**客户端数据处理架构** - 所有数据处理在浏览器完成：
```
用户浏览器
├── Excel 上传 → xlsx 库解析 → 数据处理 → 存入 localStorage
├── 数据读取 → 从 localStorage 加载 → 渲染图表和表格
└── 数据清空 → 清除 localStorage → 刷新页面
```

### 技术栈

- **框架**: Next.js 15 (App Router) + 静态导出 (`output: 'export'`)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图表**: Recharts
- **Excel处理**: xlsx (客户端)
- **数据存储**: localStorage (浏览器本地)
- **部署**: GitHub Pages + GitHub Actions

### 数据流架构

1. **数据输入**: 用户上传 Excel 文件 → FileUpload 组件使用 xlsx 库解析
2. **数据处理**: 根据数据类型调用对应的处理函数（processFixedFeeData/processElmCycleData/processMeituanData/processMeituanOfflineData）
3. **数据存储**: 处理后的数据保存到 localStorage（fixedFeeData/elmCycleData/meituanData/meituanOfflineData）
4. **数据同步**: 触发自定义 'dataUpdated' 事件，通知所有组件刷新
5. **数据展示**: ClientHome 监听事件并重新加载 localStorage 数据，更新 UI

### 组件架构

```
page.tsx (服务端组件)
└── ClientHome.tsx (客户端主组件)
    ├── FileUpload.tsx (Excel 上传和处理)
    ├── ClearDataButton.tsx (清空数据)
    ├── DailyCharts.tsx (可视化图表)
    └── AllPlatformsDailyStats.tsx (数据表格)
```

## 数据处理逻辑

### 四种数据类型的处理规则

#### 1. 饿了么固定费用 (fixedFee)
- **数据源字段**: 门店ID、店铺名称、结算金额、结算日期
- **计算逻辑**: 按"店铺ID + 结算日期"分组，统计两种固定费用档位：
  - **档位1**: 净结算金额为 **33.95元**（35.00元固定费用 - 1.05元抽佣）
  - **档位2**: 净结算金额为 **36.86元**（38.00元固定费用 - 1.14元抽佣）
- **代码位置**: FileUpload.tsx:21-67, processFixedFeeData 函数
- **存储键**: `fixedFeeData`

#### 2. 饿了么代运营回款 (elmCycle)
- **数据源字段**: 门店id、代运营结算金额、账单日期
- **计算逻辑**: 按账单日期分组，汇总每日代运营结算金额
- **存储键**: `elmCycleData`

#### 3. 美团代运营回款 (meituan)
- **数据源字段**: 代运营账单(日期)、_1(门店ID)、_4(结算金额)
- **计算逻辑**:
  - 跳过表头行 (使用 `rawData.slice(1)`)
  - **日期自动减1天** (因为美团数据标注的是下一天)
  - 按调整后的日期分组汇总
- **存储键**: `meituanData`

#### 4. 美团线下收款 (meituanOffline)
- **数据源字段**: 日期/收款日期/账单日期、金额/收款金额/线下收款、店铺ID(可选)
- **计算逻辑**:
  - 支持 Excel 日期序列号自动转换 (从1900-01-01计算)
  - **使用原始日期** (不减1天，与美团代运营不同)
  - 灵活字段匹配，支持多种列名
- **存储键**: `meituanOfflineData`

### 日期处理特殊逻辑

⚠️ **重要**: 不同数据类型的日期处理方式不同：
- **饿了么固定费用/代运营**: 使用原始日期
- **美团代运营**: 日期减1天 (`dateObj.setDate(dateObj.getDate() - 1)`)
- **美团线下收款**: 使用原始日期，支持 Excel 日期序列号自动转换

### 数据统一格式

所有处理函数返回 `DailyData[]` 格式：
```typescript
interface DailyData {
  date: string;        // ISO 格式日期 (YYYY-MM-DD)
  totalAmount: number; // 当日总金额
  shopCount: number;   // 当日店铺数
}
```

## 部署配置

### GitHub Pages 静态部署

- **basePath**: `/shuangpingtaihuikuanshujutongji` (生产环境)
- **构建输出**: `out/` 目录
- **自动部署**: 推送到 master 或 main 分支触发 GitHub Actions
- **在线地址**: https://xuxikai886.github.io/shuangpingtaihuikuanshujutongji/

### 部署流程 (.github/workflows/deploy.yml)

1. Checkout 代码
2. 安装 Node.js 20
3. 安装依赖 (`npm ci`)
4. 构建 Next.js 静态站点 (`npm run build`)
5. 上传 `out/` 目录到 GitHub Pages
6. 自动部署

## 开发注意事项

### localStorage 使用规范

- **不要使用服务端 API**: 项目已废弃 `app/api/` 下的路由，改为客户端处理
- **数据同步机制**: 使用自定义事件 `window.dispatchEvent(new Event('dataUpdated'))` 通知组件更新
- **事件监听**: 组件需同时监听 `storage` 和 `dataUpdated` 事件
- **存储键命名**:
  - `fixedFeeData` - 饿了么固定费用
  - `elmCycleData` - 饿了么代运营
  - `meituanData` - 美团代运营
  - `meituanOfflineData` - 美团线下收款

### 客户端组件标记

所有使用 localStorage、useState、useEffect 的组件必须添加 `'use client'` 指令。

### Excel 处理最佳实践

- **文件验证**: 检查文件扩展名 (.xlsx 或 .xls)
- **数据解析**: 使用 `XLSX.read(data, { type: 'array' })`
- **日期转换**: 注意处理 Excel 日期序列号和 ISO 字符串两种格式
- **错误处理**: 使用 try-catch 包裹文件处理逻辑，提供友好的错误提示

### 图表数据处理

- **最后一天过滤**: 图表自动过滤最后一天数据（避免美团数据不完整）
- **数据合并**: AllPlatformsDailyStats 组件负责合并四个平台的数据
- **空值处理**: 使用 "---" 显示无数据项

## 常见任务

### 添加新的数据类型

1. 在 `FileUpload.tsx` 中添加新的 `DataType`
2. 实现对应的处理函数 (如 `processNewData`)
3. 在 `handleFileUpload` 中添加新类型的分支逻辑
4. 定义新的 localStorage 存储键
5. 在 `ClientHome.tsx` 中添加新数据的 state 和加载逻辑
6. 更新 `AllPlatformsDailyStats.tsx` 和 `DailyCharts.tsx` 以展示新数据

### 修改数据处理逻辑

1. 定位到对应的处理函数 (FileUpload.tsx:21-183)
2. 修改计算逻辑（分组、过滤、聚合等）
3. 确保返回格式符合 `DailyData[]` 接口
4. 测试上传功能和数据展示

### 调整样式和布局

- 全局样式: `app/globals.css`
- Tailwind 配置: `tailwind.config.ts`
- 组件样式: 使用 Tailwind CSS 类名
- 渐变卡片颜色映射:
  - 蓝色: 饿了么固定费用
  - 绿色: 饿了么代运营
  - 橙色: 美团代运营
  - 紫色: 总金额/美团线下收款

### 添加新的图表类型

在 `DailyCharts.tsx` 中使用 Recharts 组件：
- `LineChart` - 折线图（当前用于趋势展示）
- `BarChart` - 柱状图
- `AreaChart` - 面积图
- 支持多条曲线叠加展示

## 项目目录结构说明

- `app/components/` - 所有 React 组件（客户端组件使用 'use client'）
- `app/api/` - 已废弃的 API 路由（保留用于参考）
- `scripts/` - 命令行工具（仅用于开发调试）
- `public/data/` - 示例数据（仅用于开发，生产环境使用 localStorage）
- `.github/workflows/` - GitHub Actions 自动部署配置
- `out/` - 构建输出目录（由 `npm run build` 生成）
