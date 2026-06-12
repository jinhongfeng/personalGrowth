# Generation Rules

Use these rules to decide what test cases to generate and how to judge their quality.

## Coverage Strategy

For each selected feature, consider these test dimensions:

| 维度 | 需要覆盖的内容 |
| --- | --- |
| 主流程 | 用户按预期路径完成核心任务。 |
| 反向流程 | 用户取消、返回、跳过、重复点击、输入错误。 |
| 字段校验 | 必填、格式、长度、范围、枚举、特殊字符、空格、大小写。 |
| 边界值 | 最小值、最大值、刚好等于边界、超过边界、空值。 |
| 权限 | 未登录、无权限、不同角色、过期会话、越权访问。 |
| 状态 | 初始状态、中间状态、完成状态、失败状态、重复提交。 |
| 数据 | 保存、回显、刷新、分页、排序、筛选、去重、同步、缓存。 |
| 异常 | 网络失败、接口超时、服务端错误、第三方失败、数据不存在。 |
| 兼容 | 浏览器、系统版本、屏幕尺寸、语言、时区、深色模式。 |
| 安全 | 敏感信息展示、输入注入、文件类型、越权、频率限制。 |
| 可观测 | 埋点、日志、通知、审计记录、消息推送。 |

Do not force irrelevant dimensions. For example, do not create payment cases for a feature that has no payment behavior.

## Priority Definitions

- `P0`: Core business path, money/data/security risk, release blocker, login/payment/order/permission/destructive operation.
- `P1`: Important functional path, common user path, important validation, common exception path.
- `P2`: Secondary path, less common validation, compatibility, non-blocking message or display behavior.
- `P3`: Low-risk copy, style, rare compatibility, optional behavior.

## Case Naming

- Use concise Chinese names.
- Prefer `条件 + 动作 + 结果`.
- Avoid generic names such as `登录测试` or `功能测试`.
- Good: `未注册手机号获取验证码失败并提示账号不存在`.
- Bad: `手机号登录异常测试`.

## Step Rules

- Use numbered steps.
- Each step must be an action the tester can perform.
- Avoid combining many unrelated actions in one step.
- Expected results must be observable.
- If the expected result requires backend verification, mention the verification target, such as database record, audit log, API response, or event name.

## Assumption Rules

If source material is incomplete:

- Ask a clarification question when the missing detail changes expected behavior.
- Generate only safe generic cases when the missing detail does not change the behavior.
- Put assumptions in `备注`.
- Use `待补充` for unknown source document, exact error text, role name, interface name, or test data.

## Minimum Output Guidance

For a small single-path feature, generate 8-15 cases if the user does not specify a count.

For a medium feature with forms, roles, and exceptions, generate 15-35 cases.

For a complex feature with state machines, payments, approvals, or integrations, first output a coverage matrix and ask whether to continue with full cases unless the user explicitly asks for full generation.

## Quality Gate

Before responding, verify:

- No required column is missing.
- Each case maps to a feature ID or requirement ID where available.
- Positive and negative cases are both present for input-heavy features.
- Boundary values are present for numeric, date, length, file size, quantity, and amount fields.
- Role and permission cases are present for restricted features.
- State transition cases are present for workflow features.
- Error cases mention clear expected UI behavior.
- Test data is concrete enough to execute.
- Cases do not contradict the feature catalog.
