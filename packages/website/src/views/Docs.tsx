import { Component } from '@geajs/core'

interface Section { id: string; label: string }
interface Group { title: string; items: Section[] }

const groups: Group[] = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'installation', label: 'Installation' },
      { id: 'quick-start', label: 'Quick Start' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { id: 'easy-vs-power', label: 'Easy vs Power mode' },
      { id: 'flow-store', label: 'FlowStore' },
      { id: 'callbacks', label: 'Callbacks' },
      { id: 'reactivity', label: 'Reactivity model' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { id: 'geaflow-props', label: 'GeaFlow props' },
      { id: 'flowstore-api', label: 'FlowStore API' },
      { id: 'node-props', label: 'NodeProps' },
      { id: 'edge-props', label: 'EdgeProps' },
    ],
  },
  {
    title: 'Components',
    items: [
      { id: 'background', label: 'Background' },
      { id: 'controls', label: 'Controls' },
      { id: 'minimap', label: 'MiniMap' },
      { id: 'handle', label: 'Handle' },
    ],
  },
  {
    title: 'Customization',
    items: [
      { id: 'custom-nodes', label: 'Custom nodes' },
      { id: 'custom-edges', label: 'Custom edges' },
      { id: 'edge-types', label: 'Built-in edge types' },
      { id: 'styling', label: 'Styling' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'keyboard', label: 'Keyboard & pointer' },
      { id: 'troubleshooting', label: 'Troubleshooting' },
    ],
  },
]

// Code samples are kept as module-level constants because the Gea compiler
// parses JSX-like brace expressions inside template literals embedded directly
// in JSX trees, which would crash on samples like `<GeaFlow nodes={nodes} />`.
const CODE_INSTALL = `npm install @gea-flow/core @geajs/core
npm install -D @geajs/vite-plugin`

const CODE_VITE = `// vite.config.ts
import { defineConfig } from 'vite'
import { geaPlugin } from '@geajs/vite-plugin'

export default defineConfig({
  plugins: [geaPlugin()],
  optimizeDeps: {
    exclude: ['@geajs/core', '@geajs/core/compiler-runtime', '@gea-flow/core'],
  },
})`

const CODE_QUICK_START = `import { Component } from '@geajs/core'
import { GeaFlow, Background, Controls } from '@gea-flow/core'
import '@gea-flow/core/styles.css'

const nodes = [
  { id: 'a', position: { x: 80, y: 60 },  data: { label: 'Welcome' } },
  { id: 'b', position: { x: 80, y: 200 }, data: { label: 'Sign Up' } },
  { id: 'c', position: { x: 320, y: 130 }, data: { label: 'Verify Email' } },
]
const edges = [
  { id: 'eab', source: 'a', target: 'b' },
  { id: 'ebc', source: 'b', target: 'c' },
]

export default class App extends Component {
  template() {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <GeaFlow nodes={nodes} edges={edges}>
          <Background variant="dots" />
          <Controls />
        </GeaFlow>
      </div>
    )
  }
}`

const CODE_EASY = `<GeaFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={(n) => console.log(n)}
/>`

const CODE_POWER = `import { createFlowStore, GeaFlow } from '@gea-flow/core'

export const flow = createFlowStore({
  nodes: [/* ... */],
  edges: [/* ... */],
})

// Anywhere in your app:
flow.addNodes([{ id: 'x', position: { x: 0, y: 0 }, data: { label: 'New' } }])
flow.fitView({ padding: 0.2 })

// In your template:
<GeaFlow store={flow}>
  <Background />
  <Controls />
</GeaFlow>`

const CODE_FLOWSTORE_CREATE = `import { createFlowStore } from '@gea-flow/core'

const flow = createFlowStore({
  nodes: [],
  edges: [],
  defaultViewport: { x: 0, y: 0, zoom: 1 },
  minZoom: 0.5,
  maxZoom: 2,
})`

const CODE_REACTIVITY = `flow.nodes[0].position = { x: 200, y: 100 }   // node moves on screen
flow.transform = [50, 50, 1.2]                 // viewport pans + zooms
flow.edges = flow.edges.filter((e) => e.id !== 'eab')  // edge disappears`

