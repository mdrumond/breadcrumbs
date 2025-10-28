import fs from 'node:fs/promises';
import path from 'node:path';
import type { BreadcrumbNode, BreadcrumbTrail, TrailFileDescriptor } from './types.ts';

/**
 * Determine whether a value is a plain object.
 * @param value - Value to inspect.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate that the provided string is a valid ISO-8601 timestamp.
 * @param value - Candidate timestamp.
 */
function assertIsoTimestamp(value: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Expected ISO-8601 timestamp but received: ${value}`);
  }
}

/**
 * Parse a JSON object into a breadcrumb node.
 * @param raw - Raw node value read from JSON.
 */
function parseNode(raw: unknown): BreadcrumbNode {
  if (!isRecord(raw)) {
    throw new Error('Breadcrumb node must be an object.');
  }
  const { id, label, description, timestamp, tags, metadata } = raw;
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Breadcrumb node is missing a string id.');
  }
  if (typeof label !== 'string' || label.length === 0) {
    throw new Error(`Breadcrumb node "${id}" is missing a string label.`);
  }
  if (timestamp !== undefined) {
    if (typeof timestamp !== 'string') {
      throw new Error(`Breadcrumb node "${id}" timestamp must be a string.`);
    }
    assertIsoTimestamp(timestamp);
  }
  if (description !== undefined && typeof description !== 'string') {
    throw new Error(`Breadcrumb node "${id}" description must be a string.`);
  }
  let normalizedTags: readonly string[] | undefined;
  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
      throw new Error(`Breadcrumb node "${id}" tags must be a string array.`);
    }
    normalizedTags = tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  }
  let normalizedMetadata: Record<string, unknown> | undefined;
  if (metadata !== undefined) {
    if (!isRecord(metadata)) {
      throw new Error(`Breadcrumb node "${id}" metadata must be an object.`);
    }
    normalizedMetadata = metadata;
  }
  return {
    id,
    label,
    description,
    timestamp,
    tags: normalizedTags,
    metadata: normalizedMetadata
  };
}

/**
 * Parse JSON data into a breadcrumb trail object.
 * @param data - Parsed JSON object.
 */
export function parseBreadcrumbTrail(data: unknown): BreadcrumbTrail {
  if (!isRecord(data)) {
    throw new Error('Breadcrumb trail must be an object.');
  }
  const { id, title, description, createdAt, updatedAt, nodes } = data;
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Trail is missing a string id.');
  }
  if (typeof title !== 'string' || title.length === 0) {
    throw new Error(`Trail "${id}" is missing a string title.`);
  }
  if (description !== undefined && typeof description !== 'string') {
    throw new Error(`Trail "${id}" description must be a string.`);
  }
  if (!Array.isArray(nodes)) {
    throw new Error(`Trail "${id}" must contain an array of nodes.`);
  }
  if (createdAt !== undefined) {
    if (typeof createdAt !== 'string') {
      throw new Error(`Trail "${id}" createdAt must be a string.`);
    }
    assertIsoTimestamp(createdAt);
  }
  if (updatedAt !== undefined) {
    if (typeof updatedAt !== 'string') {
      throw new Error(`Trail "${id}" updatedAt must be a string.`);
    }
    assertIsoTimestamp(updatedAt);
  }
  const parsedNodes = nodes.map((node) => parseNode(node));
  return {
    id,
    title,
    description,
    createdAt,
    updatedAt,
    nodes: parsedNodes
  };
}

/**
 * Read and parse a breadcrumb trail from a JSON file.
 * @param filePath - Absolute path to the JSON file.
 */
export async function loadBreadcrumbTrail(filePath: string): Promise<BreadcrumbTrail> {
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);
  return parseBreadcrumbTrail(data);
}

const SUPPORTED_EXTENSIONS = new Set(['.json', '.crumbnb', '.crumbtrail']);

/**
 * Discover breadcrumb trail files within a directory.
 * @param directory - Directory to search.
 */
export async function findTrailFiles(directory: string): Promise<TrailFileDescriptor[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const descriptors: TrailFileDescriptor[] = [];
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile()) {
        return;
      }
      const extension = path.extname(entry.name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(extension)) {
        return;
      }
      const fullPath = path.join(directory, entry.name);
      try {
        const trail = await loadBreadcrumbTrail(fullPath);
        descriptors.push({
          path: fullPath,
          id: trail.id,
          title: trail.title,
          summary: trail.description
        });
      } catch (error) {
        console.warn(`Skipping malformed breadcrumb file ${entry.name}:`, error);
      }
    })
  );
  descriptors.sort((a, b) => a.title.localeCompare(b.title));
  return descriptors;
}
