---
name: app-test-case-generator
description: Generate standardized software test cases from app feature descriptions, PRD/spec references, acceptance criteria, templates, and QA rules. Use when the user wants AI to create manual test cases for one or more apps with consistent fields such as case ID, specification, module, case name, preconditions, steps, expected results, priority, and test type.
---

# App Test Case Generator

Use this skill to generate consistent manual test cases for a selected app or feature from the filled reference templates.

## Workflow

1. Identify the target app, feature, version, platform, and requested output format from the user request.
2. Read `references/app-feature-catalog.md` and find the matching app and feature section.
3. Read `references/output-template.md` for the canonical field order, numbering rules, and output format.
4. Read `references/generation-rules.md` for coverage rules, quality gates, and priority definitions.
5. If the requested app or feature is missing, ask the user for the missing source material instead of inventing product behavior.
6. Draft a test coverage matrix before writing cases when the feature has multiple flows, roles, states, or validation rules.
7. Generate test cases using the canonical fields and keep wording concise, executable, and observable.
8. Self-check the output against the quality gates in `generation-rules.md`.

## Source Rules

- Treat filled app references as the source of truth.
- Do not fabricate hidden business rules, UI controls, roles, API constraints, or data states that are not present in the references or user request.
- Mark reasonable assumptions in the `备注` field when an assumption is necessary.
- Prefer concrete test data over vague phrases such as "valid data" or "invalid data".
- Keep each case focused on one behavior or risk.
- Split long end-to-end flows into smaller cases unless the output template asks for scenario-level cases.

## Default Output

Use the canonical table from `references/output-template.md` unless the user requests Excel, CSV, JSON, Gherkin, TestRail import, Jira/Xray import, or another format.

Required fields:

`编号 | 式样书 | 测试模块 | 用例名称 | 前置条件 | 测试步骤 | 预期结果 | 用例类型 | 优先级 | 测试数据 | 适用端 | 需求/功能ID | 备注`

## Coverage Expectations

Generate cases across these categories when applicable:

- 正向流程
- 反向流程
- 边界值
- 必填/格式/长度校验
- 权限/角色/登录状态
- 状态流转
- 异常/错误提示
- 数据保存、刷新、回显、同步
- 网络异常、接口失败、超时、重试
- 兼容性、平台差异、国际化或时区
- 埋点、通知、消息、日志或审计

## Before Finalizing

Check that:

- Every case has a clear precondition, action, and observable expected result.
- The generated cases map back to a feature ID, requirement ID, or specification name where available.
- Positive, negative, boundary, permission, and state cases are represented when relevant.
- Numbering follows the selected app/module prefix.
- Step numbers and expected results align one-to-one when that format is used.
- Output does not include implementation guesses that are absent from the source material.

## Maintaining This Skill

Fill these files over time:

- `references/app-feature-catalog.md`: add all apps, modules, features, roles, rules, and acceptance criteria.
- `references/output-template.md`: adjust columns, numbering, export formats, and examples.
- `references/generation-rules.md`: adjust coverage strategy, priority definitions, and quality gates.
- `references/example-input.md`: keep realistic examples that show how future users should provide source material.
