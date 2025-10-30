const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Result of splitting a markdown document into frontmatter data and body.
 */
export interface ParsedFrontmatter {
  readonly data: Record<string, unknown>;
  readonly body: string;
}

function countIndent(line: string): number {
  const match = /^\s*/.exec(line);
  return match ? match[0].length : 0;
}

function parseScalar(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseArray(lines: string[], startIndex: number, indent: number): { values: string[]; next: number } {
  const values: string[] = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim().length === 0) {
      index++;
      continue;
    }
    const currentIndent = countIndent(line);
    if (currentIndent < indent) {
      break;
    }
    if (currentIndent !== indent || !line.trim().startsWith('- ')) {
      break;
    }
    values.push(parseScalar(line.trim().slice(2)));
    index++;
  }
  return { values, next: index };
}

function parseEntries(
  lines: string[],
  startIndex: number,
  indent: number
): { value: Record<string, unknown>; next: number } {
  const result: Record<string, unknown> = {};
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim().length === 0) {
      index++;
      continue;
    }
    const currentIndent = countIndent(line);
    if (currentIndent < indent) {
      break;
    }
    if (currentIndent > indent) {
      throw new Error('Invalid indentation detected in frontmatter.');
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      throw new Error('List items must be associated with a key.');
    }
    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) {
      throw new Error(`Unable to parse frontmatter line: "${trimmed}".`);
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const remainder = trimmed.slice(separatorIndex + 1);
    index++;
    if (remainder.trim().length > 0) {
      result[key] = parseScalar(remainder);
      continue;
    }
    if (index < lines.length && lines[index].trim().startsWith('- ')) {
      const parsed = parseArray(lines, index, indent + 2);
      result[key] = parsed.values;
      index = parsed.next;
      continue;
    }
    if (index < lines.length && countIndent(lines[index]) >= indent + 2) {
      const parsed = parseEntries(lines, index, indent + 2);
      result[key] = parsed.value;
      index = parsed.next;
      continue;
    }
    result[key] = '';
  }
  return { value: result, next: index };
}

function parseYamlObject(source: string): Record<string, unknown> {
  const lines = source.split(/\r?\n/);
  const parsed = parseEntries(lines, 0, 0);
  return parsed.value;
}

function escapeScalar(value: string): string {
  if (
    value.includes(':') ||
    value.includes('#') ||
    value.includes('- ') ||
    value.includes('"')
  ) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function stringifyEntries(value: Record<string, unknown>, indent = 0): string[] {
  const lines: string[] = [];
  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined) {
      continue;
    }
    const padding = ' '.repeat(indent);
    if (Array.isArray(raw)) {
      if (raw.length === 0) {
        continue;
      }
      lines.push(`${padding}${key}:`);
      for (const entry of raw) {
        const arrayPrefix = ' '.repeat(indent + 2);
        lines.push(`${arrayPrefix}- ${escapeScalar(String(entry))}`);
      }
      continue;
    }
    if (typeof raw === 'object' && raw !== null) {
      const nestedLines = stringifyEntries(raw as Record<string, unknown>, indent + 2);
      if (nestedLines.length === 0) {
        continue;
      }
      lines.push(`${padding}${key}:`);
      lines.push(...nestedLines);
      continue;
    }
    const scalar = escapeScalar(String(raw));
    lines.push(`${padding}${key}: ${scalar}`);
  }
  return lines;
}

/**
 * Split a markdown document into frontmatter data and body content.
 */
export function parseFrontmatterDocument(raw: string): ParsedFrontmatter {
  const match = FRONTMATTER_PATTERN.exec(raw.trimStart());
  if (!match) {
    throw new Error('Markdown document is missing YAML frontmatter.');
  }
  const [, yamlContent] = match;
  const data = parseYamlObject(yamlContent);
  const body = raw.slice(match[0].length);
  return {
    data,
    body
  };
}

/**
 * Compose a markdown document with YAML frontmatter and normalized body content.
 */
export function serializeFrontmatterDocument(data: Record<string, unknown>, body: string): string {
  const yamlLines = stringifyEntries(data);
  const yamlSource = yamlLines.join('\n');
  const normalizedBody = body.replace(/^\s*\n/, '').replace(/\s+$/, '');
  const trailingNewline = normalizedBody.length === 0 ? '' : '\n';
  const header = yamlSource.length > 0 ? `${yamlSource}\n` : '';
  return `---\n${header}---\n${normalizedBody}${trailingNewline}`;
}
