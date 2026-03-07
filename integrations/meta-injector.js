/**
 * Vite plugin that injects canonical URL meta tags in production builds.
 *
 * This plugin ensures that the canonical URL is properly configured
 * in deployed applications by injecting the link and og:url tags during build.
 *
 * How it works:
 * 1. Only runs during production builds (not dev mode)
 * 2. Reads site URL from options
 * 3. Uses Vite's tag injection API to add <link rel="canonical"> and <meta property="og:url">
 *
 * @param {Object} options - Plugin options
 * @param {string} options.siteUrl - The site URL for canonical and og:url tags
 */
export function metaInjector(options = {}) {
  let isBuild = false;

  return {
    name: 'meta-injector',

    configResolved(config) {
      isBuild = config.command === 'build';
      if (isBuild) {
        if (options.siteUrl) {
          console.log(
            `✓ Site URL meta tags will be injected: ${options.siteUrl}`
          );
        } else {
          console.log('⚠ Meta injector: No site URL provided - skipping');
        }
      }
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // Only inject in production builds
        if (!isBuild) {
          return html;
        }

        // Skip if no site URL provided
        if (!options.siteUrl) {
          return html;
        }

        // Validate URL format
        const siteUrl = validateUrl(options.siteUrl);
        if (!siteUrl) {
          console.warn(
            '⚠ Meta injector: Invalid site URL provided - skipping'
          );
          return html;
        }

        // Remove existing canonical and og:url tags from HTML
        let cleanedHtml = html;
        cleanedHtml = cleanedHtml.replace(
          /<link[^>]*\s+rel=["']canonical["'][^>]*\/?>/gi,
          ''
        );
        cleanedHtml = cleanedHtml.replace(
          /<meta[^>]*\s+property=["']og:url["'][^>]*\/?>/gi,
          ''
        );

        // Use Vite's tag injection API for proper escaping and placement
        return {
          html: cleanedHtml,
          tags: [
            {
              tag: 'link',
              attrs: { rel: 'canonical', href: siteUrl },
              injectTo: 'head',
            },
            {
              tag: 'meta',
              attrs: { property: 'og:url', content: siteUrl },
              injectTo: 'head',
            },
          ],
        };
      },
    },
  };
}

/**
 * Validate URL to ensure it's well-formed.
 * Returns the validated URL string or null if invalid.
 */
function validateUrl(str) {
  if (typeof str !== 'string' || !str.trim()) {
    return null;
  }

  try {
    const url = new URL(str);
    return url.toString();
  } catch {
    return null;
  }
}
