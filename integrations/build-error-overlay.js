import { ERROR_STYLES, ERROR_CONTAINER_HTML } from './error-page-generator.js';

/**
 * Build-time error overlay plugin (development only)
 *
 * Shows a custom error overlay for Vite build errors and provides
 * the UI for displaying runtime errors captured by runtime-error-capture.js
 *
 * Features:
 * - Custom styled error overlay (replaces Vite's default)
 * - Copy error details to clipboard
 * - Debug button to send error to parent frame for AI debugging
 * - Posts errors to parent frame for Faro analytics
 * - Writes errors to local log file via /__error-log endpoint
 */
export function buildErrorOverlayPlugin() {
  return {
    name: 'build-error-overlay',
    enforce: 'pre',

    transformIndexHtml() {
      return [
        {
          tag: 'style',
          injectTo: 'head',
          children: ERROR_STYLES,
        },
        {
          tag: 'div',
          injectTo: 'body-prepend',
          children: ERROR_CONTAINER_HTML.trim(),
        },
        {
          tag: 'script',
          injectTo: 'head',
          attrs: { type: 'module' },
          children: `
            const overlay = document.getElementById('custom-vite-error-overlay');
            const debugButton = document.getElementById('debug-button');
            
            // Define showError function to display error in the overlay
            function showError(payload) { 
              const err = payload.err || payload.error || payload;
              
              const message = err.message || err.toString();
              let location = '';
              
              if (err.loc) {
                location = \`\${err.loc.file}:\${err.loc.line}:\${err.loc.column}\`;
              } else if (err.id) {
                location = err.id;
              }

              // Show frame (code snippet) or stack trace
              const frameContent = err.frame || err.stack;

              overlay.classList.add('visible');
              
              // Build error details for logging and reporting
              const errorDetails = {
                message: message,
                location: location,
                frame: err.frame || '',
                stack: err.stack || '',
                timestamp: new Date().toISOString()
              };

              // Debug button functionality - sends error to parent window
              debugButton.addEventListener('click', () => {
              
                // Send postMessage to parent window (works even cross-origin)
                window.parent.postMessage({
                  type: 'app-error-debug',
                  payload: {
                    message: errorDetails.message,
                    location: errorDetails.location,
                    frame: errorDetails.frame
                  }
                }, '*');
                
                console.log('Debug message sent to parent window');
              });
              
              // 1. Post message to parent frame for analytics
              window.parent.postMessage({
                type: 'app-runtime-error',
                payload: errorDetails
              }, '*');
              
              // 2. Write error to log file via server endpoint
              fetch('/__error-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorDetails)
              }).catch(() => {
                // Silently ignore logging failures
              });
            }

            
            
            // Function to extract and show error from Vite's overlay
            function handleViteOverlay(viteOverlay) {
              console.log('Vite overlay detected, extracting error...');
              const message = viteOverlay.shadowRoot?.querySelector('.message')?.textContent ||
                              viteOverlay.shadowRoot?.querySelector('.message-body')?.textContent;
              const file = viteOverlay.shadowRoot?.querySelector('.file')?.textContent;
              const frame = viteOverlay.shadowRoot?.querySelector('.frame')?.textContent;
              
              if (message) {
                showError({
                  err: {
                    message: message,
                    id: file,
                    frame: frame
                  }
                });
              }
              
              viteOverlay.remove();
            }

            // Check if Vite's overlay already exists
            const existingOverlay = document.querySelector('vite-error-overlay');
            if (existingOverlay) {
              handleViteOverlay(existingOverlay);
            }

            // Hide Vite's default overlay whenever it appears
            const observer = new MutationObserver(() => {
              const viteOverlay = document.querySelector('vite-error-overlay');
              if (viteOverlay) {
                handleViteOverlay(viteOverlay);
              }
            });
            
            observer.observe(document.body, { childList: true, subtree: true });

            // Expose showError globally for the runtime error capture plugin
            window.__showAppError = (errorData) => {
              // Build location string from filename and line/column if available
              let location = errorData.filename || '';
              if (errorData.lineno) {
                location += ':' + errorData.lineno;
                if (errorData.colno) {
                  location += ':' + errorData.colno;
                }
              }
              
              showError({
                err: {
                  message: errorData.message || 'Unknown error',
                  stack: errorData.stack,
                  id: location || undefined
                }
              });
            };
            
            // Process any errors that were captured before the overlay was ready
            if (window.__errorQueue && window.__errorQueue.length > 0) {
              // Show only the first error (most relevant)
              window.__showAppError(window.__errorQueue[0]);
            }
            
            // Mark the overlay as ready so new errors go directly to showError
            window.__errorOverlayReady = true;

          `,
        },
      ];
    },
  };
}
