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
│   └── live.html
├── assets/
├── data/
├── js/
└── css/style.css
```

## 上线前检查

- 使用 HTTPS 部署，保证麦克风权限与剪贴板能力正常。
- 在服务端设置 `DEEPSEEK_API_KEY`，并限制接口调用频率和费用。
- 为全部公开音频补齐来源、授权证明、使用期限与署名要求。
- 由戏曲专业指导教师复核生成唱词、行当和程式描述。
- 不使用未经授权的真人面孔、声音或演员表演数据训练数字人物。

## 推荐演示路径

首页项目定位 → 戏曲共创工坊 → 儿童课堂 → 长者听戏 → 红色戏曲 → 文明互鉴 → 线下微课堂。
