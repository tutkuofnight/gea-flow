import { Component } from '@geajs/core'
import { GeaFlow, Background, Controls, MiniMap } from '@gea-flow/core'
import '@gea-flow/core/styles.css'
import { pipelineStore } from './store'
import StatusNode from './StatusNode'
import HighlightEdge from './HighlightEdge'

const onboardingNodes = [
  { id: 'a', position: { x: 80, y: 60 }, data: { label: 'Welcome' } },
  { id: 'b', position: { x: 80, y: 200 }, data: { label: 'Sign Up' } },
  { id: 'c', position: { x: 320, y: 130 }, data: { label: 'Verify Email' } },
]
const onboardingEdges = [
  { id: 'eab', source: 'a', target: 'b' },
  { id: 'ebc', source: 'b', target: 'c' },
]

const pipelineNodeTypes = { status: StatusNode }
const pipelineEdgeTypes = { highlight: HighlightEdge }

const STATUS_CYCLE = ['idle', 'running', 'done', 'error'] as const
type Status = (typeof STATUS_CYCLE)[number]

export default class App extends Component {
  setLast(testid: string, label: string): void {
    const el = document.querySelector(`[data-testid="${testid}"]`)
    if (el) el.textContent = label
  }

  onPipelineConnect = (c: { source: string; target: string }) => {
    this.setLast('event-connect', `${c.source} → ${c.target}`)
  }
  onPipelineSelectionChange = ({ nodes, edges }: { nodes: { id: string }[]; edges: { id: string }[] }) => {
    this.setLast(
      'event-selection',
      `nodes=[${nodes.map((n) => n.id).join(',')}] edges=[${edges.map((e) => e.id).join(',')}]`,
    )
  }

  addPipelineNode = () => {
    const idx = pipelineStore.nodes.length + 1
    pipelineStore.addNodes([
      {
        id: String(idx),
        type: 'status',
        position: { x: 80 + idx * 30, y: 320 },
        data: { title: `Step ${idx}`, subtitle: 'newly added', status: 'idle' as Status },
      },
    ])
  }

  cycleFirstNodeStatus = () => {
    const first = pipelineStore.nodes[0]
    if (!first) return
    const data = first.data as { status: Status }
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(data.status) + 1) % STATUS_CYCLE.length]
    pipelineStore.nodes[0] = {
      ...first,
      data: { ...(first.data as object), status: next },
    } as typeof first
  }

  template() {
    return (
      <div class="app">
        <header class="app__bar">
          <strong>gea-flow demo</strong>
          <span class="app__hint">
            Two flows · click to select · Shift+click multi · Delete to remove ·
            right pane uses a custom <code>status</code> node type
          </span>
          <span class="app__event">
            sel: <span data-testid="event-selection">—</span>
            {' '}· conn: <span data-testid="event-connect">—</span>
          </span>
        </header>
        <div class="app__grid">
          <section class="app__pane">
            <div class="app__pane-header">
              <span>Easy mode (built-in default node)</span>
            </div>
            <div class="app__pane-canvas" data-testid="pane-onboarding">
              <GeaFlow nodes={onboardingNodes} edges={onboardingEdges}>
                <Background variant="dots" />
                <Controls />
              </GeaFlow>
            </div>
          </section>
          <section class="app__pane">
            <div class="app__pane-header">
              <span>Power mode + custom node type</span>
              <span class="app__pane-actions">
                <button class="app__pane-btn nopan nodrag" click={this.cycleFirstNodeStatus} data-testid="cycle-status">
                  Cycle status
                </button>
                <button class="app__pane-btn nopan nodrag" click={this.addPipelineNode} data-testid="add-node">
                  Add node
                </button>
              </span>
            </div>
            <div class="app__pane-canvas" data-testid="pane-pipeline">
              <GeaFlow
                store={pipelineStore}
                nodeTypes={pipelineNodeTypes}
                edgeTypes={pipelineEdgeTypes}
                onConnect={this.onPipelineConnect}
                onSelectionChange={this.onPipelineSelectionChange}
              >
                <Background variant="cross" gap={28} color="#cfcfcf" />
                <Controls />
                <MiniMap />
              </GeaFlow>
            </div>
          </section>
        </div>
      </div>
    )
  }
}
