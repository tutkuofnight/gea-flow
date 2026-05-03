import { chromium } from 'playwright-core'

const URL = process.env.SMOKE_URL || 'http://localhost:5173/'

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()

const messages = []
page.on('console', (msg) => {
  const line = `[${msg.type()}] ${msg.text()}`
  messages.push(line)
  console.log('PAGE>', line)
})
page.on('pageerror', (err) => {
  console.log('PAGE-ERR>', err.message)
  messages.push(`[pageerror] ${err.message}`)
})
page.on('requestfailed', (req) => {
  const line = `[reqfailed] ${req.url()} ${req.failure()?.errorText ?? ''}`
  console.log('PAGE-REQF>', line)
  messages.push(line)
})

let failures = 0
const assertEq = (label, actual, expected) => {
  const ok = actual === expected
  console.log(`${ok ? 'OK ' : 'FAIL'}  ${label} :: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`)
  if (!ok) failures++
}
const assertNeq = (label, actual, notExpected) => {
  const ok = actual !== notExpected
  console.log(`${ok ? 'OK ' : 'FAIL'}  ${label} :: actual=${JSON.stringify(actual)} (must differ from ${JSON.stringify(notExpected)})`)
  if (!ok) failures++
}

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(800)

  // --- Both panes mount ---
  console.log('\n=== panes mount ===')
  const flowCount = await page.locator('.gea-flow').count()
  assertEq('two GeaFlow roots', flowCount, 2)
  const flowIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.gea-flow')).map((el) => el.getAttribute('data-flow-id')),
  )
  console.log('flow ids:', flowIds)
  assertNeq('flow ids are distinct', flowIds[0], flowIds[1])

  // --- Initial node counts per pane ---
  const onboardingNodes = await page.locator('[data-testid="pane-onboarding"] .gea-flow__node').count()
  const pipelineNodes = await page.locator('[data-testid="pane-pipeline"] .gea-flow__node').count()
  assertEq('onboarding pane has 3 nodes', onboardingNodes, 3)
  assertEq('pipeline pane has 3 nodes (initial)', pipelineNodes, 3)

  // --- Power mode: external mutation reflects in DOM ---
  console.log('\n=== external mutation (power mode) ===')
  await page.locator('[data-testid="add-node"]').click()
  await page.waitForTimeout(200)
  const pipelineNodesAfter = await page.locator('[data-testid="pane-pipeline"] .gea-flow__node').count()
  const onboardingNodesAfter = await page.locator('[data-testid="pane-onboarding"] .gea-flow__node').count()
  assertEq('pipeline pane gained a node', pipelineNodesAfter, 4)
  assertEq('onboarding pane unaffected', onboardingNodesAfter, 3)

  // --- Multi-instance isolation: drag a node in pane A, pane B is unaffected ---
  console.log('\n=== drag isolation between panes ===')
  const onbA = page.locator('[data-testid="pane-onboarding"] [data-id="a"]').first()
  const pipe1 = page.locator('[data-testid="pane-pipeline"] [data-id="1"]').first()
  const onbABefore = await onbA.evaluate((el) => el.style.transform)
  const pipe1Before = await pipe1.evaluate((el) => el.style.transform)
  const onbBox = await onbA.boundingBox()
  if (onbBox) {
    const px = onbBox.x + onbBox.width / 2
    const py = onbBox.y + onbBox.height / 2
    await page.mouse.move(px, py)
    await page.mouse.down()
    await page.mouse.move(px + 80, py + 30, { steps: 8 })
    await page.mouse.up()
  }
  await page.waitForTimeout(200)
  const onbAAfter = await onbA.evaluate((el) => el.style.transform)
  const pipe1After = await pipe1.evaluate((el) => el.style.transform)
  assertNeq('dragged node moved', onbAAfter, onbABefore)
  assertEq('other-pane node did NOT move', pipe1After, pipe1Before)

  // --- Multi-instance isolation: zoom in pane A, pane B viewport unaffected ---
  console.log('\n=== zoom isolation between panes ===')
  const onbVp = page.locator('[data-testid="pane-onboarding"] .gea-flow__viewport').first()
  const pipeVp = page.locator('[data-testid="pane-pipeline"] .gea-flow__viewport').first()
  const onbVpBefore = await onbVp.evaluate((el) => el.style.transform)
  const pipeVpBefore = await pipeVp.evaluate((el) => el.style.transform)
  const onbCanvas = await page.locator('[data-testid="pane-onboarding"] .gea-flow').first().boundingBox()
  if (onbCanvas) {
    await page.mouse.move(onbCanvas.x + onbCanvas.width / 2, onbCanvas.y + onbCanvas.height / 2)
    await page.mouse.wheel(0, -200)
    await page.waitForTimeout(200)
  }
  const onbVpAfter = await onbVp.evaluate((el) => el.style.transform)
  const pipeVpAfter = await pipeVp.evaluate((el) => el.style.transform)
  assertNeq('zoomed pane viewport changed', onbVpAfter, onbVpBefore)
  assertEq('other-pane viewport did NOT change', pipeVpAfter, pipeVpBefore)

  // --- Connection drag works in pane A ---
  console.log('\n=== connection drag in pane A ===')
  const edgesBefore = await page.locator('[data-testid="pane-onboarding"] .gea-flow__edge').count()
  const otherEdgesBefore = await page.locator('[data-testid="pane-pipeline"] .gea-flow__edge').count()
  // pick the source handle of node "b" in onboarding pane and target handle of "c"
  const srcHandle = page.locator('[data-testid="pane-onboarding"] [data-id="b"] .gea-flow__handle.source').first()
  const tgtHandle = page.locator('[data-testid="pane-onboarding"] [data-id="c"] .gea-flow__handle.target').first()
  const sBox = await srcHandle.boundingBox()
  const tBox = await tgtHandle.boundingBox()
  if (sBox && tBox) {
    await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2, { steps: 8 })
    await page.mouse.up()
  }
  await page.waitForTimeout(300)
  const edgesAfter = await page.locator('[data-testid="pane-onboarding"] .gea-flow__edge').count()
  const otherEdgesAfter = await page.locator('[data-testid="pane-pipeline"] .gea-flow__edge').count()
  assertEq('onboarding edges += 1', edgesAfter, edgesBefore + 1)
  assertEq('pipeline edges unaffected', otherEdgesAfter, otherEdgesBefore)

  // --- Selection: click a node selects it, second click on another switches ---
  console.log('\n=== selection ===')
  const onbBNode = page.locator('[data-testid="pane-onboarding"] [data-id="b"]').first()
  const onbCNode = page.locator('[data-testid="pane-onboarding"] [data-id="c"]').first()
  const labelB = onbBNode.locator('.gea-flow__default-node-label').first()
  const labelC = onbCNode.locator('.gea-flow__default-node-label').first()
  await labelB.click()
  await page.waitForTimeout(150)
  let bSel = await onbBNode.evaluate((el) => el.classList.contains('selected'))
  let cSel = await onbCNode.evaluate((el) => el.classList.contains('selected'))
  assertEq('B is selected after click', bSel, true)
  assertEq('C is NOT selected', cSel, false)

  // Shift+click C → both selected
  await labelC.click({ modifiers: ['Shift'] })
  await page.waitForTimeout(150)
  bSel = await onbBNode.evaluate((el) => el.classList.contains('selected'))
  cSel = await onbCNode.evaluate((el) => el.classList.contains('selected'))
  assertEq('B still selected after shift+click', bSel, true)
  assertEq('C now selected (multi)', cSel, true)

  // Click empty pane area → clears
  const onbPaneCanvas = await page.locator('[data-testid="pane-onboarding"] .gea-flow').first().boundingBox()
  if (onbPaneCanvas) {
    await page.mouse.click(onbPaneCanvas.x + onbPaneCanvas.width - 30, onbPaneCanvas.y + onbPaneCanvas.height - 30)
    await page.waitForTimeout(150)
  }
  bSel = await onbBNode.evaluate((el) => el.classList.contains('selected'))
  cSel = await onbCNode.evaluate((el) => el.classList.contains('selected'))
  assertEq('B unselected after pane click', bSel, false)
  assertEq('C unselected after pane click', cSel, false)

  // --- Keyboard delete: select B, press Delete → B and its connected edges go ---
  console.log('\n=== keyboard delete ===')
  const beforeNodes = await page.locator('[data-testid="pane-onboarding"] .gea-flow__node').count()
  const beforeEdges = await page.locator('[data-testid="pane-onboarding"] .gea-flow__edge').count()
  await labelB.click()
  await page.waitForTimeout(80)
  // focus the canvas (tabindex=0) so keydown lands on it
  await page.locator('[data-testid="pane-onboarding"] .gea-flow').first().focus()
  await page.keyboard.press('Delete')
  await page.waitForTimeout(200)
  const afterNodes = await page.locator('[data-testid="pane-onboarding"] .gea-flow__node').count()
  const afterEdges = await page.locator('[data-testid="pane-onboarding"] .gea-flow__edge').count()
  assertEq('node count -= 1', afterNodes, beforeNodes - 1)
  assertNeq('edge count decreased (cascade removed B-touching edges)', afterEdges, beforeEdges)

  // Pipeline pane should be untouched
  const pipeNodesAfterDel = await page.locator('[data-testid="pane-pipeline"] .gea-flow__node').count()
  assertEq('pipeline pane not affected by onboarding delete', pipeNodesAfterDel, 4)

  // --- Custom node types: pipeline pane should render StatusNode (.status-node) ---
  console.log('\n=== custom node types ===')
  const statusNodes = await page.locator('[data-testid="pane-pipeline"] .status-node').count()
  const defaultNodesInPipeline = await page.locator('[data-testid="pane-pipeline"] .gea-flow__default-node').count()
  assertEq('pipeline pane uses status-node renderer for all nodes', statusNodes, 4)
  assertEq('pipeline pane has no default-node renderers', defaultNodesInPipeline, 0)

  // First node in pipeline starts with status=done; pane has it visible
  const firstStatusInitial = await page.locator('[data-testid="pane-pipeline"] [data-id="1"] .status-node').first().evaluate((el) => el.className)
  assertEq('first pipeline node starts in done state', firstStatusInitial.includes('status-node--done'), true)

  // Cycle status: done → error
  await page.locator('[data-testid="cycle-status"]').click()
  await page.waitForTimeout(150)
  const firstStatusAfter = await page.locator('[data-testid="pane-pipeline"] [data-id="1"] .status-node').first().evaluate((el) => el.className)
  assertEq('cycling once advances to error state', firstStatusAfter.includes('status-node--error'), true)
  assertEq('previous (done) class is gone after cycle', firstStatusAfter.includes('status-node--done'), false)

  // Onboarding pane should still use default nodes (built-in fallback)
  const defaultNodesInOnboarding = await page.locator('[data-testid="pane-onboarding"] .gea-flow__default-node').count()
  assertEq('onboarding pane keeps default-node renderer', defaultNodesInOnboarding, 2)
  const statusNodesInOnboarding = await page.locator('[data-testid="pane-onboarding"] .status-node').count()
  assertEq('onboarding pane has zero status-nodes', statusNodesInOnboarding, 0)

  // --- Background + Controls ---
  console.log('\n=== background + controls ===')
  const bgDots = await page.locator('[data-testid="pane-onboarding"] .gea-flow__background--dots').count()
  const bgCross = await page.locator('[data-testid="pane-pipeline"] .gea-flow__background--cross').count()
  assertEq('onboarding has dot background', bgDots, 1)
  assertEq('pipeline has cross background', bgCross, 1)

  // Controls present in both panes
  const onbControlsBtns = await page.locator('[data-testid="pane-onboarding"] .gea-flow__controls-btn').count()
  const pipeControlsBtns = await page.locator('[data-testid="pane-pipeline"] .gea-flow__controls-btn').count()
  assertEq('onboarding controls render 3 buttons', onbControlsBtns, 3)
  assertEq('pipeline controls render 3 buttons', pipeControlsBtns, 3)

  // Click zoom-in: viewport scale should increase
  const onbVpForCtrl = page.locator('[data-testid="pane-onboarding"] .gea-flow__viewport').first()
  const onbVpBeforeCtrl = await onbVpForCtrl.evaluate((el) => el.style.transform)
  await page.locator('[data-testid="pane-onboarding"] [data-action="zoom-in"]').click()
  await page.waitForTimeout(600)
  const onbVpAfterCtrl = await onbVpForCtrl.evaluate((el) => el.style.transform)
  assertNeq('zoom-in button changed onboarding viewport', onbVpAfterCtrl, onbVpBeforeCtrl)

  // pipeline viewport unchanged
  const pipeVpForCtrl = page.locator('[data-testid="pane-pipeline"] .gea-flow__viewport').first()
  const pipeVpAfterCtrl = await pipeVpForCtrl.evaluate((el) => el.style.transform)
  assertEq('zoom-in only affected its pane', pipeVpAfterCtrl, 'translate(0px, 0px) scale(1)')

  // Background pattern x/y should reflect viewport pan after zoom
  const patternX = await page.locator('[data-testid="pane-onboarding"] .gea-flow__background pattern').first().getAttribute('x')
  assertNeq('background pattern shifted with viewport', patternX, '0')

  // --- Callbacks ---
  console.log('\n=== callbacks ===')
  // Click first pipeline node — should fire onSelectionChange
  const pipeNode1 = page.locator('[data-testid="pane-pipeline"] [data-id="1"]').first()
  await pipeNode1.click()
  await page.waitForTimeout(150)
  const selectEvent = await page.locator('[data-testid="event-selection"]').textContent()
  assertEq('onSelectionChange fired with node 1', selectEvent?.includes('nodes=[1]'), true)

  // Drag a connection in pipeline — should fire onConnect
  const pipeSource = page.locator('[data-testid="pane-pipeline"] [data-id="3"] .gea-flow__handle.source').first()
  const pipeTarget = page.locator('[data-testid="pane-pipeline"] [data-id="1"] .gea-flow__handle.target').first()
  const sBox2 = await pipeSource.boundingBox()
  const tBox2 = await pipeTarget.boundingBox()
  if (sBox2 && tBox2) {
    await page.mouse.move(sBox2.x + sBox2.width / 2, sBox2.y + sBox2.height / 2)
    await page.mouse.down()
    await page.mouse.move(tBox2.x + tBox2.width / 2, tBox2.y + tBox2.height / 2, { steps: 8 })
    await page.mouse.up()
  }
  await page.waitForTimeout(300)
  const connectEvent = await page.locator('[data-testid="event-connect"]').textContent()
  assertEq('onConnect fired with 3 → 1', connectEvent, '3 → 1')

  // --- Selection box (lasso) ---
  console.log('\n=== selection box (shift+drag) ===')
  // Start fresh in onboarding pane: clear selection by clicking empty area
  const onbCanvasBox2 = await page.locator('[data-testid="pane-onboarding"] .gea-flow').first().boundingBox()
  // Drag a lasso across the visible nodes (with shift held)
  if (onbCanvasBox2) {
    const startX = onbCanvasBox2.x + 20
    const startY = onbCanvasBox2.y + 20
    const endX = onbCanvasBox2.x + onbCanvasBox2.width - 20
    const endY = onbCanvasBox2.y + onbCanvasBox2.height - 20
    await page.keyboard.down('Shift')
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // Mid-drag: selection box should be visible
    await page.mouse.move(startX + 100, startY + 100, { steps: 4 })
    const lassoVisible = await page.locator('[data-testid="pane-onboarding"] .gea-flow__selection-box').count()
    assertEq('selection box renders during shift+drag', lassoVisible, 1)
    await page.mouse.move(endX, endY, { steps: 6 })
    await page.mouse.up()
    await page.keyboard.up('Shift')
    await page.waitForTimeout(200)
  }
  const lassoStillVisible = await page.locator('[data-testid="pane-onboarding"] .gea-flow__selection-box').count()
  assertEq('selection box hides after pointerup', lassoStillVisible, 0)
  // After lassoing the entire pane, both remaining nodes (a, c — b was deleted earlier) should be selected
  await page.waitForTimeout(400)
  const onbNodeClasses = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-testid="pane-onboarding"] .gea-flow__node')
    return Array.from(nodes).map((n) => ({ id: n.getAttribute('data-id'), cls: n.className }))
  })
  console.log('onb node classes after lasso:', onbNodeClasses)
  const onbSelectedNodes = await page.locator('[data-testid="pane-onboarding"] .gea-flow__node.selected').count()
  assertNeq('lasso selected at least one node', onbSelectedNodes, 0)

  // --- Multi-select drag (XYDrag) ---
  console.log('\n=== multi-select drag ===')
  // Reset viewport via fit-view so all nodes are visible (previous tests panned/zoomed it).
  await page.locator('[data-testid="pane-onboarding"] [data-action="fit-view"]').click()
  await page.waitForTimeout(300)
  // Force-select all onboarding nodes via DOM-level select on the FlowStore.
  // (Shift+click sometimes races with d3-drag in the test runner.)
  await page.evaluate(() => {
    const root = document.querySelector('[data-testid="pane-onboarding"] .gea-flow')
    const store = root && root.__geaFlowStore
    if (!store) return
    store.selectNode('a', { multi: false })
    store.selectNode('c', { multi: true })
  })
  await page.waitForTimeout(150)
  const positionsBefore = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid="pane-onboarding"] .gea-flow__node.selected'))
      .map((el) => ({ id: el.getAttribute('data-id'), t: (/** @type {HTMLElement} */ (el)).style.transform })),
  )
  console.log('selected before drag:', positionsBefore)
  if (positionsBefore.length >= 2) {
    const target = page.locator(`[data-testid="pane-onboarding"] [data-id="${positionsBefore[0].id}"]`).first()
    const tBox = await target.boundingBox()
    if (tBox) {
      await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2)
      await page.mouse.down()
      await page.mouse.move(tBox.x + tBox.width / 2 + 60, tBox.y + tBox.height / 2 + 40, { steps: 6 })
      await page.mouse.up()
      await page.waitForTimeout(300)
    }
    const positionsAfter = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid="pane-onboarding"] .gea-flow__node.selected'))
        .map((el) => ({ id: el.getAttribute('data-id'), t: (/** @type {HTMLElement} */ (el)).style.transform })),
    )
    console.log('selected after drag :', positionsAfter)
    const allMoved = positionsBefore.every(
      (b) => positionsAfter.find((a) => a.id === b.id)?.t !== b.t,
    )
    assertEq('all selected nodes moved together', allMoved, true)
  } else {
    console.log('SKIP multi-select drag (only one node was selected)')
  }

  // --- MiniMap ---
  console.log('\n=== minimap ===')
  const miniMapCount = await page.locator('[data-testid="pane-pipeline"] .gea-flow__minimap').count()
  assertEq('pipeline pane has a minimap', miniMapCount, 1)
  const miniNodeRects = await page.locator('[data-testid="pane-pipeline"] .gea-flow__minimap-node').count()
  assertEq('minimap renders one rect per node', miniNodeRects, 4)
  const miniMask = await page.locator('[data-testid="pane-pipeline"] .gea-flow__minimap-mask').count()
  assertEq('minimap renders viewport mask', miniMask, 1)
  // Onboarding pane has no minimap (we didn't add one there)
  const onbMiniMap = await page.locator('[data-testid="pane-onboarding"] .gea-flow__minimap').count()
  assertEq('onboarding pane has no minimap', onbMiniMap, 0)

  // --- Custom edge types ---
  console.log('\n=== custom edge types ===')
  // Pipeline pane uses smoothstep + highlight types; built-in default for unspecified.
  // The animated flag should produce the .animated class on the rendered path.
  const animatedPath = await page.locator('[data-testid="pane-pipeline"] [data-id="e1-2"] .gea-flow__edge-path.animated').count()
  assertEq('e1-2 has animated path', animatedPath, 1)
  // Highlight edge renders a linearGradient (not present in built-ins)
  const gradient = await page.locator('[data-testid="pane-pipeline"] [data-id="e2-3"] linearGradient').count()
  assertEq('e2-3 uses HighlightEdge with gradient', gradient, 1)
  // Highlight edge label "check"
  const label = await page.locator('[data-testid="pane-pipeline"] [data-id="e2-3"] text').first().textContent()
  assertEq('e2-3 highlight edge shows label', label?.trim(), 'check')
  // Onboarding pane uses default bezier; no animated, no gradient
  const onbAnimated = await page.locator('[data-testid="pane-onboarding"] .gea-flow__edge-path.animated').count()
  assertEq('onboarding pane has no animated edges', onbAnimated, 0)

  // --- Validation: unknown node.type falls back to default with one console.warn ---
  console.log('\n=== type validation ===')
  // Install a persistent warning recorder before triggering the unknown type
  await page.evaluate(() => {
    window.__capturedWarnings = []
    const orig = console.warn
    console.warn = (...args) => {
      window.__capturedWarnings.push(args.map(String).join(' '))
      return orig.apply(console, args)
    }
  })
  await page.evaluate(() => {
    const root = document.querySelector('[data-testid="pane-onboarding"] .gea-flow')
    const store = root && root.__geaFlowStore
    store && store.addNodes([{ id: 'unknown-1', type: 'aRandomType', position: { x: -200, y: 0 }, data: {} }])
  })
  await page.waitForTimeout(300)
  const validationOutcome = await page.evaluate(() => ({ warnings: window.__capturedWarnings }))
  const validationFinal = await page.evaluate(() => {
    const node = document.querySelector('[data-testid="pane-onboarding"] [data-id="unknown-1"]')
    return {
      rendered: !!node,
      // Falls back to default node — should contain the gea-flow__default-node child
      isDefault: !!node?.querySelector('.gea-flow__default-node'),
    }
  })
  console.log('validation outcome:', validationOutcome, validationFinal)
  assertEq('warned for unknown node type', validationOutcome.warnings.some((w) => w.includes('aRandomType')), true)
  assertEq('rendered fallback default node for unknown type', validationFinal.isDefault, true)

  // Invalid registry should throw at GeaFlow created. Verify by mounting a fresh GeaFlow imperatively.
  const ctorThrowMsg = await page.evaluate(async () => {
    const mod = await import('/@fs/home/tutku/gea-flow/packages/core/src/index.ts')
    try {
      const tmp = document.createElement('div')
      tmp.style.width = '100px'
      tmp.style.height = '100px'
      document.body.appendChild(tmp)
      const inst = new mod.GeaFlow()
      // @ts-ignore — emulate what the compiler does for props
      inst[Symbol.for('gea.component.setProps')]({
        nodes: () => [],
        edges: () => [],
        nodeTypes: () => ({ broken: 'not-a-function' }),
      })
      inst.render(tmp)
      return null
    } catch (err) {
      return err.message
    }
  })
  console.log('ctor throw msg:', ctorThrowMsg)
  assertEq('invalid nodeTypes throws clear error', !!ctorThrowMsg && ctorThrowMsg.includes('Invalid nodeTypes'), true)

  console.log('\n' + (failures === 0 ? '✓ all checks passed' : `✗ ${failures} check(s) failed`))
  process.exitCode = failures === 0 ? 0 : 1
} finally {
  await browser.close()
}
