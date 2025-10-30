import { describe, expect, it } from 'vitest';
import {
  parseBreadcrumbTrail,
  summarizeTrail,
  formatTrailSummary,
  trailToMarkdown,
  trailToNotebook
} from '../../dist/index.js';

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

describe('parseBreadcrumbTrail', () => {
  it('rejects invalid input', () => {
    expect(() => parseBreadcrumbTrail(null as unknown)).toThrow();
    expect(() => parseBreadcrumbTrail({ id: '', title: 'oops', nodes: [] })).toThrow();
    expect(() =>
      parseBreadcrumbTrail({
        id: 'demo',
        title: 'bad',
        nodes: [{ id: 'n1', label: 42 } as unknown]
      })
    ).toThrow();
  });
});

describe('summarizeTrail', () => {
  it('reports timing and tags', () => {
    const summary = summarizeTrail(sampleTrail);
    expect(summary.totalNodes).toBe(2);
    expect(summary.tags.length).toBe(3);
    expect(summary.durationMs).toBe(5 * 60 * 1000);
    const summaryText = formatTrailSummary(summary);
    expect(summaryText).toContain('2 steps');
    expect(summaryText).toContain('300s duration');
  });
});

describe('trailToMarkdown', () => {
  it('renders metadata', () => {
    const markdown = trailToMarkdown(sampleTrail);
    expect(markdown).toContain('# Demo Trail');
    expect(markdown).toContain('```json');
    expect(markdown).toContain('severity');
  });
});

describe('trailToNotebook', () => {
  it('produces cells', () => {
    const notebook = trailToNotebook(sampleTrail);
    expect(notebook.title).toBe('Demo Trail');
    expect(notebook.cells.length).toBe(2);
    expect(notebook.cells[0].kind).toBe('markdown');
    expect(notebook.cells[1].kind).toBe('code');
  });
});
