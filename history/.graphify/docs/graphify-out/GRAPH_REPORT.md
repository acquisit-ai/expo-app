# Graph Report - docs  (2026-04-17)

## Corpus Check
- 52 files · ~54,933 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 80 nodes · 113 edges · 9 communities detected
- Extraction: 89% EXTRACTED · 10% INFERRED · 1% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.81)
- Token cost: 7,700 input · 3,100 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Class Component Function Component|Class Component Function Component]]
- [[_COMMUNITY_docs ai context project structure|docs ai context project structure]]
- [[_COMMUNITY_docs CONTEXT navigation interaction patterns|docs CONTEXT navigation interaction patterns]]
- [[_COMMUNITY_api human context|api human context]]
- [[_COMMUNITY_modal|modal]]
- [[_COMMUNITY_Modal Animation Modal Stack|Modal Animation Modal Stack]]
- [[_COMMUNITY_docs analysis collections page plan|docs analysis collections page plan]]
- [[_COMMUNITY_architecture human context|architecture human context]]
- [[_COMMUNITY_docs analysis fullscreen autoplay logic|docs analysis fullscreen autoplay logic]]

## God Nodes (most connected - your core abstractions)
1. `modalfy api readme` - 12 edges
2. `withModal docs` - 6 edges
3. `createModalStack docs` - 6 edges
4. `useModal docs` - 6 edges
5. `ModalProvider docs` - 6 edges
6. `ModalProp docs` - 6 edges
7. `docs/README.md` - 5 edges
8. `docs/ai-context/docs-overview.md` - 5 edges
9. `modalfy docs` - 5 edges
10. `ModalComponentProp docs` - 4 edges

## Surprising Connections (you probably didn't know these)
- `docs/analysis/autoplay-conditional-logic.md` --extends_same_autoplay_problem_space_with_solution_options--> `docs/analysis/fullscreen-autoplay-logic.md`  [INFERRED]
  docs/analysis/autoplay-conditional-logic.md → docs/analysis/fullscreen-autoplay-logic.md
- `modalfy api readme` --links_to--> `createModalStack docs`  [EXTRACTED]
  docs/modal/API/README.md → docs/modal/API/createModalStack.md
- `modalfy api readme` --links_to--> `ModalProvider docs`  [EXTRACTED]
  docs/modal/API/README.md → docs/modal/API/ModalProvider.md
- `modalfy api readme` --links_to--> `ModalOptions docs`  [EXTRACTED]
  docs/modal/API/README.md → docs/modal/API/types/ModalOptions.md
- `modalfy api readme` --links_to--> `ModalStackConfig docs`  [EXTRACTED]
  docs/modal/API/README.md → docs/modal/API/types/ModalStackConfig.md

## Hyperedges (group relationships)
- **Documentation system core** — n2, n3, n4, n5, n19, n20, n21, n22, n27 [INFERRED 0.97]
- **Tier1 architecture references** — n6, n7, n9, n10, n11, n12, n20, n24, n25, n26, n28 [INFERRED 0.95]
- **Navigation and playback analysis cluster** — n1, n8, n14, n17, n18, n23, n30, n33, n34 [INFERRED 0.94]
- **Saved feed and standalone video planning cluster** — n13, n15, n16, n29, n31, n32 [INFERRED 0.94]
- **hyper:api-protocols** — file:docs/api/subtitle-api-protocol.md, file:docs/api/video-favorite-api-protocol.md, file:docs/api/video-meta-api-protocol.md, file:docs/api/http-status-codes.md, file:docs/api/feed-api-protocol.md, file:docs/api/video-like-api-protocol.md [INFERRED 0.70]
- **hyper:architecture-analysis** — file:docs/architecture/final-refactoring-analysis.md, file:docs/architecture/refactoring-correctness-analysis-v5.md, file:docs/architecture/video-player-sync-refactoring.md, file:docs/human-context/FeatureSlicedDesign.md, file:docs/human-context/three-layer-architecture.md [INFERRED 0.70]
- **hyper:modal-docs** — file:docs/modal/README.md, file:docs/modal/getting started.md, file:docs/modal/Creating a stack.md, file:docs/modal/Opening & closing.md, file:docs/modal/Passing params.md, file:docs/modal/Subscribing to events.md, file:docs/modal/Triggering a callback.md, file:docs/modal/Type checking with TypeScript.md [INFERRED 0.70]
- **hyper:human-context** — file:docs/human-context/FeatureSlicedDesign.md, file:docs/human-context/library.md, file:docs/human-context/supabase.md, file:docs/human-context/three-layer-architecture.md, file:docs/human-context/ui.md [INFERRED 0.70]
- **hyperedge:modal-api-surface** — file:docs/modal/API/ModalProvider.md, file:docs/modal/API/createModalStack.md, file:docs/modal/API/useModal.md, file:docs/modal/API/withModal.md, file:docs/modal/API/modalfy.md, file:docs/modal/API/README.md [INFERRED 0.99]
- **hyperedge:modal-type-system** — file:docs/modal/API/types/ModalComponentProp.md, file:docs/modal/API/types/ModalProps.md, file:docs/modal/API/types/ModalComponentWithOptions.md, file:docs/modal/API/types/ModalStackConfig.md, file:docs/modal/API/types/ModalOptions.md, file:docs/modal/API/types/ModalProp.md [INFERRED 0.99]
- **hyperedge:react-usage-guidance** — file:docs/modal/API/useModal.md, file:docs/modal/API/withModal.md, file:docs/modal/API/modalfy.md, concept:function-component, concept:class-component, concept:react-context [INFERRED 0.98]

