# 高德地图 API 配置

本文档用于配置地图选点所需的三项环境变量，适用于本地开发和 Cloudflare Pages 线上环境。

## 需要的变量

1. `VITE_AMAP_WEB_KEY`
作用：逆地理编码（把经纬度转为地址）

2. `VITE_AMAP_JS_KEY`
作用：地图 JS SDK 加载和地图交互

3. `VITE_AMAP_SECURITY_CODE`
作用：高德 JS API 安全校验（`securityJsCode`）

## 本地配置

```bash
cp .env.example .env.local
```

在 `.env.local` 中填入：

```bash
VITE_AMAP_WEB_KEY=你的web服务key
VITE_AMAP_JS_KEY=你的js-key
VITE_AMAP_SECURITY_CODE=你的security-js-code
```

重启前端开发服务后生效。

## Cloudflare Pages 配置

在 Pages 项目设置中添加环境变量（Production 与 Preview 分别配置）：

- `VITE_AMAP_WEB_KEY`
- `VITE_AMAP_JS_KEY`
- `VITE_AMAP_SECURITY_CODE`

建议将 Preview 与 Production 使用不同 key，便于额度隔离和风险控制。

## 验收清单

1. 打开地图选点弹窗后地图可正常加载。
2. 点击“定位到我的位置”可获取当前位置。
3. 选择位置后地址信息可自动回填。
4. 控制台中不再出现高德 key/security 相关报错。

## 常见问题

1. 地图空白或加载失败
检查 `VITE_AMAP_JS_KEY` 和 `VITE_AMAP_SECURITY_CODE` 是否匹配同一个高德应用。

2. 能显示地图但无法反查地址
通常是 `VITE_AMAP_WEB_KEY` 未配置或额度不足。

3. 本地生效、线上不生效
确认变量配置在对应环境（Preview/Production），并重新触发部署。
