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

## Behavior

- Sync mode is append-and-aggregate by date.
- Commit message format follows repository style: `feat: ...`.
- Push failure must return clear next steps (for auth setup).
