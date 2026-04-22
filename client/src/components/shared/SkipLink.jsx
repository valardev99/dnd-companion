import React from 'react';

/**
 * Keyboard-only skip link. First focusable element on every page so
 * keyboard / screen-reader users can jump past repeated nav into the
 * main content landmark.  WCAG 2.4.1 Bypass Blocks (Level A).
 *
 * Usage: render at the top of any top-level page; set the matching id
 * on your <main>.
 *    <SkipLink target="main-content" />
 *    ...
 *    <main id="main-content">...</main>
 */
export default function SkipLink({ target = 'main-content', children = 'Skip to main content' }) {
  return (
    <a className="skip-link" href={`#${target}`}>
      {children}
    </a>
  );
}
