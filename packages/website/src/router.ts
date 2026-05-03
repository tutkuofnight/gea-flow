import { createRouter } from '@geajs/core'
import Home from './views/Home'
import Examples from './views/Examples'
import Docs from './views/Docs'

export const router = createRouter({
  '/': Home,
  '/examples': Examples,
  '/examples/:slug': Examples,
  '/docs': Docs,
} as const)
