import { Component } from '@geajs/core'
import { findFlowStoreForElement } from './GeaFlow'
import type { FlowStore } from '../store/FlowStore'

interface ControlsProps {
  showZoom?: boolean
  showFit?: boolean
}

/**
 * Floating zoom in / zoom out / fit-view buttons. Place inside <GeaFlow>:
 *   <GeaFlow>
 *     <Controls />
 *   </GeaFlow>
 */
export default class Controls extends Component<ControlsProps> {
  rootEl: HTMLDivElement | null = null
  flowStore: FlowStore | null = null

  template() {
    // Compiler reads props directly (destructured defaults aren't honored), so
    // we render unconditionally and rely on explicit `false` to hide a control.
    return (
      <div ref={this.rootEl as never} class="gea-flow__controls nopan nodrag">
        {this.props.showZoom !== false && (
          <button class="gea-flow__controls-btn" aria-label="Zoom in" data-action="zoom-in">
            +
          </button>
        )}
        {this.props.showZoom !== false && (
          <button class="gea-flow__controls-btn" aria-label="Zoom out" data-action="zoom-out">
            −
          </button>
        )}
        {this.props.showFit !== false && (
          <button class="gea-flow__controls-btn" aria-label="Fit view" data-action="fit-view">
            ⊡
          </button>
        )}
      </div>
    )
  }

  onAfterRender(): void {
    if (!this.rootEl) return
    // Defer: when used as a child of <GeaFlow>, our root may not yet be in the
    // flow's subtree (mounted via the Outlet pattern), so findFlowStoreForElement
    // returns null on the immediate render.
    queueMicrotask(() => {
      if (!this.rootEl) return
      this.flowStore = findFlowStoreForElement(this.rootEl)
    })
    // Gea's event delegation only wires `click=` on the component root; child
    // buttons don't get bound. Attach DOM listeners imperatively instead.
    this.rootEl.addEventListener('click', this.onButtonClick)
  }

  onButtonClick = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-action]')
    if (!btn || !this.flowStore) return
    switch (btn.dataset.action) {
      case 'zoom-in':
        this.flowStore.zoomIn()
        break
      case 'zoom-out':
        this.flowStore.zoomOut()
        break
      case 'fit-view':
        this.flowStore.fitView()
        break
    }
  }

  dispose(): void {
    this.rootEl?.removeEventListener('click', this.onButtonClick)
    super.dispose()
  }
}
