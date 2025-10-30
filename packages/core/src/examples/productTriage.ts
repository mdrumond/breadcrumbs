import type { BreadcrumbTrail, NotebookDocumentData } from '../types.js';

/**
 * Breadcrumb trail demonstrating a product triage workflow used across sample assets.
 */
export const productTriageTrail: BreadcrumbTrail = {
  id: 'product-triage',
  title: 'Product Triage Walkthrough',
  description: 'Review errors reported in the staging environment and capture mitigations.',
  createdAt: '2024-12-02T09:00:00.000Z',
  updatedAt: '2024-12-02T09:45:00.000Z',
  nodes: [
    {
      id: 'collect-alerts',
      label: 'Collect Alerts',
      description: 'Open the alert dashboard and export the most recent incidents.',
      timestamp: '2024-12-02T09:05:00.000Z',
      tags: ['alerts', 'dashboard'],
      metadata: {
        alerts: 5,
        source: 'PagerDuty'
      }
    },
    {
      id: 'cluster-errors',
      label: 'Cluster Incidents',
      description: 'Group incidents by service and severity to spot patterns.',
      timestamp: '2024-12-02T09:15:00.000Z',
      tags: ['analysis'],
      metadata: {
        services: ['payments', 'notifications'],
        critical: 1
      }
    },
    {
      id: 'draft-actions',
      label: 'Draft Mitigations',
      description: 'Outline mitigation steps and assign owners in the triage document.',
      timestamp: '2024-12-02T09:30:00.000Z',
      tags: ['mitigation', 'planning'],
      metadata: {
        owners: ['Morgan', 'Kai'],
        eta: '2024-12-02T18:00:00.000Z'
      }
    }
  ]
};

/**
 * Notebook representation of the product triage trail used by the extension sample command.
 */
export const productTriageNotebook: NotebookDocumentData = {
  title: productTriageTrail.title,
  cells: [
    {
      kind: 'markdown',
      value: [
        '# Product Triage Walkthrough',
        '',
        'Follow this guided workflow to assess alerts and assign mitigation steps.'
      ].join('\n')
    },
    {
      kind: 'markdown',
      value: [
        '## Collect Alerts',
        '',
        'Open the alert dashboard and export the most recent incidents.',
        '',
        '- Alerts: **5**',
        '- Source: PagerDuty'
      ].join('\n')
    },
    {
      kind: 'markdown',
      value: [
        '## Cluster Incidents',
        '',
        'Group incidents by service and severity to spot patterns.',
        '',
        '- Services: payments, notifications',
        '- Critical incidents: **1**'
      ].join('\n')
    },
    {
      kind: 'markdown',
      value: [
        '## Draft Mitigations',
        '',
        'Outline mitigation steps and assign owners in the triage document.',
        '',
        '- Owners: Morgan, Kai',
        '- ETA: 2024-12-02T18:00:00.000Z'
      ].join('\n')
    }
  ]
};
