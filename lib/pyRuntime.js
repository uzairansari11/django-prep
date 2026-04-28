/**
 * Lazy Pyodide loader.
 *
 * Pyodide is ~6MB compressed — we never want it bundled. We load it from
 * the jsdelivr CDN on first access, cache the resulting instance globally,
 * and bootstrap our mock-django module into it so subsequent runs are fast.
 */

import { MOCK_DJANGO_SOURCE } from './mockDjango';

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let _instancePromise = null;

function loadPyodideScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Pyodide can only load in the browser.'));
      return;
    }
    if (window.loadPyodide) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-pyodide]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Pyodide script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = `${PYODIDE_BASE}pyodide.js`;
    script.async = true;
    script.dataset.pyodide = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Pyodide script failed to load'));
    document.head.appendChild(script);
  });
}

/**
 * Returns a Promise resolving to the cached Pyodide instance with
 * mock-django already installed. First call triggers the download.
 */
export function getPyodide({ onProgress } = {}) {
  if (_instancePromise) return _instancePromise;
  _instancePromise = (async () => {
    onProgress?.('Loading Python runtime…');
    await loadPyodideScript();
    onProgress?.('Initialising interpreter…');
    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_BASE });
    onProgress?.('Installing mock Django ORM…');
    pyodide.runPython(MOCK_DJANGO_SOURCE);
    onProgress?.('Ready.');
    return pyodide;
  })().catch((err) => {
    // Allow a future retry if the first load failed
    _instancePromise = null;
    throw err;
  });
  return _instancePromise;
}

/**
 * Pre-warm Pyodide in the background (e.g. on hover of a Run button).
 */
export function prewarmPyodide() {
  // Fire-and-forget. Don't surface errors here — the actual run will report.
  getPyodide().catch(() => {});
}
