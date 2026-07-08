---
name: excel-sync-and-push
description: This skill should be used when需要将 excel-input/1~5 的最新Excel同步到 public/data JSON，并自动提交和推送到远程仓库。
---

# Excel Sync And Push

## 本 Skill 全局文档路径

`F:\claude-code\饿了么美团回款数据统计系统\.claude\skills\excel-sync-and-push\SKILL.md`

Use this skill to complete one-step data sync and delivery for this project.

## Trigger

Use when the user asks to sync the latest five Excel folders into JSON and ship changes.

## Workflow

1. Run `npm run skill:sync-push`.
2. The script will automatically search each `excel-input/1~5` folder first, choose the latest matching Excel for each type, and only fall back to the project root when the corresponding `excel-input` folder has no matching file.
3. Verify script output:
    - JSON files updated under `public/data`
    - commit created when data changed
    - push status printed
    - push uses the explicit `XUXIKAI886` GitHub account path

## 行为说明

- 同步模式按数据源区分：
  - 饿了么代运营回款（`elmCycleData.json`）必须按最新周期账单覆盖同日期旧数据，确保平台回溯修正后的历史账单金额与 Boss 项目一致。
  - 美团代运营回款（`meituanData.json`）必须覆盖同日期旧数据，并且当 `excel-input/3` 中同时存在区间大账单和单日补查账单时，必须全部读取；同日期以后读取的单日补查文件为准，避免平台当天查数不完整导致历史日期继续沿用旧错误统计。
  - 其他数据仍按日期仅追加新数据（已存在日期跳过，不做累计）。
- 现在默认会优先使用 `excel-input/1~5` 中你已替换好的文件；只有对应目录没有匹配文件时，才会回退到项目根目录自动匹配。
- 美团代运营账单第一行通常是“代运营账单”标题、第二行才是真实表头；解析时必须兼容 `日期/门店ID/结算金额(元)` 真实表头和 `代运营账单/_1/_4` 旧错位字段，禁止只依赖单一错位字段。
- 提交信息沿用仓库风格：`feat: ...`。
- 推送必须使用：`git push "https://XUXIKAI886@github.com/XUXIKAI886/shuangpingtaihuikuanshujutongji.git" master`
- 不要使用 `git push origin master`，否则可能命中错误的本机默认账号并导致无权限。
- 推送失败时必须返回明确下一步（认证后重试）。

## 每日全流程记忆回写

被 `daily-workflow-executor` 调用时，必须记录：

- 五个 `excel-input/1~5` 实际复用的文件名
- 每类数据的新增天数、重复日期数、覆盖更新天数、合并后天数；饿了么代运营回款和美团代运营回款必须关注 `覆盖更新` 是否反映历史账单回溯修正或单日补查修正
- 美团代运营回款如有多个 `excel-input/3` 文件，必须记录全部参与同步的文件名，并抽查目标日期的 `totalAmount` 与 `shopCount`
- `sync-meta.json` 是否写入
- commit hash 和显式远程 URL 的 push 输出
- 如果最终 `git status` 相对本地 `origin/master` 显示 `ahead`，必须用 `git ls-remote "https://XUXIKAI886@github.com/XUXIKAI886/shuangpingtaihuikuanshujutongji.git" refs/heads/master` 验证远端 `master` hash 等于本次 commit；相等则不得因本地 `origin` 状态误判失败
- `npm warn exec ... tsx` 只是依赖按需安装提示，不等同失败；以脚本退出码和 push 输出为准
- 工作区如有既有未提交/未跟踪文件，只记录，不要清理或纳入本次提交
