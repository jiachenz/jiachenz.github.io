# jiachenz.github.io

静态个人主页（GitHub Pages）：深色「虚空」背景、径向动线与文字粒子坠入中心；正文区块为半透明磨砂卡片。公开交流通过 **Giscus → GitHub Discussions**，不落自建数据库。

**线上地址：** [https://jiachenz.github.io](https://jiachenz.github.io)（启用 Pages 且推送到默认分支后生效）

---

## 功能概览

| 模块 | 说明 |
|------|------|
| **虚空动效** | CSS 深空 / 黑洞光晕 + SVG 径向动线；`void.js` 用 DOM 粒子沿螺旋轨迹吸入中心 |
| **短句池** | [`data/fragments.json`](data/fragments.json) 配置随机展示句；可编辑权重 |
| **投喂** | 页内输入一句，仅本机动画；可选写入 `localStorage`（本机回味） |
| **公开留言** | [`data/giscus.json`](data/giscus.json) + [`js/load-giscus.js`](js/load-giscus.js) 嵌入 Giscus |
| **无障碍** | `prefers-reduced-motion` 时减弱动效；跳过链接、表单语义与焦点样式 |

虚空里的句子 **不会** 自动同步 Giscus 评论；若要把某条讨论写进背景，请手动把文案加入 `data/fragments.json`。

---

## 目录结构

```
├── index.html           # 页面结构与脚本引用
├── css/
│   ├── main.css         # 排版、磨砂卡片、表单等
│   └── void.css         # 背景层、黑洞、动线、粒子样式
├── js/
│   ├── fragments.js     # 加载 fragments.json、merge localStorage
│   ├── void.js          # 粒子生成与动画节律
│   └── load-giscus.js   # 读取 giscus.json 并注入 Giscus 客户端脚本
└── data/
    ├── fragments.json   # 粒子文案池（JSON 数组，支持 text / weight）
    └── giscus.json      # Giscus 参数（repoId、categoryId 等）
```

---

## 本地预览

在项目根目录执行：

```bash
python -m http.server 8765
```

浏览器打开：`http://127.0.0.1:8765/`

（Giscus 需配置允许的 Origin；本地调试时请在 Giscus / GitHub App 里加入 `http://127.0.0.1:8765`。）

---

## 配置说明

### Giscus（公开留言）

1. 仓库开启 **Discussions**，安装 [Giscus GitHub App](https://github.com/apps/giscus) 并授权本仓库。  
2. 打开 [giscus.app](https://giscus.app/zh-CN)，选择仓库与分类，拿到 **data-repo-id**、**data-category-id**。  
3. 写入 [`data/giscus.json`](data/giscus.json) 的 `repoId`、`categoryId` 等字段，保存并推送。

### Fragments（虚空短句）

编辑 [`data/fragments.json`](data/fragments.json)：

- 每项可为 `{ "text": "……", "weight": 1 }`，`weight` 越大越容易被随机抽到。  
- 仅静态托管；改后推送到 GitHub 即可生效。

### 动效参数（可选）

在 [`js/void.js`](js/void.js) 顶部可调整，例如：

- `SPAWN_INTERVAL_MS`：多久生成一条新粒子  
- `MAX_PARTICLES`：同屏粒子上限  
- `DURATION_MS` / `USER_DURATION_MS`：句子吸入耗时（含用户投喂变体）

---

## 部署（GitHub Pages）

1. 本仓库设为 **User site**（仓库名 `username.github.io`）或 Project Pages 在 Settings → Pages 里指定分支与目录。  
2. 将 `main`（或你的默认分支）根目录作为站点根路径部署。  
3. 确保 **`data/giscus.json`** 中 Discussions 相关 ID 已在生产环境填写完整。

---

## 技术栈

纯静态：**HTML + CSS + 少量原生 JS**，无构建步骤；Giscus 通过 CDN 加载客户端脚本。