const CODE_FLOWSTORE_STATE = `flow.nodes              // GeaNode[]
flow.edges              // GeaEdge[]
flow.transform          // [x, y, zoom]
flow.connection         // active drag-to-connect state
flow.handleBoundsByNode // measured handle bounds`

const CODE_FLOWSTORE_MUTATIONS = `flow.setNodes(nodes)
flow.addNodes(nodes)
flow.setEdges(edges)
flow.addEdges(edges)
flow.updateNodePosition(id, { x, y })
flow.findNode(id)`

const CODE_FLOWSTORE_SELECTION = `flow.selectNode(id, { multi: true })
flow.selectEdge(id)
flow.selectAllNodes()
flow.clearSelection()
flow.deleteSelected()`

const CODE_FLOWSTORE_CONNECT = `flow.connect({ source, target, sourceHandle, targetHandle })`

const CODE_FLOWSTORE_VIEWPORT = `flow.zoomIn()
flow.zoomOut()
flow.setViewport({ x, y, zoom })
flow.fitView({ padding: 0.1, maxZoom: 2 })`

const CODE_NODE_PROPS = `interface NodeProps<TData = Record<string, unknown>> {
  id: string
  data: TData
  selected: boolean
  dragging: boolean
  type: string
  node: GeaNode<TData>   // raw mutable reference
}`

const CODE_EDGE_PROPS = `interface EdgeProps<TData = Record<string, unknown>> {
  id: string
  source: string
  target: string
  sourceX: number; sourceY: number
  targetX: number; targetY: number
  sourcePosition: Position
  targetPosition: Position
  selected: boolean
  animated: boolean
  label?: string | number | null
  defaultPath: string  // computed bezier path; useful for hit-area
  labelX: number; labelY: number
  data?: TData
}`

const CODE_BACKGROUND = `<GeaFlow nodes={nodes} edges={edges}>
  <Background variant="dots" gap={24} color="rgba(34, 211, 238, 0.18)" />
</GeaFlow>`

const CODE_CONTROLS = `<GeaFlow store={flow}>
  <Controls showZoom showFit />
</GeaFlow>`

const CODE_MINIMAP = `<GeaFlow store={flow}>
  <MiniMap width={200} height={150} nodeColor="#cbd5e1" />
</GeaFlow>

// Or with a per-node color function:
<MiniMap nodeColor={(n) => n.data.kind === 'sink' ? '#f472b6' : '#22d3ee'} />`

const CODE_HANDLE = `<Handle type="target" position={Position.Top} />
<Handle type="source" position={Position.Bottom} id="primary" />
<Handle type="source" position={Position.Right}  id="secondary" />`

const CODE_CUSTOM_NODE = `import { Handle, Position, type NodeProps } from '@gea-flow/core'

interface StatusData extends Record<string, unknown> {
  title: string
  status: 'idle' | 'running' | 'done' | 'error'
}

export function StatusNode({ data, selected }: NodeProps<StatusData>) {
  return (
    <div class={\`status-node status-node--\${data.status} \${selected ? 'selected' : ''}\`}>
      <Handle type="target" position={Position.Top} />
      <strong>{data.title}</strong>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = { status: StatusNode }

<GeaFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} />`

const CODE_CUSTOM_EDGE = `import type { EdgeProps } from '@gea-flow/core'

export function HighlightEdge(props: EdgeProps) {
  return (
    <>
      {/* invisible hit-area for selection */}
      <path class="gea-flow__edge-hit" d={props.defaultPath} stroke="transparent" stroke-width="20" fill="none" />
      <path d={props.defaultPath} stroke="url(#highlight-gradient)" stroke-width={2} fill="none" />
      {props.label != null && (
        <text x={props.labelX} y={props.labelY} text-anchor="middle">{props.label}</text>
      )}
    </>
  )
}

const edgeTypes = { highlight: HighlightEdge }`

const CODE_EDGE_TYPES = `const edges = [
  { id: 'e1', source: 'a', target: 'b' },                                       // bezier
  { id: 'e2', source: 'b', target: 'c', type: 'smoothstep' },
  { id: 'e3', source: 'c', target: 'd', type: 'step', animated: true, label: 'next' },
]`

