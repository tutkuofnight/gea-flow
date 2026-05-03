import { Link } from '@geajs/core'
import HeroDemo from './HeroDemo'
import InstallCommand from './InstallCommand'

export default function Hero() {
  return (
    <section class="hero">
      <div class="container">
        <h1 class="hero__title">
          <span class="hero__title-cyan">Wire your nodes.</span>
          <br />
          <span class="hero__title-grad">Flow your data.</span>
        </h1>
        <p class="hero__subtitle">
          A <span class="highlight">node-based editor</span> for the{' '}
          <a class="hero__subtitle-link" href="https://geajs.com" target="_blank" rel="noopener">Gea framework</a>.
          React Flow-style ergonomics, compiled-first reactivity, no virtual DOM.
        </p>
        <div class="hero__install">
          <InstallCommand />
        </div>
        <div class="hero__actions">
          <Link class="btn btn--solid btn--lg" to="/docs">Get Started</Link>
          <Link class="btn btn--outlined btn--lg" to="/examples">View Examples</Link>
        </div>

        <HeroDemo />

        <div class="stats">
          <div class="stat">
            <div class="stat__value">0</div>
            <div class="stat__label">Virtual DOM</div>
          </div>
          <div class="stat">
            <div class="stat__value">∞</div>
            <div class="stat__label">Instances per page</div>
          </div>
          <div class="stat">
            <div class="stat__value">9 KB</div>
            <div class="stat__label">Gzipped (estimate)</div>
          </div>
        </div>
      </div>
    </section>
  )
}
