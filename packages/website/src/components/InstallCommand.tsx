import { Component } from '@geajs/core'

const COMMAND = 'npm install @gea-flow/core'

export default class InstallCommand extends Component {
  copied = false

  template() {
    return (
      <div class="install-cmd nopan nodrag">
        <span class="install-cmd__prompt">$</span>
        <code class="install-cmd__text">{COMMAND}</code>
        <button
          class={`install-cmd__btn ${this.copied ? 'install-cmd__btn--copied' : ''}`}
          aria-label="Copy install command"
          click={this.onCopy}
        >
          {this.copied ? 'copied' : 'copy'}
        </button>
      </div>
    )
  }

  onCopy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = COMMAND
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* noop */ }
      document.body.removeChild(ta)
    }
    this.copied = true
    setTimeout(() => { this.copied = false }, 1600)
  }
}
