# DDL Atlas CN

把 [ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines) 的公开会议数据呈现为年度投稿甘特图，支持年份、CCF A/B/C 等级、研究领域与关键词筛选。

## 更新会议数据

```bash
git -C work/ccf-deadlines pull
ruby work/build_conference_data.rb
```

## 发布到 GitHub Pages

将本项目推送到 GitHub 仓库的 `main` 分支，在仓库 **Settings → Pages → Build and deployment** 中将 Source 设为 **GitHub Actions**。之后每次推送都会自动构建和发布。

本地构建 GitHub Pages 静态版：

```bash
pnpm run build:github
```

数据由 CCFDDL 社区维护，仅供参考；所有日期应以会议官网为准。
