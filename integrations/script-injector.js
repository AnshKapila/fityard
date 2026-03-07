/**
 * Vite plugin that handles script-injector for Kite platform integration.
 *
 * - Development: Injects the script tag when the app runs in an iframe
 *   inside the Kite platform (enables scroll bridge, gesture handling, etc.)
 * - Production: Removes any existing script tags (e.g., injected by backend for prototypes)
 *   since production Vercel deployments run standalone.
 */

const SCRIPT_INJECTOR_CDN_URL =
  'https://assets.appsmith.com/kite_script_injector_v020.js';
const SCRIPT_INJECTOR_TAG = `<script src="${SCRIPT_INJECTOR_CDN_URL}"></script>`;

export function scriptInjector() {
  let isDev = false;

  return {
    name: 'script-injector',

    configResolved(config) {
      isDev = config.command === 'serve';
    },

    transformIndexHtml(html) {
      // Production: remove any existing script-injector tags
      if (!isDev) {
        return html.replace(SCRIPT_INJECTOR_TAG, '');
      }

      // Development: skip if script is already present (e.g., injected by backend for prototypes)
      if (html.includes(SCRIPT_INJECTOR_TAG)) {
        return;
      }

      // Return tag descriptors - Vite handles injection
      return [
        {
          tag: 'script',
          attrs: { src: SCRIPT_INJECTOR_CDN_URL },
          injectTo: 'body',
        },
      ];
    },

    configureServer() {
      console.log('✓ script-injector enabled (development mode)');
    },

    buildStart() {
      if (!isDev) {
        console.log('✓ script-injector-remover enabled (production build)');
      }
    },
  };
}
