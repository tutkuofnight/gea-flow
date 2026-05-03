# @gea-flow/core

React Flow-style node editor for the [Gea](https://geajs.com) framework.
Compiled-first reactivity, no virtual DOM, multi-instance native.

## Install

```bash
npm install @gea-flow/core
```

## Quick start

```tsx
import { GeaFlow, Background, Controls } from '@gea-flow/core'
import '@gea-flow/core/styles.css'

const nodes = [
  { id: '1', position: { x: 80, y: 60 }, data: { label: 'Input' } },
  { id: '2', position: { x: 320, y: 60 }, data: { label: 'Output' } },
]
const edges = [
  { id: 'e1', source: '1', target: '2', type: 'smoothstep', animated: true },
]

<GeaFlow nodes={nodes} edges={edges}>
  <Background variant="dots" />
  <Controls />
</GeaFlow>
```

## Features

- **Multi-instance** — drop multiple `<GeaFlow />` on a page; each owns its own store, viewport, selection.
- **Custom nodes & edges** — bring your own components; gea-flow mounts them imperatively, reactivity stays intact.
- **XYDrag + auto-pan** — multi-select drag, snap-to-grid, threshold, auto-pan when near edges.
- **Selection box** — Shift+drag a lasso over the canvas to multi-select. Delete to cascade-remove.
- **Background, Controls, MiniMap** — drop-in utilities (dots/cross/lines, fit-view, zoom buttons, overview).
- **Connect via handles** — drag from a source handle to a target handle. `onConnect` fires for your callback.

## Building blocks

| Component / API | Purpose |
| --- | --- |
| `GeaFlow` | Main canvas container |
| `createFlowStore({ nodes, edges, ... })` | Power-mode reactive store you can mutate from outside |
| `Background` | Tiling pattern (dots / cross / lines) |
| `Controls` | Zoom in/out + fit-view buttons |
| `MiniMap` | Pannable / zoomable overview |
| `Handle` | Source / target connection point inside a custom node |

## Peer dependency

This package targets the Gea framework. You need:

```bash
npm install @geajs/core @geajs/vite-plugin
```

Wire `geaPlugin()` in `vite.config.ts` so JSX is compiled.

## License

MIT — see [LICENSE](./LICENSE). Built on top of `@xyflow/system` (MIT); see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
