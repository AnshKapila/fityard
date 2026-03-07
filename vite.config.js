import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { pirschInjector } from './integrations/pirsch-injector.js';
import { scriptInjector } from './integrations/script-injector.js';
import { kiteBadgeInjector } from './integrations/kite-badge-injector.js';
import { buildErrorOverlayPlugin } from './integrations/build-error-overlay.js';
import { runtimeErrorCapturePlugin } from './integrations/runtime-error-capture.js';
import { errorLoggerPlugin } from './integrations/error-logger.js';
import { contentResolver } from './integrations/content-resolver.js';
import { htmlValidator } from './integrations/html-validator.js';
import { metaInjector } from './integrations/meta-injector.js';
import { jsSyntaxValidator } from './integrations/js-syntax-validator.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: fileURLToPath(new URL('src', import.meta.url)),
    publicDir: fileURLToPath(new URL('public', import.meta.url)),
    plugins: [
      jsSyntaxValidator(), // Validate inline JavaScript syntax in HTML files
      contentResolver(),
      mode === 'development' && htmlValidator(), // Validate HTML and show custom error page for parsing errors
      pirschInjector(env.VITE_PIRSCH_TOKEN), // Inject Pirsch analytics in production builds
      scriptInjector(), // Dev: inject script-injector, Prod: remove existing ones
      kiteBadgeInjector({ disabled: true, appId: env.VITE_APP_ID }), // "Built with Kite" badge (overridden by VITE_DISABLE_KITE_BADGE env var at deploy time)
      metaInjector({ siteUrl: env.VITE_SITE_URL }), // Inject canonical URL and og:url in production builds
      viteStaticCopy({
        targets: [
          {
            src: 'content',
            dest: '.',
          },
        ],
      }),
      // Runtime error capture - included in both dev and prod
      // In dev: shows errors in overlay, In prod: reports to Pirsch analytics
      runtimeErrorCapturePlugin({
        isDev: mode === 'development',
      }),
      // Build error overlay and error logging - development only
      mode === 'development' && buildErrorOverlayPlugin(),
      mode === 'development' && errorLoggerPlugin(),
    ],
    server: {
      port: 4321,
      open: false,
      cors: true,
      host: true, // Allow connections from any host
      allowedHosts: true,
      hmr: false,
      ws: false, // Disable WebSocket to prevent auto-reload when sandbox sleeps
      proxy: {
        '/api/v1': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: fileURLToPath(new URL('dist/client', import.meta.url)),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('src/index.html', import.meta.url)),
        },
      },
    },
    // Enable ES modules and allow importing from lib/
    resolve: {
      alias: {
        '@app/frontend-core/utility': fileURLToPath(
          new URL('../frontend-core/src/utility/index.ts', import.meta.url)
        ),
        '@app/frontend-core': fileURLToPath(
          new URL('../frontend-core/src/index.ts', import.meta.url)
        ),
      },
    },
  };
});
