# 数智赋能·戏曲润心

面向新时代文明实践站的戏曲文化共创平台。项目围绕青年共创、儿童启蒙、长者陪伴、红色戏曲、文明互鉴和线下微课堂等场景，让传统戏曲以更自然、更易参与的方式进入社区生活。

## 快速启动

Windows 用户可双击 `启动戏曲平台.bat`，或运行：

```bash
node scripts/serve_site.js
```

浏览器访问 `http://127.0.0.1:8765/`。

未配置在线生成服务时，网站会自动使用本地体验内容。服务端配置、安全边界和上线检查请查看 [site/README.md](site/README.md)。

## Vercel 部署

从 GitHub 导入本仓库时选择 `Other`，将 Root Directory 设置为 `site`，构建、输出和安装命令均留空。若需启用在线共创，在 Vercel 的 Environment Variables 中配置新的 `DEEPSEEK_API_KEY`。详细设置见 [site/README.md](site/README.md)。

## 主要目录

- `site/`：网站页面、样式、交互、图片和音频资源
- `scripts/serve_site.js`：静态站点与生成接口服务
- `scripts/audit_site.py`：页面链接、资源和敏感信息检查
- `scripts/integrate_supplemental_assets.py`：把补充音频、项目 IP 与案例照片归入站点资源
- `scripts/build_case_pages.py`：从四篇原始 DOCX 重新生成线下实践文章页
- `prompts/`：视觉素材生成提示词留档
- `screenshots/`：各版本页面验证截图

## 验证

```bash
node --check scripts/serve_site.js
python scripts/audit_site.py
```

## 公开使用说明

视觉素材由项目组使用生成式工具制作并人工筛选。现有音频用于试点体验，正式公开传播前需逐条补齐版权与授权凭证。在线共创内容属于排演草稿，需由专业指导教师复核。
