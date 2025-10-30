type CoreModule = typeof import('../../core/src/index.js');

let cachedModule: CoreModule | undefined;

/**
 * Load the shared core module, preferring compiled output when available.
 * @returns Core module that provides parsing and formatting utilities.
 */
export async function getCoreModule(): Promise<CoreModule> {
  if (cachedModule) {
    return cachedModule;
  }
  try {
    cachedModule = (await import('../../core/dist/index.js')) as CoreModule;
  } catch (error) {
    console.warn('Falling back to TypeScript sources for @breadcrumbs/core:', error);
    cachedModule = await import('../../core/src/index.js');
  }
  return cachedModule;
}
