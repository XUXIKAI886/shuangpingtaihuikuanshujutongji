---
name: excel-sync-and-push
description: This skill should be used when需要将 excel-input/1~5 的最新Excel按追加方式同步到 public/data JSON，并自动提交和推送到远程仓库。
---

# Excel Sync And Push

Use this skill to complete one-step data sync and delivery for this project.

## Trigger

Use when the user asks to sync the latest five Excel folders into JSON and ship changes.

## Workflow

1. Ensure Excel files are placed in:
   - `excel-input/1`
   - `excel-input/2`
   - `excel-input/3`
   - `excel-input/4`
   - `excel-input/5`
2. Run `npm run skill:sync-push`.
3. Verify script output:
   - JSON files updated under `public/data`
   - commit created when data changed
   - push status printed

## 行为说明

- 同步模式为按日期仅追加新数据（已存在日期跳过，不做累计）。
- 提交信息沿用仓库风格：`feat: ...`。
- 推送失败时必须返回明确下一步（认证后重试）。
