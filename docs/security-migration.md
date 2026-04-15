# 安全迁移说明

本文档用于把旧版明文密码 + 前端登录态的部署，迁移到当前的服务端会话 + 密码哈希模型。

## 迁移目标

- 管理员密码与应用密码不再明文下发到前端
- 管理接口与写接口必须依赖服务端会话
- 统计接口默认不再匿名开放
- 已有库中的旧 `admin_password` / `app_password` 会在成功登录后自动迁移为哈希

## 部署前准备

1. 备份现有 D1 数据库
2. 备份当前 `app_settings` 表
3. 确认 Cloudflare Pages Functions 已绑定 `DB`

## 必配 Secrets

至少配置以下 secret：

```bash
wrangler secret put SESSION_SECRET
```

建议同时配置：

```bash
wrangler secret put ADMIN_BOOTSTRAP_PASSWORD
wrangler secret put APP_BOOTSTRAP_PASSWORD
wrangler secret put STATS_API_KEY
```

## 数据迁移方式

### 方式一：保留旧数据，登录时自动迁移

适用于已有线上实例。

- 如果 `app_settings` 中仍存在 `admin_password` 或 `app_password`
- 当用户用旧密码成功登录后
- 系统会自动写入 `admin_password_hash` / `app_password_hash`
- 同时删除旧明文字段

### 方式二：通过 bootstrap secret 重置密码

适用于忘记密码或需要主动失效旧密码的场景。

步骤：

1. 配置 `ADMIN_BOOTSTRAP_PASSWORD`
2. 如需同步重置应用访问密码，配置 `APP_BOOTSTRAP_PASSWORD`
3. 执行仓库中的 `reset-password.sql`
4. 使用 bootstrap 密码登录
5. 立即在管理员面板中改成正式密码

## 推荐上线步骤

1. 先配置 `SESSION_SECRET`
2. 执行 `schema.sql` 初始化表结构
3. 部署新版本函数代码
4. 用现有管理员密码登录一次管理员面板，或使用 bootstrap 密码首次登录
5. 在管理员面板中立即修改管理员密码与应用密码
6. 如需外部读取统计数据，再配置 `STATS_API_KEY`
7. 运行自动化检查：`npm test`

## 上线后检查项

1. 访问 `/api/settings` 时不再返回任何密码字段
2. 未登录直接调用写接口应返回 `401`
3. 隐藏日记对访客接口不可见
4. `/api/stats` 在未登录且无 API key 时返回 `401`
5. `app_settings` 表中应只保留哈希字段，不应再保留旧明文字段

## 可选清理 SQL

如果你已确认所有密码都完成迁移，可以手动清理旧字段：

```sql
DELETE FROM app_settings WHERE setting_key IN ('admin_password', 'app_password');
```
