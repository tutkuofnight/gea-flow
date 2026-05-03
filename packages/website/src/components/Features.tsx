interface FeatureItem {
  title: string
  body: string
  icon: string
}

const features: FeatureItem[] = [
  {
    title: 'Multi-instance native',
    body: 'Drop multiple <GeaFlow /> on a page. Each owns its own store, viewport, selection — fully isolated.',
    icon: '⌘',
  },
  {
    title: 'Custom nodes & edges',
    body: 'Bring your own components. Pure function or class — gea-flow mounts them imperatively, reactivity stays intact.',
    icon: '◇',
  },
  {
    title: 'XYDrag + auto-pan',
    body: 'Multi-select drag, snap-to-grid, threshold, auto-pan when near edges. Powered by xyflow/system.',
    icon: '↔',
  },
  {
    title: 'Selection box',
    body: 'Shift-drag a lasso over the canvas to multi-select. Delete to cascade-remove nodes and their edges.',
    icon: '▢',
  },
  {
    title: 'Background, Controls, MiniMap',
    body: 'Drop-in cyberpunk-friendly utilities. Variants for dots / cross / lines patterns, fit-view, zoom buttons.',
    icon: '◉',
  },
  {
    title: 'Connect via handles',
    body: 'Drag from a source handle to a target handle. Strict mode validates source→target. onConnect fires for your callback.',
    icon: '⚡',
  },
]

export default function Features() {
  return (
    <section class="features" id="features">
      <div class="container">
        <h2 class="section__title">
          Everything you need <span class="accent">out of the box</span>
        </h2>
        <p class="section__sub">
          The core package ships with all the primitives — nothing to configure to ship a working flow editor.
        </p>
        <div class="feature-grid">
          {features.map((f) => (
            <div class="feature-card" key={f.title}>
              <div class="feature-card__icon">{f.icon}</div>
              <h3 class="feature-card__title">{f.title}</h3>
              <p class="feature-card__body">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
