/**
 * Runtime error capture plugin (development + production)
 *
 * Captures JavaScript runtime errors early (before any user code runs)
 * by injecting a synchronous script at the very beginning of <head>.
 *
 * Behavior:
 * - Development: Queues errors until the build-error-overlay is ready,
 *   then displays them in the overlay UI
 * - Production: Reports errors to Pirsch analytics as custom events
 *   (uses the pirsch() function from pirsch-injector.js)
 *
 * @param {Object} options
 * @param {boolean} options.isDev - Whether running in development mode
 */
export function runtimeErrorCapturePlugin(options = {}) {
  const { isDev = true } = options;

  return {
    name: 'runtime-error-capture',
    enforce: 'pre',

    transformIndexHtml() {
      const scriptContent = isDev
        ? getDevelopmentScript()
        : getProductionScript();

      return [
        {
          tag: 'script',
          injectTo: 'head-prepend', // Inject at the very beginning of <head>
          children: scriptContent,
        },
      ];
    },
  };
}

/**
 * Development mode script - queues errors for the overlay
 */
function getDevelopmentScript() {
  return `
    // Early error capture for development - queues errors until overlay is ready
    window.__errorQueue = [];
    window.__errorOverlayReady = false;
    
    window.addEventListener('error', function(event) {
      var errorData = {
        type: 'error',
        message: event.message || (event.error && event.error.message) || 'Unknown error',
        stack: event.error && event.error.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      };
      
      if (window.__errorOverlayReady && window.__showAppError) {
        window.__showAppError(errorData);
      } else {
        window.__errorQueue.push(errorData);
      }
    });
    
    window.addEventListener('unhandledrejection', function(event) {
      var reason = event.reason;
      var errorData = {
        type: 'unhandledrejection',
        message: (reason && reason.message) || String(reason) || 'Unhandled Promise Rejection',
        stack: reason && reason.stack
      };
      
      if (window.__errorOverlayReady && window.__showAppError) {
        window.__showAppError(errorData);
      } else {
        window.__errorQueue.push(errorData);
      }
    });
  `;
}

/**
 * Production mode script - reports errors to Pirsch analytics
 * Uses the pirsch() function provided by the Pirsch analytics script
 * @see https://docs.pirsch.io/advanced/events#example-3-using-javascript
 */
function getProductionScript() {
  return `
    // Runtime error capture for production - reports to Pirsch analytics
    (function() {
      var errorQueue = [];
      var pirschReady = false;
      var maxErrors = 5; // Limit errors per page to avoid spam
      var errorCount = 0;
      
      function reportToPirsch(errorData) {
        // Don't report more than maxErrors per page load
        if (errorCount >= maxErrors) return;
        errorCount++;
        
        // Build location string
        var location = errorData.filename || '';
        if (errorData.lineno) {
          location += ':' + errorData.lineno;
          if (errorData.colno) {
            location += ':' + errorData.colno;
          }
        }
        
        // Truncate stack trace to fit Pirsch metadata limits (2000 chars max)
        var stack = errorData.stack || '';
        if (stack.length > 1500) {
          stack = stack.substring(0, 1500) + '... (truncated)';
        }
        
        // Send to Pirsch as a custom event
        // Using non_interactive: true so errors don't affect bounce rate
        try {
          pirsch('Runtime Error', {
            meta: {
              type: errorData.type || 'error',
              message: (errorData.message || 'Unknown error').substring(0, 500),
              location: location.substring(0, 500),
              stack: stack,
              url: window.location.href.substring(0, 500)
            },
            non_interactive: true
          });
        } catch (e) {
          // Pirsch not available, silently ignore
          console.error('[Runtime Error]', errorData.message);
        }
      }
      
      function flushQueue() {
        while (errorQueue.length > 0) {
          reportToPirsch(errorQueue.shift());
        }
      }
      
      function handleError(errorData) {
        // Check if pirsch function is available
        if (typeof pirsch === 'function') {
          pirschReady = true;
          reportToPirsch(errorData);
        } else {
          // Queue for later when Pirsch loads
          errorQueue.push(errorData);
        }
      }
      
      window.addEventListener('error', function(event) {
        handleError({
          type: 'error',
          message: event.message || (event.error && event.error.message) || 'Unknown error',
          stack: event.error && event.error.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });
      
      window.addEventListener('unhandledrejection', function(event) {
        var reason = event.reason;
        handleError({
          type: 'unhandledrejection',
          message: (reason && reason.message) || String(reason) || 'Unhandled Promise Rejection',
          stack: reason && reason.stack
        });
      });
      
      // Try to flush queue when Pirsch becomes available
      // Check periodically for a short time after page load
      var checkCount = 0;
      var checkInterval = setInterval(function() {
        checkCount++;
        if (typeof pirsch === 'function') {
          pirschReady = true;
          flushQueue();
          clearInterval(checkInterval);
        } else if (checkCount >= 20) {
          // Stop checking after ~10 seconds
          clearInterval(checkInterval);
        }
      }, 500);
      
      // Also check when DOM is ready
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          if (typeof pirsch === 'function') {
            pirschReady = true;
            flushQueue();
          }
        }, 500);
      });
    })();
  `;
}
