import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Vite plugin that provides an endpoint for logging runtime errors to a file.
 * Only intended for development use.
 *
 * Errors are written to `error.log` in the frontend directory.
 */
export function errorLoggerPlugin() {
  const logFilePath = path.resolve(
    fileURLToPath(new URL('..', import.meta.url)),
    'error.log'
  );

  return {
    name: 'error-logger',
    configureServer(server) {
      server.middlewares.use('/__error-log', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const errorData = JSON.parse(body);
            const logEntry = [
              `[${errorData.timestamp}]`,
              `Location: ${errorData.location || 'unknown'}`,
              `Message: ${errorData.message}`,
              errorData.frame ? `Frame:\n${errorData.frame}` : '',
              errorData.stack ? `Stack:\n${errorData.stack}` : '',
              '---\n',
            ]
              .filter(Boolean)
              .join('\n');

            fs.appendFileSync(logFilePath, logEntry);
            res.statusCode = 200;
            res.end('OK');
          } catch {
            res.statusCode = 400;
            res.end('Invalid JSON');
          }
        });
      });
    },
  };
}
