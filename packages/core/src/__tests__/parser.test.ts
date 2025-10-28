import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseBreadcrumbTrail,
  summarizeTrail,
  formatTrailSummary,
  trailToMarkdown,
  trailToNotebook
} from '../index.ts';

const sampleTrail = parseBreadcrumbTrail({
  id: 'demo',
  title: 'Demo Trail',
  description: 'A short trail used for parser tests.',
  nodes: [
    {
      id: 'first',
      label: 'Start',
      description: 'Open the project dashboard.',
      timestamp: '2024-01-01T10:00:00.000Z',
      tags: ['dashboard']
    },
    {
      id: 'second',
      label: 'Inspect logs',
      timestamp: '2024-01-01T10:05:00.000Z',
      tags: ['logs', 'analysis'],
      metadata: { severity: 'info' }
    }
  ]
});

test('parseBreadcrumbTrail rejects invalid input', () => {
  assert.throws(() => parseBreadcrumbTrail(null));
  assert.throws(() => parseBreadcrumbTrail({ id: '', title: 'oops', nodes: [] }));
  assert.throws(() =>
    parseBreadcrumbTrail({ id: 'demo', title: 'bad', nodes: [{ id: 'n1', label: 42 }] as unknown })
  );
});

test('summarizeTrail reports timing and tags', () => {
  const summary = summarizeTrail(sampleTrail);
  assert.equal(summary.totalNodes, 2);
  assert.equal(summary.tags.length, 3);
  assert.equal(summary.durationMs, 5 * 60 * 1000);
  const summaryText = formatTrailSummary(summary);
  assert(summaryText.includes('2 steps'));
  assert(summaryText.includes('300s duration'));
});

test('trailToMarkdown renders metadata', () => {
  const markdown = trailToMarkdown(sampleTrail);
  assert(markdown.includes('# Demo Trail'));
  assert(markdown.includes('```json'));
  assert(markdown.includes('severity'));
});

test('trailToNotebook produces cells', () => {
  const notebook = trailToNotebook(sampleTrail);
  assert.equal(notebook.title, 'Demo Trail');
  assert.equal(notebook.cells.length, 2);
  assert.equal(notebook.cells[0].kind, 'markdown');
  assert.equal(notebook.cells[1].kind, 'code');
});
