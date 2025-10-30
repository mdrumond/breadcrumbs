import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parseBreadcrumbTrail } from '../../../core/dist/index.js';
import type { BreadcrumbTrail } from '../../../core/src/types.ts';
import {
  describeTrail,
  formatTrailTable,
  renderTrailMarkdown,
  summarizeTrailFile,
  listTrails,
  parseTrail
} from '../index.ts';

const trail: BreadcrumbTrail = parseBreadcrumbTrail({
  id: 'cli-demo',
  title: 'CLI Demo',
  description: 'Trail used for CLI unit tests.',
  nodes: [
    {
      id: 'start',
      label: 'Open repo',
      kind: 'observation',
      description: 'Clone the repository.',
      timestamp: '2024-05-01T10:00:00.000Z',
      tags: ['setup']
    },
    {
      id: 'inspect',
      label: 'Inspect config',
      kind: 'analysis',
      timestamp: '2024-05-01T10:05:00.000Z',
      tags: ['analysis']
    }
  ]
});

test('formatTrailTable includes node details', () => {
  const table = formatTrailTable(trail);
  assert(table.includes('Open repo'));
  assert(table.includes('setup'));
});

test('describeTrail produces summary text', () => {
  const description = describeTrail(trail);
  assert(description.includes('CLI Demo'));
  assert(description.includes('2 steps'));
});

test('renderTrailMarkdown outputs markdown', () => {
  const markdown = renderTrailMarkdown(trail);
  assert(markdown.includes('# CLI Demo'));
  assert(markdown.includes('## Steps'));
});

test('parseTrail handles string input', () => {
  const serialized = JSON.stringify(trail);
  const parsed = parseTrail(serialized);
  assert.equal(parsed.id, trail.id);
});

test('summarizeTrailFile reads data from disk', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'breadcrumbs-cli-'));
  const filePath = join(dir, 'trail.json');
  await writeFile(filePath, JSON.stringify(trail), 'utf8');
  const summary = await summarizeTrailFile(filePath);
  assert(summary.includes('CLI Demo'));
  await rm(dir, { recursive: true, force: true });
});

test('listTrails discovers files in a directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'breadcrumbs-cli-list-'));
  const filePath = join(dir, 'trail.json');
  await writeFile(filePath, JSON.stringify(trail), 'utf8');
  const results = await listTrails(dir);
  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'CLI Demo');
  await rm(dir, { recursive: true, force: true });
});
