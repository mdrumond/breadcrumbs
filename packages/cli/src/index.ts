import { basename, resolve } from 'node:path';
import type { BreadcrumbTrail, TrailFileDescriptor } from '../../core/src/types.js';
import {
  findTrailFiles,
  loadBreadcrumbTrail,
  summarizeTrail,
  formatTrailSummary,
  trailToMarkdown,
  parseBreadcrumbTrail
} from '../../core/dist/index.js';

/**
 * Resolve a user supplied path relative to the current working directory.
 * @param input - Path provided on the command line.
 * @returns Absolute path suitable for filesystem access.
 */
export function resolvePath(input: string): string {
  return resolve(process.cwd(), input);
}

/**
 * Load a breadcrumb trail from disk.
 * @param filePath - Path to the trail file.
 * @returns Parsed breadcrumb trail.
 */
export async function loadTrail(filePath: string): Promise<BreadcrumbTrail> {
  const absolute = resolvePath(filePath);
  return loadBreadcrumbTrail(absolute);
}

/**
 * Create a textual table describing the nodes of a breadcrumb trail.
 * @param trail - Trail to format.
 * @returns Multiline string summarizing each node.
 */
export function formatTrailTable(trail: BreadcrumbTrail): string {
  const header = ['#', 'Label', 'Timestamp', 'Tags', 'Description'];
  const rows = trail.nodes.map((node, index) => {
    const position = String(index + 1).padStart(2, ' ');
    const timestamp = node.timestamp ?? '—';
    const tags = node.tags?.join(', ') ?? '—';
    const description = node.description ?? '';
    return `${position} │ ${node.label} │ ${timestamp} │ ${tags} │ ${description}`.trimEnd();
  });
  return [` ${header.join(' │ ')}`, ...rows].join('\n');
}

/**
 * Produce a concise summary paragraph for a trail.
 * @param trail - Trail to describe.
 * @returns Human readable description.
 */
export function describeTrail(trail: BreadcrumbTrail): string {
  const summary = summarizeTrail(trail);
  const summaryLine = formatTrailSummary(summary);
  const description = trail.description ? `\n${trail.description}` : '';
  return `${trail.title} (${trail.id})\n${summaryLine}${description}`.trim();
}

/**
 * Render a breadcrumb trail as markdown.
 * @param trail - Trail to convert.
 * @returns Markdown document.
 */
export function renderTrailMarkdown(trail: BreadcrumbTrail): string {
  return trailToMarkdown(trail);
}

/**
 * Summarize a trail file combining the description and table output.
 * @param filePath - Path to the trail file.
 * @returns Summary suitable for terminal output.
 */
export async function summarizeTrailFile(filePath: string): Promise<string> {
  const trail = await loadTrail(filePath);
  return [describeTrail(trail), '', formatTrailTable(trail)].join('\n');
}

/**
 * Convert a trail file to markdown.
 * @param filePath - Path to the trail file.
 * @returns Markdown representation of the trail.
 */
export async function convertTrailFileToMarkdown(filePath: string): Promise<string> {
  const trail = await loadTrail(filePath);
  return renderTrailMarkdown(trail);
}

/**
 * List all breadcrumb files within a directory.
 * @param directory - Directory to scan.
 * @returns Array of file descriptors sorted by title.
 */
export async function listTrails(directory: string): Promise<TrailFileDescriptor[]> {
  const absolute = resolvePath(directory);
  return findTrailFiles(absolute);
}

/**
 * Parse a breadcrumb trail from raw JSON content.
 * @param raw - JSON string or object representing a trail.
 * @returns Parsed breadcrumb trail instance.
 */
export function parseTrail(raw: string | unknown): BreadcrumbTrail {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return parseBreadcrumbTrail(value);
}

/**
 * Print CLI usage information.
 */
export function printUsage(): void {
  console.log(`Breadcrumbs CLI
Usage:
  breadcrumbs summarize <file>    Summarize a breadcrumb trail.
  breadcrumbs markdown <file>     Emit markdown for the trail.
  breadcrumbs list [dir]          List trails in a directory.
`);
}

/**
 * Execute a CLI command based on the provided arguments.
 * @param argv - Process arguments (usually process.argv).
 */
export async function runCli(argv: string[]): Promise<void> {
  const [, , command, ...rest] = argv;
  switch (command) {
    case 'summarize': {
      const target = rest[0];
      if (!target) {
        throw new Error('Expected a trail file path.');
      }
      const output = await summarizeTrailFile(target);
      console.log(output);
      break;
    }
    case 'markdown': {
      const target = rest[0];
      if (!target) {
        throw new Error('Expected a trail file path.');
      }
      const markdown = await convertTrailFileToMarkdown(target);
      console.log(markdown);
      break;
    }
    case 'list': {
      const directory = rest[0] ?? '.';
      const trails = await listTrails(directory);
      if (trails.length === 0) {
        console.log('No breadcrumb files found.');
        break;
      }
      const lines = trails.map((trail) => `${basename(trail.path)} - ${trail.title}`);
      console.log(lines.join('\n'));
      break;
    }
    case undefined:
    case '--help':
    case '-h':
      printUsage();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
