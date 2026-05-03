import { Link } from '@geajs/core'
import Logo from './Logo'

export default function Header() {
  return (
    <header class="header">
      <div class="container header__inner">
        <Logo />
        <nav class="nav">
          <Link class="nav__link" to="/">Home</Link>
          <Link class="nav__link" to="/examples">Examples</Link>
          <Link class="nav__link" to="/docs">Docs</Link>
          <a class="btn btn--outlined" href="https://github.com/" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </div>
    </header>
  )
}
