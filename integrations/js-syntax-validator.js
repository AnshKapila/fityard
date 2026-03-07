import * as acorn from 'acorn';

/**
 * Vite plugin that validates inline JavaScript in HTML script blocks
 * Runs only during build, not during dev mode
 *
 * @param {Object} options - Plugin options
 * @param {boolean} options.failOnError - Whether to fail the build on syntax errors (default: true)
 * @param {string} options.ecmaVersion - ECMAScript version for Acorn parser (default: 'latest')
 * @returns {import('vite').Plugin}
 */
export function jsSyntaxValidator(options = {}) {
  const { failOnError = true, ecmaVersion = 'latest' } = options;

  let isBuild = false;

  return {
    name: 'js-syntax-validator',

    config(_config, { command }) {
      // Detect if we're in build mode
      isBuild = command === 'build';
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // Only validate during build, not during dev
        if (!isBuild) {
          return; // Skip validation in dev mode
        }

        const filename = ctx.filename || 'index.html';

        try {
          validateScriptBlocks(html, filename, { failOnError, ecmaVersion });
        } catch (error) {
          // Re-throw to stop the build
          throw error;
        }

        // Return undefined to not modify the HTML
        return;
      },
    },
  };
}

/**
 * Extracts and validates all script blocks from HTML
 * @param {string} html - The HTML content
 * @param {string} filename - The filename for error reporting
 * @param {Object} options - Validation options
 */
function validateScriptBlocks(html, filename, options) {
  const { failOnError, ecmaVersion } = options;

  // Split HTML into lines for accurate error reporting
  const htmlLines = html.split('\n');

  // Regular expression to find all script blocks
  const scriptBlockRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;

  let match;
  const errors = [];

  while ((match = scriptBlockRegex.exec(html)) !== null) {
    const attributes = match[1];
    const content = match[2];

    // Find where the content starts (after the '>' of the opening tag)
    const contentStartPos = match.index + match[0].indexOf('>') + 1;
    const beforeContent = html.substring(0, contentStartPos);
    const contentStartLine = (beforeContent.match(/\n/g) || []).length + 1;

    // Parse script tag attributes
    const hasExternalSrc = /src\s*=/.test(attributes);
    const typeMatch = attributes.match(/type\s*=\s*["']([^"']+)["']/);
    const type = typeMatch ? typeMatch[1] : 'text/javascript';
    const idMatch = attributes.match(/id\s*=\s*["']([^"']+)["']/);
    const scriptId = idMatch ? idMatch[1] : null;

    // Skip external scripts (they're loaded from src)
    if (hasExternalSrc) {
      continue;
    }

    // Skip empty scripts
    if (!content.trim()) {
      continue;
    }

    // Validate based on script type
    try {
      if (
        type === 'module' ||
        type === 'text/javascript' ||
        type === '' ||
        !typeMatch
      ) {
        // Parse JavaScript with Acorn
        const sourceType = type === 'module' ? 'module' : 'script';

        acorn.parse(content, {
          ecmaVersion: ecmaVersion,
          sourceType: sourceType,
          locations: true, // Enable location tracking
        });
      }
      // For other types (like application/json, text/plain), skip validation
    } catch (error) {
      // Calculate the exact line in the original HTML file
      // Acorn's line 1 = first line of content string
      const errorLineInScript = error.loc ? error.loc.line : 1;
      const actualLineInHtml = contentStartLine + errorLineInScript - 1;
      const column = error.loc ? error.loc.column : 0;

      errors.push({
        line: actualLineInHtml,
        column: column,
        message: error.message,
        scriptId: scriptId,
        scriptType: type,
        htmlLines: htmlLines,
      });
    }
  }

  // Report all errors
  if (errors.length > 0) {
    const errorCount = errors.length;
    const plural = errorCount === 1 ? '' : 's';

    const errorMessages = errors
      .map(err => {
        const scriptInfo = err.scriptId
          ? ` <script id="${err.scriptId}">`
          : ' <script>';

        // Extract code snippet (3 lines before and after)
        const lineNum = err.line;
        const contextLines = 3;
        const startLine = Math.max(1, lineNum - contextLines);
        const endLine = Math.min(err.htmlLines.length, lineNum + contextLines);

        const codeSnippet = [];
        for (let i = startLine; i <= endLine; i++) {
          const lineContent = err.htmlLines[i - 1];
          const marker = i === lineNum ? '>' : ' ';
          const lineNumPadded = String(i).padStart(4, ' ');
          codeSnippet.push(`   ${marker} ${lineNumPadded} | ${lineContent}`);
        }

        return [
          `  ❌ ${filename}:${err.line}:${err.column}`,
          `     ${err.message}`,
          `     In${scriptInfo}`,
          '',
          codeSnippet.join('\n'),
          '',
        ].join('\n');
      })
      .join('\n');

    const fullError = [
      '',
      '═'.repeat(80),
      `  Syntax Error${plural} in HTML Script Blocks (${errorCount} found)`,
      '═'.repeat(80),
      '',
      errorMessages,
      '═'.repeat(80),
      '',
    ].join('\n');

    if (failOnError) {
      throw new Error(fullError);
    } else {
      console.warn(fullError);
    }
  }
}
