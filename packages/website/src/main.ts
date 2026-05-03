import App from './App'
import { RouterView } from '@geajs/core'
// keep RouterView reachable: the gea-plugin inlines App's template into main.ts
// but doesn't carry App.tsx's named imports across the boundary.
void RouterView
import './styles/theme.css'
import './styles/site.css'
import './styles/examples.css'
import '@gea-flow/core/styles.css'

const app = new App()
app.render(document.getElementById('app')!)
