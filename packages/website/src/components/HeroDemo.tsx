import { Component } from '@geajs/core'
import { GeaFlow, createFlowStore, Background, type FlowStore } from '@gea-flow/core'

const heroStore = createFlowStore({
  nodes: [
    { id: '1', position: { x: 60, y: 60 }, data: { label: 'INPUT' } },
    { id: '2', position: { x: 60, y: 220 }, data: { label: 'TRANSFORM' } },
    { id: '3', position: { x: 320, y: 60 }, data: { label: 'VALIDATE' } },
    { id: '4', position: { x: 320, y: 220 }, data: { label: 'PERSIST' } },
    { id: '5', position: { x: 580, y: 140 }, data: { label: 'OUTPUT' } },
  ],
  edges: [
    { id: 'e1', source: '1', target: '3', type: 'smoothstep', animated: true },
    { id: 'e2', source: '1', target: '4', type: 'smoothstep' },
    { id: 'e3', source: '2', target: '3', type: 'smoothstep' },
    { id: 'e4', source: '2', target: '4', type: 'smoothstep', animated: true },
    { id: 'e5', source: '3', target: '5', type: 'smoothstep', animated: true },
    { id: 'e6', source: '4', target: '5', type: 'smoothstep' },
  ],
})

/**
 * Hero showcase: live GeaFlow with cyberpunk-styled nodes/edges.
 * Uses fitView on init so the graph is centered regardless of canvas width.
 */
export default class HeroDemo extends Component {
  onInit = (store: FlowStore) => {
    // Defer one frame so node measurements settle before computing the bbox.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => store.fitView({ padding: 0.67 }))
    })
  }

  template() {
    return (
      <div class="hero__demo">
        <GeaFlow store={heroStore} onInit={this.onInit}>
          <Background variant="dots" gap={24} color="rgba(34, 211, 238, 0.18)" />
        </GeaFlow>
      </div>
    )
  }
}
