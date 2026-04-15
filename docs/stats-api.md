# 日记统计 API 文档

## 概述

统计接口用于返回日记总数、记录天数、连续记录天数和起止时间。

## 接口信息

- 接口地址: `/api/stats`
- 请求方法: `GET`
- 返回格式: `JSON`
- 认证要求: 必须满足以下其一
  - 已登录的管理员会话
  - 有效的 `STATS_API_KEY`
- CORS 支持: 允许跨域读取，但跨域场景只能使用 API Key
- 缓存策略: 返回 `Cache-Control: no-store`

## 成功响应

```json
{
  "success": true,
  "data": {
    "consecutive_days": 7,
    "total_days_with_entries": 25,
    "total_entries": 42,
    "latest_entry_date": "2024-01-15T10:30:00.000Z",
    "first_entry_date": "2023-12-01T08:15:00.000Z",
    "current_streak_start": "2024-01-09"
  }
}
```

## 失败响应

```json
{
  "success": false,
  "error": "访问被拒绝",
  "message": "需要管理员会话或有效的统计 API 密钥"
}
```

## API Key 传递方式

支持两种方式：

1. `Authorization: Bearer YOUR_API_KEY`
2. `X-API-Key: YOUR_API_KEY`

## 部署建议

- 通过 `wrangler secret put STATS_API_KEY` 配置统计密钥
- 如果不配置 `STATS_API_KEY`，则该接口只允许管理员登录后访问
- 不建议把统计接口开放给匿名请求

## 示例

```ts
fetch('/api/stats', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
  },
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log(data.data);
    }
  });
```
