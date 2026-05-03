import type { NodeTypes } from '../types'
import DefaultNode from './DefaultNode'

/** Built-ins are merged with user-supplied nodeTypes; user wins on conflict. */
export const BUILTIN_NODE_TYPES: NodeTypes = {
  default: DefaultNode as never,
}
