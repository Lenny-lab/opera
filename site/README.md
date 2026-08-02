# 数智赋能·戏曲润心

面向新时代文明实践站的戏曲文化共创平台。网站包含戏曲共创、行当导赏、儿童课堂、长者听戏、红色戏曲、文明互鉴与线下微课堂七个场景。

## 本地运行

双击项目根目录的 `启动戏曲平台.bat`，或在项目根目录运行：

```powershell
node scripts/serve_site.js
```

然后访问 `http://127.0.0.1:8765/`。不要直接双击 HTML：在线共创接口和部分浏览器权限需要通过本地服务使用。

## 配置在线共创

模型密钥只允许放在服务端环境变量中，不能写入 HTML 或前端 JavaScript。

```powershell
$env:DEEPSEEK_API_KEY = "你的密钥"
$env:DEEPSEEK_MODEL = "deepseek-v4-flash"
node scripts/serve_site.js
```

未配置密钥时，共创工坊和红色戏曲页面会自动使用本地体验内容，其余页面不受影响。

## Vercel + GitHub 部署

在 Vercel 导入本仓库后使用以下设置：

- Application Preset：`Other`
- Root Directory：`site`
- Build Command：留空
- Output Directory：留空
- Install Command：留空

在 Environment Variables 中添加：

- `DEEPSEEK_API_KEY`：新生成的 DeepSeek 密钥，至少勾选 Production 和 Preview
- `DEEPSEEK_MODEL`：可选，默认 `deepseek-v4-flash`
- `DEEPSEEK_BASE_URL`：可选，默认 `https://api.deepseek.com`

部署后访问 `/api/health`。返回 `{"ok":true,"generation":true}` 代表在线共创接口已就绪。密钥只放在 Vercel 环境变量中，不要使用 `NEXT_PUBLIC_` 等公开前缀，也不要写进 GitHub 文件。

## 页面结构

```text
site/
├── index.html
├── pages/
│   ├── ai-opera.html
│   ├── characters.html
│   ├── kids.html
│   ├── elderly.html
│   ├── red-opera.html
│   ├── exchange.html
│   ├── live.html
│   ├── characters/        # 生、旦、净详情与选段视频
│   ├── genres/            # 京剧、豫剧、越剧、黄梅戏详情与选段视频
│   └── cases/             # 四站实践纪实独立文章页
├── assets/
│   ├── audio/             # A/B/C/D 四组共 14 段栏目音频
│   └── images/cases/      # 案例封面与 DOCX 提取的活动照片
├── data/
├── js/
└── css/style.css
```

## 本地内容与外部视频

- 共创工坊使用 A 组 4 段音频，儿童豫剧四声腔使用 B 组 4 段，长者点戏使用 C 组 4 段，红色戏曲使用 D 组 2 段。
- 首页生旦净丑项目形象仅在首屏安全区活动；移动端每 60 秒轮换一个人物。
- 四站实践文章、照片、动画和 14 段音频均为站内资源，可在本地服务中离线使用。
- 28 条剧目视频按需加载自第三方平台。无法嵌入或断网时，页面保留原始链接入口。
- 运行 `python scripts/integrate_supplemental_assets.py` 可从原始补充文件重新生成部署素材；运行 `python scripts/build_case_pages.py` 可重新生成四篇案例页面。

## 上线前检查

- 使用 HTTPS 部署，保证麦克风权限与剪贴板能力正常。
- 在服务端设置 `DEEPSEEK_API_KEY`，并限制接口调用频率和费用。
- 为全部公开音频与活动照片补齐来源、授权证明、使用期限与署名要求。
- 逐一确认第三方视频页面仍可访问、允许嵌入，并保留跳转原站的后备入口。
- 由戏曲专业指导教师复核生成唱词、行当和程式描述。
- 不使用未经授权的真人面孔、声音或演员表演数据训练数字人物。

## 推荐演示路径

首页项目定位 → 戏曲共创工坊 → 儿童课堂 → 长者听戏 → 红色戏曲 → 文明互鉴 → 线下微课堂。
