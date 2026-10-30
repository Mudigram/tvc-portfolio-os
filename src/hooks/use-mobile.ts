import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// The viewport is owned by the browser, not by React, so it is an external
// store: React has to subscribe to it rather than mirror it in useState.
//
// The previous implementation did mirror it - useState(undefined) plus
// setIsMobile() inside the effect body. Because that setState only ran after
// the first commit, every first render reported `false`: the server render, and
// the hydration render that must match it. A phone user was therefore served
// desktop sidebar markup and re-laid-out one frame later. The `undefined`
// initial value existed only to detect "not measured yet", and `!!isMobile`
// immediately collapsed it back to false, so even that was invisible to callers.
//
// useSyncExternalStore reads the true value during the first client render.
function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

// Returns a boolean primitive, so React's snapshot comparison is stable and the
// subscription does not loop.
function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

// There is no viewport on the server. `false` is what callers effectively saw
// before, so server-rendered markup is unchanged and hydration still matches.
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
