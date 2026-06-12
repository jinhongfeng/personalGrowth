# Example Input

Use this file to store examples of how users can request test case generation.

## Example User Requests

### Generate all cases for one feature

请使用 `app-test-case-generator`，基于 `示例商城 / 登录 / 手机号验证码登录` 生成测试用例，输出 Markdown 表格。

### Generate only high-priority cases

请为 `示例商城` 的 `手机号验证码登录` 只生成 P0 和 P1 用例，覆盖正向、反向、边界、异常和权限场景。

### Generate Excel-ready cases

请为 `CRM App / 客户管理 / 新建客户` 生成测试用例，输出为 Excel 可导入格式，字段使用统一模板。

### Add source material first

下面是新 App 的功能说明，请先整理到 feature catalog，再生成测试用例：

- App: [App 名称]
- Module: [模块]
- Feature: [功能]
- 功能说明: [...]
- 业务规则: [...]
- 字段规则: [...]
- 验收标准: [...]

## Recommended Source Format

When adding a new feature, provide:

- App 名称和 App ID
- 模块名称和 Module ID
- 功能名称和功能 ID
- 式样书/PRD 名称、版本、章节
- 适用端和用户角色
- 主流程
- 字段规则
- 业务规则
- 权限规则
- 异常规则
- 验收标准
- 已知不测范围
