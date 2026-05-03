import { Component } from '@geajs/core'

export default class Docs extends Component {
  template() {
    return (
      <main class="docs-page">
      <div class="container">
        <h1 class="docs__title">
          Documentation <span class="accent">(coming soon)</span>
        </h1>
        <p class="docs__sub">
          The full API reference is being written. For now, the README and the live{' '}
          <a class="docs__link" href="/examples">Examples</a> are the best place to start.
        </p>
        <div class="docs__grid">
          <div class="feature-card">
            <h3 class="feature-card__title">Quick start</h3>
            <pre class="docs__code">npm install @gea-flow/core</pre>
            <pre class="docs__code">{`import { GeaFlow } from '@gea-flow/core'
import '@gea-flow/core/styles.css'

<GeaFlow nodes={nodes} edges={edges} />`}</pre>
          </div>
          <div class="feature-card">
            <h3 class="feature-card__title">Core building blocks</h3>
            <ul class="docs__list">
              <li><code>GeaFlow</code> — main container</li>
              <li><code>Background</code> — dots / cross / lines</li>
              <li><code>Controls</code> — zoom & fit-view buttons</li>
              <li><code>MiniMap</code> — overview map</li>
              <li><code>Handle</code> — connection point on a node</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
    )
  }
}
