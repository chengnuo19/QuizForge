<div align="center">

# ✳ QuizForge

**把 Markdown 题库变成可交互测验的笔记本式学习应用**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-可安装-5BB974?style=flat-square&logo=googlechrome&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Tests](https://img.shields.io/badge/测试-68个通过-brightgreen?style=flat-square&logo=vitest&logoColor=white)](./src)
[![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)](./LICENSE)

[🌐 在线体验](https://zingy-baklava-cda6f7.netlify.app/) · [📖 Markdown 格式](#markdown-题目格式) · [GitHub](https://github.com/chengnuo19/QuizForge)

</div>

---

## 📖 项目介绍

QuizForge 是一个**纯前端、无需后端**的刷题 PWA。你只需要用 Markdown 写好题目和答案，上传到笔记本，就能立刻开始可交互的测验。数据全部存在本地浏览器，不需要账号，不需要服务器。

**为什么做这个？** 市面上的刷题网站题库固定、无法自定义。QuizForge 让你把课本例题、错题集、考研真题——任何内容——变成属于自己的动态题库。

---

## ✨ 核心功能

### 📚 笔记本系统
- **笔记本首页**：题库按笔记本分组，卡片式展示（可自定义图标 + 配色）
- **内置笔记本**：`content/` 文件夹下的子目录自动成为只读笔记本，随仓库发布
- **自建笔记本**：浏览器内创建、编辑、删除笔记本，上传或粘贴 Markdown 即可添加题目
- **URL 路由**：视图状态写进 hash（`#book=…`、`#play=…`），刷新不丢失当前页面

### 🧠 间隔重复复习（SRS）
- 内置 **SM-2 算法**，根据你的答对率自动调整下次复习时间
- 首页显示当日待复习卡片数量，一键进入复习模式
- 统计仪表盘：新卡 / 学习中 / 复习中 / 已掌握的分布

### 🎯 答题体验
| 功能 | 说明 |
|------|------|
| 题型 | 单选、多选、判断题 |
| 键盘操作 | `1-9` / `A-Z` 选择，`Enter` 提交，方向键移动焦点 |
| 即时反馈 | 选错高亮正确答案 + 逐项详解 |
| LaTeX 公式 | `$...$` 行内，`$$...$$` 块级，由 KaTeX 渲染 |
| 进度持久化 | 自动续答，关掉再开不丢进度 |
| 错题重练 | 结束后一键「重练错题」，仅用错题再来一轮 |

### 📊 统计与导出
- **成绩历史**：记录每次答题的得分与用时，显示进步趋势（↑↓）
- **多格式导出错题**：Markdown（含「你选了 B，正确答案为 A」标注）、Anki CSV、Quizlet 文本
- **分享链接**：把整份测验压缩进 URL（`#q=…`），发给别人直接打开，无需服务器

### 🌟 其他
- 🌙 深色 / 浅色主题（记忆选择）
- 📱 移动端适配（触摸友好，窄屏单列布局）
- 📲 PWA 可安装：首页「安装应用」按钮，支持离线使用
- ♿ ARIA 无障碍：选项为 radio/checkbox，支持键盘完整操作

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + Vite 5 |
| 样式 | 纯 CSS（自定义设计系统，暖色调） |
| 公式渲染 | KaTeX |
| Markdown 解析 | react-markdown + remark-gfm + remark-math |
| SRS 算法 | SM-2（自研实现） |
| 数据存储 | localStorage（纯客户端，零后端） |
| PWA | vite-plugin-pwa + Workbox |
| 测试 | Vitest + Testing Library（68 个测试） |
| 部署 | Netlify |

---

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/chengnuo19/QuizForge.git
cd QuizForge

# 安装依赖
npm install

# 本地开发（访问 http://localhost:5173）
npm run dev

# 运行测试
npm test

# 生产构建
npm run build
```

---

## 📝 Markdown 题目格式

把下面的 Markdown 文件上传到 QuizForge，就能自动生成测验：

```markdown
---
title: 排序算法
shuffle: true    # 可选，打乱题序与选项顺序
---

## 快速排序的平均时间复杂度是？

- [ ] $O(n)$
  线性时间只有桶排序等特殊情况才能达到。
- [x] $O(n \log n)$
  快排平均划分均匀时为 $O(n \log n)$，是对比排序的理论下界。
- [ ] $O(n^2)$
  这是最坏情况（每次选到最大/最小元素作为 pivot）。

> Explain: 快排通过分治将数组分成两部分递归排序。选好 pivot 是关键。

## 以下哪些是稳定排序？（多选）

- [x] 归并排序
- [ ] 快速排序
- [x] 冒泡排序
- [ ] 堆排序
```

**格式规则：**
- 每道题用 `## 题目文字` 开头
- `- [ ]` 表示选项，`- [x]` 标记正确答案（多个 `[x]` = 多选题）
- 选项下方缩进的文字 = 该选项的单独详解
- `> Explain:` 开头的引用块 = 整题讲解
- 支持 LaTeX 公式、GFM 表格、代码块等

---

## 📁 项目结构

```
QuizForge/
├── content/              # 内置笔记本（按文件夹分组）
│   ├── 数据结构与算法/
│   └── 计算机网络/
├── public/               # 静态资源（PWA 图标）
├── src/
│   ├── components/       # React 组件
│   │   ├── Library.jsx       # 首页笔记本列表
│   │   ├── BookDetail.jsx    # 笔记本详情
│   │   ├── QuizPlayer.jsx    # 答题播放器
│   │   ├── SrsSession.jsx    # SRS 复习模式
│   │   └── StatsView.jsx     # 统计仪表盘
│   ├── hooks/
│   │   └── usePwaInstall.js  # PWA 安装引导 hook
│   ├── quiz/             # 核心逻辑
│   │   ├── parseQuiz.js      # Markdown 题目解析器
│   │   ├── books.js          # 笔记本数据管理
│   │   ├── srs.js            # SM-2 间隔重复算法
│   │   ├── router.js         # hash 路由
│   │   └── exportQuiz.js     # 多格式导出
│   └── styles/           # 设计系统（CSS 变量 + 组件样式）
└── vite.config.js        # Vite + PWA 配置
```

---

## 📄 License

MIT © 2025 [chengnuo19](https://github.com/chengnuo19)
