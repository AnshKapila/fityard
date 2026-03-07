import fs from 'node:fs';
import path from 'node:path';

export function contentResolver() {
  let root = '';
  let contentFiles = []; // Track content files for HMR

  return {
    name: 'content-resolver',

    configResolved(config) {
      root = config.root;
    },

    // HMR: Watch content files and trigger reload on change
    configureServer(server) {
      server.watcher.on('change', file => {
        if (contentFiles.some(f => file.endsWith(f))) {
          console.log(
            `✓ Content file changed: ${path.basename(file)}, reloading...`
          );
          server.ws.send({ type: 'full-reload' });
        }
      });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // More flexible regex that handles attribute order variations
        const scriptRegex =
          /<script[^>]*\bid=["']content["'][^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>|<script[^>]*type=["']application\/json["'][^>]*\bid=["']content["'][^>]*>([\s\S]*?)<\/script>/;
        const match = html.match(scriptRegex);

        if (!match) {
          console.log(
            'content-resolver: No content script tag found, skipping'
          );
          return html;
        }

        // Get the captured content (could be in group 1 or 2 depending on attribute order)
        const scriptContent = match[1] || match[2];

        if (!scriptContent || !scriptContent.trim()) {
          console.log('content-resolver: Script tag is empty, skipping');
          return html;
        }

        let rawContent;
        try {
          rawContent = JSON.parse(scriptContent);
        } catch (e) {
          console.error(
            'content-resolver: Failed to parse content JSON:',
            e.message
          );
          console.error(
            'content-resolver: Script content was:',
            scriptContent.substring(0, 100)
          );
          return html;
        }

        contentFiles = []; // Reset tracked files

        for (const key in rawContent) {
          const filePath = rawContent[key];
          if (typeof filePath === 'string' && filePath.endsWith('.json')) {
            const absolutePath = path.resolve(root, filePath);
            contentFiles.push(filePath); // Track for HMR

            // Add to watcher in dev mode
            if (ctx.server) {
              ctx.server.watcher.add(absolutePath);
            }

            try {
              const fileContent = JSON.parse(
                fs.readFileSync(absolutePath, 'utf-8')
              );
              rawContent[key] = fileContent;
            } catch (e) {
              console.error(
                `content-resolver: Failed to read/parse ${filePath}:`,
                e.message
              );
              // Keep the original path if we can't read the file
            }
          }
        }

        const resolvedJson = JSON.stringify(rawContent, null, 2);
        const newScriptTag = `<script id="content" type="application/json">${resolvedJson}</script>`;

        return html.replace(match[0], newScriptTag);
      },
    },
  };
}
