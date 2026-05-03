import { Component, Link } from '@geajs/core'
import { router } from '../router'
import { examples, findExample } from './examples/registry'

export default class Examples extends Component {
  template() {
    const slug = (router.params as { slug?: string }).slug
    const active = findExample(slug)
    const ActiveComponent = active.Component
    return (
      <main class="examples-page">
        <aside class="examples-sidebar">
          <div class="examples-sidebar__title">Examples</div>
          {examples.map((ex) => (
            <Link
              key={ex.slug}
              to={`/examples/${ex.slug}`}
              class={`examples-sidebar__item ${ex.slug === active.slug ? 'examples-sidebar__item--active' : ''}`}
            >
              <span class="examples-sidebar__tag">{ex.tag}</span>
              <span class="examples-sidebar__name">{ex.title}</span>
              <span class="examples-sidebar__blurb">{ex.blurb}</span>
            </Link>
          ))}
        </aside>
        <section class="examples-stage">
          <div class="examples-stage__head">
            <h1 class="examples-stage__title">{active.title}</h1>
            <p class="examples-stage__blurb">{active.blurb}</p>
          </div>
          <div class="examples-stage__canvas">
            <ActiveComponent />
          </div>
        </section>
      </main>
    )
  }
}
