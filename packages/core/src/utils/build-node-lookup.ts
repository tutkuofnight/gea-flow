import type { Handle, InternalNodeBase, NodeLookup } from '@xyflow/system'
import type { GeaNode, NodeHandleBounds } from '../types'

const DEFAULT_NODE_W = 150
const DEFAULT_NODE_H = 40

/**
 * Cache last (nodes, handleBoundsByNode) → NodeLookup. XYDrag/XYHandle call this
 * on every pointermove during a drag/connect; rebuilding the Map per tick is
 * O(N) work per frame on a 60Hz loop. Reactive store mutations swap these
 * references when they change, so identity comparison is sufficient.
 */
let lastNodes: GeaNode[] | null = null
let lastBounds: Record<string, NodeHandleBounds> | null = null
let lastLookup: NodeLookup | null = null

/**
 * Build the InternalNodeBase Map that XYHandle / XYDrag expect.
 * Our store keeps node data flat; we synthesize the `internals` shape on demand.
 */
export function buildNodeLookup(
  nodes: GeaNode[],
  handleBoundsByNode: Record<string, NodeHandleBounds>,
): NodeLookup {
  if (lastLookup && nodes === lastNodes && handleBoundsByNode === lastBounds) {
    return lastLookup
  }
  const lookup: NodeLookup = new Map()
  for (const node of nodes) {
    const bounds = handleBoundsByNode[node.id]
    const w = node.measured?.width ?? DEFAULT_NODE_W
    const h = node.measured?.height ?? DEFAULT_NODE_H
    const internalNode: InternalNodeBase = {
      ...node,
      type: node.type ?? 'default',
      measured: { width: w, height: h },
      internals: {
        positionAbsolute: { x: node.position.x, y: node.position.y },
        z: node.zIndex ?? 0,
        userNode: node,
        handleBounds: bounds
          ? {
              source: bounds.source ? bounds.source.map((h) => toHandle(h, node.id)) : null,
              target: bounds.target ? bounds.target.map((h) => toHandle(h, node.id)) : null,
            }
          : undefined,
        bounds: { x: node.position.x, y: node.position.y, width: w, height: h },
      },
    } as InternalNodeBase
    lookup.set(node.id, internalNode)
  }
  lastNodes = nodes
  lastBounds = handleBoundsByNode
  lastLookup = lookup
  return lookup
}

function toHandle(
  entry: { id: string | null; type: 'source' | 'target'; position: import('@xyflow/system').Position; x: number; y: number; width: number; height: number },
  nodeId: string,
): Handle {
  return {
    id: entry.id,
    nodeId,
    type: entry.type,
    position: entry.position,
    x: entry.x,
    y: entry.y,
    width: entry.width,
    height: entry.height,
  }
}