const CODE_STYLES_IMPORT = `import '@gea-flow/core/styles.css'`

const CODE_CLASSNAMES = `{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Hi' }, className: 'my-node my-node--primary' }
{ id: 'e1', source: '1', target: '2', className: 'my-edge my-edge--critical' }`

export default class Docs extends Component {
  activeId = 'introduction'

  template() {
    return (
      <main class="docs-page">
        <aside class="docs-sidebar">
          <div class="docs-sidebar__inner">
            {groups.map((g) => (
              <div class="docs-sidebar__group" key={g.title}>
                <div class="docs-sidebar__title">{g.title}</div>
                {g.items.map((it) => (
                  <a
                    key={it.id}
                    class={`docs-sidebar__link ${this.activeId === it.id ? 'docs-sidebar__link--active' : ''}`}
                    href={`#${it.id}`}
                    click={this.onLinkClick}
                    data-section={it.id}
                  >
                    {it.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <article class="docs-content">
          <header class="docs-hero">
            <div class="docs-hero__eyebrow">Documentation</div>
            <h1 class="docs-hero__title">Build node editors with <span class="accent">gea-flow</span></h1>
            <p class="docs-hero__sub">
              Drag-and-drop graphs with full Gea reactivity. Compiled-first, no virtual DOM,
              multi-instance native.
            </p>
          </header>

          <section id="introduction" class="docs-section">
            <h2>Introduction</h2>
            <p>
              <code>gea-flow</code> is a node editor library for the{' '}
              <a class="docs__link" href="https://geajs.com" target="_blank" rel="noopener">Gea framework</a>,
              built as a thin adapter on top of{' '}
              <a class="docs__link" href="https://github.com/xyflow/xyflow" target="_blank" rel="noopener"><code>@xyflow/system</code></a>{' '}
              — the framework-agnostic core that powers React Flow and Svelte Flow.
            </p>
            <p>
              You get draggable nodes, connectable handles, pan/zoom, multi-select, lasso, a minimap,
              and customizable rendering — while staying fully reactive with Gea's compile-time bindings.
            </p>

            <div class="docs-cards">
              <div class="docs-card">
                <div class="docs-card__icon">⚡</div>
                <div class="docs-card__title">Compile-first</div>
                <div class="docs-card__body">No virtual DOM, no diffing — Gea patches DOM directly.</div>
              </div>
              <div class="docs-card">
                <div class="docs-card__icon">⌘</div>
                <div class="docs-card__title">Multi-instance</div>
                <div class="docs-card__body">Drop multiple flows on a page; each owns its own state.</div>
              </div>
              <div class="docs-card">
                <div class="docs-card__icon">◇</div>
                <div class="docs-card__title">Custom everything</div>
                <div class="docs-card__body">Bring your own node and edge components — function or class.</div>
              </div>
            </div>
          </section>

          <section id="installation" class="docs-section">
            <h2>Installation</h2>
            <p>
              <code>@geajs/core</code> is a peer dependency. If you scaffold a new Gea app you'll also
              need <code>@geajs/vite-plugin</code>.
            </p>
            <pre class="docs-code"><code>{CODE_INSTALL}</code></pre>

            <h3>Vite configuration</h3>
            <p>
              Gea's compiler runtime resolves modules at build time, so exclude its packages from
              Vite's prebundling:
            </p>
            <pre class="docs-code"><code>{CODE_VITE}</code></pre>
          </section>

          <section id="quick-start" class="docs-section">
            <h2>Quick Start</h2>
            <p>
              Drop a flow into your app with a few nodes and edges. Don't forget to import the
              stylesheet — and remember the parent needs an explicit width and height.
            </p>
            <pre class="docs-code"><code>{CODE_QUICK_START}</code></pre>
          </section>

          <section id="easy-vs-power" class="docs-section">
            <h2>Easy vs Power mode</h2>
            <p>There are two ways to drive a flow.</p>

            <h3>Easy mode — pass arrays as props</h3>
            <p>Best for static or small flows. <code>GeaFlow</code> creates an internal store for you.</p>
            <pre class="docs-code"><code>{CODE_EASY}</code></pre>

            <h3>Power mode — bring your own store</h3>
            <p>
              When you want to mutate the flow from outside (toolbars, side panels, async events),
              create a store and pass it in.
            </p>
            <pre class="docs-code"><code>{CODE_POWER}</code></pre>
            <p class="docs-callout">
              The store is a plain class (not a Gea <code>Store</code>) — you can keep it as a property
              on any other component or store without losing reactivity.
            </p>
          </section>

          <section id="flow-store" class="docs-section">
            <h2>FlowStore</h2>
            <p>
              <code>FlowStore</code> is the source of truth for everything on the canvas: nodes, edges,
              viewport transform, selection, drag config, callbacks. Mutations are synchronous and the
              canvas updates reactively.
            </p>
            <pre class="docs-code"><code>{CODE_FLOWSTORE_CREATE}</code></pre>
          </section>

          <section id="callbacks" class="docs-section">
            <h2>Callbacks</h2>
            <p>All callbacks are optional and pass through the same names you'd expect from React Flow.</p>
            <table class="docs-table">
              <thead>
                <tr><th>Prop</th><th>Signature</th><th>Fires when</th></tr>
              </thead>
              <tbody>
                <tr><td><code>onInit</code></td><td><code>(store) =&gt; void</code></td><td>Once after mount, with the resolved store.</td></tr>
                <tr><td><code>onConnect</code></td><td><code>(connection) =&gt; void</code></td><td>User drags a new edge between handles.</td></tr>
                <tr><td><code>onNodesChange</code></td><td><code>(nodes) =&gt; void</code></td><td>Nodes array mutates.</td></tr>
                <tr><td><code>onEdgesChange</code></td><td><code>(edges) =&gt; void</code></td><td>Edges array mutates.</td></tr>
                <tr><td><code>onSelectionChange</code></td><td><code>(summary) =&gt; void</code></td><td>Selection changes.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="reactivity" class="docs-section">
            <h2>Reactivity model</h2>
            <p>
              Mutating any reactive field updates the canvas — no manual re-render call needed.
              Gea's proxy-based stores observe property writes and patch only the DOM that depends
              on them.
            </p>
            <pre class="docs-code"><code>{CODE_REACTIVITY}</code></pre>
            <p class="docs-callout">
              For arrays, prefer index-assignment (<code>arr[i] = next</code>) over <code>splice</code> —
              the proxy notices index writes more reliably than mutating helpers.
            </p>
          </section>

          <section id="geaflow-props" class="docs-section">
            <h2>GeaFlow props</h2>
            <table class="docs-table">
              <thead>
                <tr><th>Prop</th><th>Type</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>store</code></td><td><code>FlowStore</code></td><td>Power mode: external store you control.</td></tr>
                <tr><td><code>nodes</code></td><td><code>GeaNode[]</code></td><td>Easy mode: initial nodes.</td></tr>
                <tr><td><code>edges</code></td><td><code>GeaEdge[]</code></td><td>Easy mode: initial edges.</td></tr>
                <tr><td><code>nodeTypes</code></td><td><code>Record</code></td><td>Custom node renderers, keyed by <code>node.type</code>.</td></tr>
                <tr><td><code>edgeTypes</code></td><td><code>Record</code></td><td>Custom edge renderers, keyed by <code>edge.type</code>.</td></tr>
                <tr><td><code>minZoom</code></td><td><code>number</code></td><td>Default <code>0.5</code>.</td></tr>
                <tr><td><code>maxZoom</code></td><td><code>number</code></td><td>Default <code>2</code>.</td></tr>
                <tr><td><code>defaultViewport</code></td><td><code>Viewport</code></td><td>Initial viewport transform.</td></tr>
                <tr><td><code>onInit</code></td><td><code>(store) =&gt; void</code></td><td>See <a class="docs__link" href="#callbacks">Callbacks</a>.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="flowstore-api" class="docs-section">
            <h2>FlowStore API</h2>
            <h3>Reactive state</h3>
            <pre class="docs-code"><code>{CODE_FLOWSTORE_STATE}</code></pre>
            <h3>Mutations</h3>
            <pre class="docs-code"><code>{CODE_FLOWSTORE_MUTATIONS}</code></pre>
            <h3>Selection</h3>
            <pre class="docs-code"><code>{CODE_FLOWSTORE_SELECTION}</code></pre>
            <h3>Connections</h3>
            <pre class="docs-code"><code>{CODE_FLOWSTORE_CONNECT}</code></pre>
            <h3>Viewport</h3>
            <pre class="docs-code"><code>{CODE_FLOWSTORE_VIEWPORT}</code></pre>
          </section>

          <section id="node-props" class="docs-section">
            <h2>NodeProps</h2>
            <p>Custom node components receive these props:</p>
            <pre class="docs-code"><code>{CODE_NODE_PROPS}</code></pre>
          </section>

          <section id="edge-props" class="docs-section">
            <h2>EdgeProps</h2>
            <p>Custom edge components receive these props:</p>
            <pre class="docs-code"><code>{CODE_EDGE_PROPS}</code></pre>
          </section>

          <section id="background" class="docs-section">
            <h2>Background</h2>
            <p>Tiling pattern that follows the viewport's pan/zoom. Place inside the flow container.</p>
            <pre class="docs-code"><code>{CODE_BACKGROUND}</code></pre>
            <table class="docs-table">
              <thead><tr><th>Prop</th><th>Type</th><th>Default</th></tr></thead>
              <tbody>
                <tr><td><code>variant</code></td><td><code>'dots' | 'cross' | 'lines'</code></td><td><code>'dots'</code></td></tr>
                <tr><td><code>gap</code></td><td><code>number</code></td><td><code>20</code></td></tr>
                <tr><td><code>color</code></td><td><code>string</code></td><td><code>'#d8d8d8'</code></td></tr>
                <tr><td><code>size</code></td><td><code>number</code></td><td><code>1</code></td></tr>
              </tbody>
            </table>
          </section>

          <section id="controls" class="docs-section">
            <h2>Controls</h2>
            <p>Floating zoom in / zoom out / fit-view buttons.</p>
            <pre class="docs-code"><code>{CODE_CONTROLS}</code></pre>
            <p>Set <code>showZoom</code> or <code>showFit</code> to <code>false</code> to hide a control.</p>
          </section>

          <section id="minimap" class="docs-section">
            <h2>MiniMap</h2>
            <p>Pannable, zoomable overview map.</p>
            <pre class="docs-code"><code>{CODE_MINIMAP}</code></pre>
          </section>

          <section id="handle" class="docs-section">
            <h2>Handle</h2>
            <p>
              Connection point on a node. Use inside your custom node component. Each handle gets
              a unique <code>type</code> and <code>position</code>; pass an <code>id</code> when a node has multiple handles
              of the same type so edges can target a specific one.
            </p>
            <pre class="docs-code"><code>{CODE_HANDLE}</code></pre>
          </section>

          <section id="custom-nodes" class="docs-section">
            <h2>Custom nodes</h2>
            <p>A custom node is just a Gea component (function or class) that receives <code>NodeProps</code>.</p>
            <pre class="docs-code"><code>{CODE_CUSTOM_NODE}</code></pre>
          </section>

          <section id="custom-edges" class="docs-section">
            <h2>Custom edges</h2>
            <p>Custom edges receive computed source/target coordinates and a default bezier path you can reuse for the hit-area.</p>
            <pre class="docs-code"><code>{CODE_CUSTOM_EDGE}</code></pre>
          </section>

          <section id="edge-types" class="docs-section">
            <h2>Built-in edge types</h2>
            <p>Set <code>edge.type</code> to one of the following, or omit it to use <code>bezier</code>:</p>
            <ul class="docs-list">
              <li><code>bezier</code> — curved bezier path (default)</li>
              <li><code>straight</code> — direct line</li>
              <li><code>step</code> — right-angle path with sharp corners</li>
              <li><code>smoothstep</code> — right-angle path with rounded corners</li>
            </ul>
            <pre class="docs-code"><code>{CODE_EDGE_TYPES}</code></pre>
          </section>

          <section id="styling" class="docs-section">
            <h2>Styling</h2>
            <p>Import the default stylesheet once at your app entry:</p>
            <pre class="docs-code"><code>{CODE_STYLES_IMPORT}</code></pre>
            <p>
              Every element exposes <code>gea-flow__*</code> class names so you can override styles freely.
              Selected nodes and edges receive a <code>.selected</code> class. Animated edges get an
              additional <code>.animated</code> class.
            </p>
            <p>You can also set a per-node or per-edge <code>className</code> for finer control:</p>
            <pre class="docs-code"><code>{CODE_CLASSNAMES}</code></pre>
          </section>

          <section id="keyboard" class="docs-section">
            <h2>Keyboard & pointer</h2>
            <table class="docs-table">
              <thead><tr><th>Action</th><th>Result</th></tr></thead>
              <tbody>
                <tr><td>Click node or edge</td><td>Select</td></tr>
                <tr><td>Shift-click</td><td>Toggle in multi-selection</td></tr>
                <tr><td>Shift-drag on empty canvas</td><td>Lasso selection</td></tr>
                <tr><td>Drag node</td><td>Move (mutates <code>node.position</code>)</td></tr>
                <tr><td>Drag from handle</td><td>Create a new edge</td></tr>
                <tr><td>Scroll / pinch</td><td>Zoom</td></tr>
                <tr><td>Drag empty canvas</td><td>Pan</td></tr>
                <tr><td><kbd>Delete</kbd> / <kbd>Backspace</kbd></td><td>Remove selected nodes and edges</td></tr>
                <tr><td><kbd>Cmd/Ctrl</kbd> + <kbd>A</kbd></td><td>Select all nodes</td></tr>
              </tbody>
            </table>
          </section>

          <section id="troubleshooting" class="docs-section">
            <h2>Troubleshooting</h2>

            <h3>Nothing renders</h3>
            <p>The parent of the flow needs an explicit width and height — the canvas fills its container with absolute positioning.</p>

            <h3>Edges don't follow when nodes drag</h3>
            <p>Make sure you're on <code>@gea-flow/core</code> 0.0.3 or later — earlier versions had a reactivity gap in the edge geometry layer.</p>

            <h3>Can't drag from a handle</h3>
            <p>Custom node components must wait for the next microtask before measuring — the library does this for you. If you wrap the node in a Portal or render it asynchronously, ensure the handle's parent <code>.gea-flow__node</code> ancestor is in the DOM tree before the handle.</p>

            <h3>Vite "Cannot find module" errors</h3>
            <p>Add the Gea packages to <code>optimizeDeps.exclude</code> — see the <a class="docs__link" href="#installation">Installation</a> section.</p>
          </section>

          <footer class="docs-footer">
            <p>
              Found a gap or a bug?{' '}
              <a class="docs__link" href="https://github.com/tutkuofnight/gea-flow/issues" target="_blank" rel="noopener">
                Open an issue
              </a>{' '}
              or browse the{' '}
              <a class="docs__link" href="/examples">live examples</a>.
            </p>
          </footer>
        </article>
      </main>
    )
  }

  onLinkClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('[data-section]')
    if (!a) return
    const id = a.dataset.section
    if (!id) return
    this.activeId = id
    requestAnimationFrame(() => {
      const target = document.getElementById(id)
      if (!target) return
      const headerH = 64
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16
      window.scrollTo({ top, behavior: 'smooth' })
    })
    e.preventDefault()
    history.replaceState(null, '', `#${id}`)
  }

  onAfterRender(): void {
    const hash = window.location.hash.slice(1)
    if (hash && groups.some((g) => g.items.some((it) => it.id === hash))) {
      this.activeId = hash
      requestAnimationFrame(() => {
        const target = document.getElementById(hash)
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - 80
          window.scrollTo({ top, behavior: 'auto' })
        }
      })
    }

    const sections = document.querySelectorAll<HTMLElement>('.docs-section[id]')
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) this.activeId = visible.target.id
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    sections.forEach((s) => obs.observe(s))
  }
}
