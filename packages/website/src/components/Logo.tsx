/**
 * gea-flow brand mark: three connected nodes forming a flow.
 */
export default function Logo() {
  return (
    <a class="logo" href="/">
      <span class="logo__mark">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#22d3ee" />
              <stop offset="50%" stop-color="#a855f7" />
              <stop offset="100%" stop-color="#f472b6" />
            </linearGradient>
          </defs>
          <path d="M6 8 Q14 8 14 14 Q14 20 22 20" stroke="url(#logo-grad)" stroke-width="1.5" fill="none" />
          <circle cx="6" cy="8" r="3" fill="url(#logo-grad)" />
          <circle cx="14" cy="14" r="3" fill="url(#logo-grad)" />
          <circle cx="22" cy="20" r="3" fill="url(#logo-grad)" />
        </svg>
      </span>
      <span class="logo__text">gea-flow</span>
    </a>
  )
}
