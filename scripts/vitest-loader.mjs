import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const loaderDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(loaderDir, '..');
const vitestModuleUrl = pathToFileURL(path.join(projectRoot, 'packages', 'vitest', 'index.js')).href;

/**
 * Resolve bare specifiers to local workspace modules.
 * @param {string} specifier - Module identifier being resolved.
 * @param {Record<string, unknown>} context - Loader metadata describing the import site.
 * @param {Function} defaultResolve - Node's default resolver callback.
 */
export async function resolve(specifier, context, defaultResolve) {
  if (specifier === 'vitest') {
    return {
      url: vitestModuleUrl,
      shortCircuit: true
    };
  }
  return defaultResolve(specifier, context, defaultResolve);
}
