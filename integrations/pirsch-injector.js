/**
 * Vite plugin that injects Pirsch Analytics script in production builds.
 *
 * This plugin ensures that Pirsch analytics tracking is properly configured
 * in deployed applications by injecting the analytics script with the actual
 * token value during the build process.
 *
 * How it works:
 * 1. Only runs during production builds (not dev mode)
 * 2. Reads VITE_PIRSCH_TOKEN from environment variables
 * 3. Injects the Pirsch script into <head> if token is available
 * 4. Replaces any %VITE_PIRSCH_TOKEN% placeholders with actual token
 */

export function pirschInjector(pirschToken) {
  let isBuild = false;

  return {
    name: 'pirsch-injector',

    configResolved(config) {
      isBuild = config.command === 'build';
      if (isBuild) {
        if (pirschToken) {
          console.log('✓ Pirsch analytics enabled (production build)');
        } else {
          console.log('⚠ Pirsch analytics disabled (no token configured)');
        }
      }
    },

    transformIndexHtml(html) {
      // Only inject in production builds
      if (!isBuild) {
        return html;
      }

      // Skip if no token is configured
      if (!pirschToken) {
        console.log('⚠ Pirsch token not found - skipping analytics injection');
        return html;
      }

      // Validate token format to prevent XSS
      if (!/^[a-zA-Z0-9-]+$/.test(pirschToken)) {
        console.error(
          '⚠ Invalid Pirsch token format - skipping analytics injection'
        );
        return html;
      }

      // The Pirsch analytics script
      const pirschScript = `<script defer src="https://api.pirsch.io/pa.js" id="pianjs" data-code="${pirschToken}"></script>`;

      let transformedHtml = html;

      // Inject before </head>
      const headCloseIndex = html.toLowerCase().indexOf('</head>');
      if (headCloseIndex !== -1) {
        transformedHtml =
          html.slice(0, headCloseIndex) +
          `  ${pirschScript}\n` +
          html.slice(headCloseIndex);
      }

      return transformedHtml;
    },
  };
}