## Communities

### Community 0 - "Class Component Function Component"
Cohesion: 0.21
Nodes (17): Class Component, Function Component, HOC API, Hook API, Modal Params, Modal Types, React Context, Static API (+9 more)

### Community 1 - "docs ai context project structure"
Cohesion: 0.16
Nodes (14): docs/ai-context/project-structure.md, docs/ai-context/session-sync-analysis.md, docs/analysis/screen-orientation-issue.md, tier1 foundational architecture docs, cross-component system integration guide, project architecture source of truth, session sync event mapping, deployment and infrastructure placeholder baseline (+6 more)

### Community 2 - "docs CONTEXT navigation interaction patterns"
Cohesion: 0.25
Nodes (11): docs/CONTEXT-navigation-interaction-patterns.md, docs/ai-context/handoff.md, three-tier documentation system, docs/CONTEXT-tier2-component.md, tier2 component context template, tier3 feature context template, navigation-aware focus interaction pattern, documentation maintenance and handoff (+3 more)

### Community 3 - "api human context"
Cohesion: 0.5
Nodes (0): 

### Community 4 - "modal"
Cohesion: 0.25
Nodes (0): 

### Community 5 - "Modal Animation Modal Stack"
Cohesion: 0.43
Nodes (7): Modal Animation, Modal Stack, Provider Stack, ModalProvider docs, createModalStack docs, ModalOptions docs, ModalStackConfig docs

### Community 6 - "docs analysis collections page plan"
Cohesion: 0.33
Nodes (6): docs/analysis/collections-page-plan.md, docs/analysis/saved-feed-module-plan.md, docs/analysis/standalone-video-plan.md, collections page implementation plan, saved feed shared module plan, standalone video playback plan

### Community 7 - "architecture human context"
Cohesion: 0.53
Nodes (0): 

### Community 8 - "docs analysis fullscreen autoplay logic"
Cohesion: 1.0
Nodes (3): docs/analysis/fullscreen-autoplay-logic.md, docs/analysis/autoplay-conditional-logic.md, fullscreen autoplay and conditional autoplay analysis

## Ambiguous Edges - Review These
- `docs/ai-context/deployment-infrastructure.md` → `deployment and infrastructure placeholder baseline`  [AMBIGUOUS]
  docs/ai-context/deployment-infrastructure.md · relation: contains_large_placeholder_sections

## Knowledge Gaps
- **3 isolated node(s):** `docs/CONTEXT-tier2-component.md`, `docs/CONTEXT-tier3-feature.md`, `docs/analysis/saved-feed-module-plan.md`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `docs/ai-context/deployment-infrastructure.md` and `deployment and infrastructure placeholder baseline`?**
  _Edge tagged AMBIGUOUS (relation: contains_large_placeholder_sections) - confidence is low._
- **Why does `modalfy api readme` connect `Class Component Function Component` to `Modal Animation Modal Stack`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `docs/README.md` connect `docs CONTEXT navigation interaction patterns` to `docs ai context project structure`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `docs/ai-context/docs-overview.md` connect `docs CONTEXT navigation interaction patterns` to `docs ai context project structure`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `docs/CONTEXT-tier2-component.md`, `docs/CONTEXT-tier3-feature.md`, `docs/analysis/saved-feed-module-plan.md` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._