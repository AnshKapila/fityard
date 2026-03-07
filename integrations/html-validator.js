import { generateErrorPage } from './error-page-generator.js';

/**
 * HTML Validator Plugin (development only)
 *
 * Intercepts Vite's HTML parsing errors and shows a custom error page
 * instead of Vite's default error page.
 *
 * Uses Vite's own error detection by intercepting error responses
 * from the dev server.
 */

/**
 * Extracts error information from Vite's error page HTML
 */
function extractErrorFromViteErrorPage(html) {
  let message = 'HTML parsing error';
  let frame = '';

  // Try to extract error message from Vite's error page
  // Vite's error page typically has the error in a <pre> tag or similar
  const messageMatch =
    html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i) ||
    html.match(/Error[:\s]*([^\n<]+)/i) ||
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i);

  if (messageMatch) {
    message = messageMatch[1]
      .replace(/<[^>]+>/g, '')
      .trim()
      .substring(0, 200);
  }

  // Try to extract code frame
  const frameMatch = html.match(
    /<pre[^>]*class="[^"]*frame[^"]*"[^>]*>([\s\S]*?)<\/pre>/i
  );
  if (frameMatch) {
    frame = frameMatch[1].replace(/<[^>]+>/g, '').trim();
  }

  return { message, frame };
}

export function htmlValidator() {
  return {
    name: 'html-validator',
    enforce: 'pre',

    configureServer(server) {
      // Intercept HTML error responses from Vite
      // When Vite encounters HTML parsing errors, it returns an error page
      // We intercept that and replace it with our custom error page
      server.middlewares.use((req, res, next) => {
        // Only intercept HTML requests
        const url = req.url || '';
        const isHtmlRequest =
          url === '/' ||
          url.endsWith('.html') ||
          (url.includes('.html?') && !url.startsWith('/@')) ||
          (!url.includes('.') &&
            !url.startsWith('/@') &&
            !url.startsWith('/__') &&
            !url.startsWith('/node_modules'));

        if (!isHtmlRequest) {
          return next();
        }

        // Store original methods
        const originalEnd = res.end.bind(res);
        const originalSetHeader = res.setHeader.bind(res);
        const chunks = [];

        // Override write to buffer response
        res.write = function (chunk, encoding, callback) {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          if (typeof encoding === 'function') {
            encoding();
          } else if (typeof callback === 'function') {
            callback();
          }
          return true;
        };

        // Override end to intercept error responses
        res.end = function (chunk, encoding, callback) {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }

          const body = Buffer.concat(chunks).toString('utf-8');

          // Check if this is Vite's error page (HTML parsing errors)
          // Vite's error page contains specific markers
          const isViteErrorPage =
            (res.statusCode >= 400 &&
              body.includes('Error') &&
              (body.includes('vite-error-overlay') ||
                body.includes('Internal Server Error') ||
                body.includes('<pre'))) ||
            body.includes('Parse Error') ||
            body.includes('SyntaxError');

          if (isViteErrorPage) {
            // Extract error information from Vite's error page
            const { message, frame } = extractErrorFromViteErrorPage(body);

            console.error(
              '[html-validator] Intercepted HTML parsing error:',
              message
            );

            const customErrorPage = generateErrorPage({
              message,
              frame,
              id: url,
            });

            // Send our custom error page instead
            res.statusCode = 500;
            originalSetHeader('Content-Type', 'text/html');
            originalSetHeader(
              'Content-Length',
              Buffer.byteLength(customErrorPage)
            );
            return originalEnd(customErrorPage, 'utf-8', callback);
          }

          // Not an error - send the original response
          if (body.length > 0) {
            originalSetHeader('Content-Length', Buffer.byteLength(body));
          }
          return originalEnd(body, 'utf-8', callback);
        };

        next();
      });
    },
  };
}
