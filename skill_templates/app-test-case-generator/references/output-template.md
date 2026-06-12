# Output Template

Use this file to keep generated test cases consistent across apps.

## Canonical Fields

Default column order:

| 字段 | 是否必填 | 填写规则 |
| --- | --- | --- |
| 编号 | 是 | 使用 `[AppID]-[ModuleID]-TC-[三位序号]`，例如 `MALL-LOGIN-TC-001`。 |
| 式样书 | 是 | 填写来源文档、版本、章节；未知时填 `待补充`。 |
| 测试模块 | 是 | 填写模块名称，必要时使用 `模块 / 子模块`。 |
| 用例名称 | 是 | 使用动宾短语，说明场景和期望，例如 `已注册手机号使用正确验证码登录成功`。 |
| 前置条件 | 是 | 写清账号、数据、权限、配置、页面入口等。 |
| 测试步骤 | 是 | 使用有序步骤；每一步是可执行动作。 |
| 预期结果 | 是 | 与步骤对应，写可观察结果、页面提示、数据变化、跳转、接口/日志/埋点等。 |
| 用例类型 | 是 | `正向` / `反向` / `边界` / `异常` / `权限` / `兼容性` / `安全` / `数据一致性`。 |
| 优先级 | 是 | `P0` / `P1` / `P2` / `P3`，定义见 `generation-rules.md`。 |
| 测试数据 | 否 | 填具体账号、字段值、文件名、金额、边界值、模拟条件。 |
| 适用端 | 是 | `Web` / `H5` / `iOS` / `Android` / `Admin` / `API` 等。 |
| 需求/功能ID | 是 | 填功能 ID、需求 ID、Story ID 或缺陷 ID。 |
| 备注 | 否 | 填假设、限制、依赖、待确认点。 |

## Markdown Table Format

Use this format by default:

| 编号 | 式样书 | 测试模块 | 用例名称 | 前置条件 | 测试步骤 | 预期结果 | 用例类型 | 优先级 | 测试数据 | 适用端 | 需求/功能ID | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-MOD-TC-001 | 式样书 v1.0 / 章节 | 模块 | 场景名称 | 前置条件 | 1. 操作...<br>2. 操作... | 1. 结果...<br>2. 结果... | 正向 | P0 | 数据 | Web | FEATURE-001 | 备注 |

## CSV Export Rules

When the user requests CSV:

- Preserve the canonical field order.
- Escape commas, quotes, and line breaks according to CSV rules.
- Keep numbered steps inside one cell using `\n` line breaks unless the target system requires `<br>`.

## Excel Export Rules

When the user requests an `.xlsx` file:

- Use one sheet per app or module unless the user requests a single sheet.
- Freeze the header row.
- Enable text wrapping for `测试步骤` and `预期结果`.
- Keep the canonical field order.

## Numbering Rules

- Default format: `[AppID]-[ModuleID]-TC-[三位序号]`.
- Use one sequence per module.
- Do not reuse numbers in the same generated batch.
- If the user provides an existing maximum number, continue from the next number.
- If App ID or Module ID is missing, use a clear placeholder such as `APP` or `MOD` and note it in `备注`.

## Example Output

| 编号 | 式样书 | 测试模块 | 用例名称 | 前置条件 | 测试步骤 | 预期结果 | 用例类型 | 优先级 | 测试数据 | 适用端 | 需求/功能ID | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MALL-LOGIN-TC-001 | 示例商城式样书 v1.0 / 2.1 登录 | 登录 | 已注册手机号使用正确验证码登录成功 | 测试账号已注册；短信验证码模拟值为 123456；用户未登录。 | 1. 打开手机号登录页。<br>2. 输入手机号 `13800000001`。<br>3. 点击获取验证码。<br>4. 输入验证码 `123456`。<br>5. 点击登录。 | 1. 登录页正常展示。<br>2. 手机号输入成功。<br>3. 验证码发送成功或显示已发送。<br>4. 验证码输入成功。<br>5. 登录成功并跳转到进入登录页前的页面，页面展示登录用户信息。 | 正向 | P0 | 手机号 `13800000001`；验证码 `123456` | Web / H5 | LOGIN-001 | 无 |
