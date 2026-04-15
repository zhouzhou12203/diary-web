# 图片上传配置（Cloudflare Images）

本文档用于把前端图片上传接入 Cloudflare Images，适用于 Cloudflare Pages Functions。

## 1. 所需配置

1. Secret（必填）
- `IMAGES_API_TOKEN`

2. 环境变量（必填）
- `IMAGES_ACCOUNT_ID`

3. 环境变量（可选）
- `IMAGES_DELIVERY_URL`
- `IMAGES_VARIANT`（默认 `public`）

## 2. Token 权限建议

创建一个最小权限 API Token，至少包含：
- Account scope
- Cloudflare Images: Edit（或等价可上传权限）

## 3. 本地/线上配置方式

### Wrangler Secret

```bash
wrangler secret put IMAGES_API_TOKEN
```

### Pages 环境变量

在 Cloudflare Pages 的 Production / Preview 环境分别设置：

- `IMAGES_ACCOUNT_ID`
- `IMAGES_VARIANT`（可选，默认 `public`）
- `IMAGES_DELIVERY_URL`（可选）

## 4. 地址返回规则

1. 如果配置了 `IMAGES_DELIVERY_URL`，后端返回：
`{IMAGES_DELIVERY_URL}/{imageId}/{IMAGES_VARIANT}`

2. 如果未配置 `IMAGES_DELIVERY_URL`，后端使用 Cloudflare API 返回的 `variants` 首项或匹配项。

## 5. 验收步骤

1. 管理员登录。
2. 新建日记并上传 1 张图片。
3. 保存后刷新页面，图片仍能正常访问。
4. 校验接口：`POST /api/uploads/image` 未登录应返回 401。

## 6. 常见问题

1. 返回“图片上传功能未配置”
检查 `IMAGES_ACCOUNT_ID` 和 `IMAGES_API_TOKEN` 是否都已配置。

2. 返回 Cloudflare 上传失败
通常是 token 权限不足、账号不匹配或配额问题。

3. 上传成功但图片无法打开
优先检查 `IMAGES_DELIVERY_URL` 是否正确；不确定时先移除该变量让系统使用默认 `variants`。
