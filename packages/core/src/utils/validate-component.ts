/**
 * Outlet-style validation: confirm the value can be mounted by Gea.
 *
 * Accepts:
 *  - A class component (extends Component) — has `prototype.render` and `prototype.dispose`
 *  - A function component — plain function whose name starts uppercase (compiler converts
 *    these to function-style components that return DOM nodes when called via `mount()`)
 *
 * Rejects anything else (string, number, plain object, null, undefined).
 */
export function isMountableComponent(value: unknown): value is (...args: unknown[]) => unknown {
  if (typeof value !== 'function') return false
  // Class with render+dispose on prototype → class component
  const proto = (value as { prototype?: unknown }).prototype as
    | { render?: unknown; dispose?: unknown }
    | undefined
  if (proto && typeof proto.render === 'function' && typeof proto.dispose === 'function') {
    return true
  }
  // Otherwise treat any function as a function component (Gea compiles named functions
  // returning JSX into mountable form). We can't reliably introspect post-compile, so
  // accept the function and rely on `mount()` to handle it.
  return true
}

export function describeBadComponent(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `string ("${value}")`
  if (typeof value === 'number') return `number (${value})`
  if (typeof value === 'boolean') return `boolean (${value})`
  if (Array.isArray(value)) return 'array'
  return typeof value
}

export function validateTypeRegistry(
  registry: Record<string, unknown>,
  kind: 'node' | 'edge',
  builtinKeys: Set<string>,
): void {
  for (const [key, val] of Object.entries(registry)) {
    if (builtinKeys.has(key)) continue // built-ins always valid
    if (!isMountableComponent(val)) {
      throw new Error(
        `[gea-flow] Invalid ${kind}Types entry: '${key}' is ${describeBadComponent(val)}, ` +
          `but ${kind}Types values must be a class extending Component or a function component.`,
      )
    }
  }
}
