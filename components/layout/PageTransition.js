'use client';

/**
 * Page transition wrapper.
 *
 * Earlier versions used framer-motion + AnimatePresence with `mode="wait"`,
 * which caused a visible flicker on every navigation: the old route faded
 * out, then the new route faded in (the "appear → disappear → appear" the
 * user reported). For an SPA-feeling instant transition, we render children
 * directly with no animation. The dev tools' built-in route transitions
 * stay snappy.
 */
export default function PageTransition({ children }) {
  return children;
}
