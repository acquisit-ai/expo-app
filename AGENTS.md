# My Word App

主体文件全部移动到了 ./history/下, 包括 graphify 相关文件, 主要作为历史参考来重构

## graphify

This project keeps separate graphify knowledge graphs under `.graphify/`.

Rules:

- App architecture, FSD layering, state flow, UI theme, and entity/code questions:
  read `.graphify/src/graphify-out/GRAPH_REPORT.md` first
- Documentation, protocol, analysis, and design note questions:
  read `.graphify/docs/graphify-out/GRAPH_REPORT.md` first
- `video-scroll` prototype, scroll window, and player experiment questions:
  read `.graphify/video-scroll/graphify-out/GRAPH_REPORT.md` first
- If a corresponding `graph.html` or `graph.json` exists under that same directory, use it as the secondary source
- `src/`, `docs/`, and `video-scroll/` are each allowed to be processed as one whole graphify corpus, even when file count exceeds the default 200-file guard
- After modifying `src/**`, update the `src` graph only
- After modifying `docs/**`, update the `docs` graph only
- After modifying `video-scroll/**`, update the `video-scroll` graph only

## 1. 项目概览

- **愿景：** 创建一个帮助用户学习和记忆单词的多媒体移动应用。
- **当前阶段：** 初始开发阶段 - 基础架构已搭建
- **核心架构：** Feature-Sliced Design (FSD)

## 2. 项目结构

必须先阅读[项目结构文档](/docs/ai-context/project-structure.md)，了解完整的技术栈、文件树和项目组织方式。

本应用严格遵循 **Feature-Sliced Design (FSD)** 架构原则，如有需要可参考 docs/human-context/FeatureSlicedDesign.md

- 最高优先级要求：当你进行任何实现的时候先思考或查找有没有库和框架已经实现了该需求，避免过度设计或重复造轮子！
- 最高优先级要求：禁止使用 any 类型，尽可能多地搜索 context7 获得库的最新用法和最佳实践！！！
- 主题尽量使用 React native paper 和定义好的 src/shared/config/theme，不要硬编码
- 我们的项目还是初版，所以重构或者修改不用考虑向后兼容性，但是一定的向前兼容是可以的。

### 技术栈

- **框架**: React Native, Expo
- **状态管理**: Zustand
- **数据请求**: TanStack Query
- **数据库与 ORM**: Drizzle ORM
- **UI**: React Native Paper 主题系统

完整的技术栈和文件树结构，请参见[docs/ai-context/project-structure.md](/docs/ai-context/project-structure.md)。
