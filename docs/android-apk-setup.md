# Android APK 打包

本项目已接入 `Capacitor Android`，可将当前前端构建产物打包为本地可安装的 Android 应用。
默认发布流程只走 GitHub Actions，不依赖本机 Android Studio、Android SDK 或本机 Java 环境。

## 当前行为

- Android 原生应用默认进入本地离线数据模式。
- 本地模式下，日记数据、公开设置和登录状态保存在设备本地，可在无网络环境下使用。
- 正式 APK 默认锁定本地模式，不再暴露“远程 Pages”模式切换。
- 如需联动云端，正式 APK 通过管理员面板里的远程绑定 + 手动同步完成，不走静默自动切换。
- 调试 APK 默认保留数据模式切换，便于本机联调远程 Pages / Functions。
- 如需稳定覆盖安装后续 release 版本，建议配置固定的 Android release keystore；否则 workflow 会回退到 debug 签名，仅保证当前包可安装。

## 推荐发布方式：GitHub Actions

只要仓库里已经提交了 Android 工程，本机就不需要再准备 Android 打包环境。

### Tag 发布

1. 确认要发布的提交已经在目标分支上，例如 `master`
2. 创建并推送一个 APK tag，例如：

```bash
git tag apk-20260418-master
git push origin apk-20260418-master
```

3. GitHub Actions 会自动执行 `.github/workflows/build-android.yml`
4. 工作流会自动：
   - 安装 Node.js 和 Java 21
   - 执行 `npm ci`
   - 默认执行 `npm run android:sync:release`
   - 默认执行 `./gradlew assembleRelease`
   - 上传 APK artifact
   - 自动创建或更新同名 GitHub Release，并把 APK 挂到 Release 资产

### 手动触发

- 也可以在 GitHub Actions 页面手动运行 `Build And Release Android APK`
- 手动触发时可以选择 `release` 或 `debug`
- `debug` 适合联调，会保留数据模式切换
- 手动触发仍只生成 artifact，不会自动创建 GitHub Release

### Release 签名配置

如需让 GitHub Actions 产出可稳定升级覆盖的 release APK，建议在仓库 secrets 中配置：

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

其中 `ANDROID_KEYSTORE_BASE64` 是 release keystore 文件的 base64 内容。

如果这些 secrets 未配置，workflow 仍会构建 release 变体，但会回退到 debug 签名。这样生成的 APK 可以安装，但后续不同构建之间不保证可直接覆盖升级。

## 本地构建说明

仓库不再维护本地 APK 打包命令，也不把本机 Android / Java 环境视为正式发布链路的一部分。

- 如需发布 APK，请统一通过 `.github/workflows/build-android.yml`
- 如需联调 debug 变体，也通过 GitHub Actions 的 `workflow_dispatch` 触发
- `npm run android:sync:*` 仅保留给 CI 使用，用来在构建前同步 Web 资源到 Android 工程

## 调试版远程联动

- Web 端部署仍然使用 Cloudflare Pages / Functions / D1。
- 调试 APK 切换到 `远程 Pages` 模式后，会直接访问线上 API。
- 发布 APK 不再开放模式切换，改为使用管理员面板里的远程绑定和手动同步。
- 如果远端 D1 是旧版本升级上来的数据库，先执行 `migrations/2026-04-18-add-entry-uuid.sql`，再使用新版 APK 做远程绑定和同步；否则旧云端内容的同步兼容性无法保证。
