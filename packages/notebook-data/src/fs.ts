import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Ensure a directory exists before writing files to it.
 */
export async function ensureDirectory(directory: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
}

/**
 * Write content to a temporary file before renaming for atomic updates.
 */
export async function writeFileAtomic(filePath: string, contents: string): Promise<void> {
  const directory = path.dirname(filePath);
  await ensureDirectory(directory);
  const tempPath = path.join(directory, `.${path.basename(filePath)}.${randomUUID()}`);
  await fs.writeFile(tempPath, contents, 'utf8');
  await fs.rename(tempPath, filePath);
}

/**
 * Remove a file if it exists, suppressing missing-file errors.
 */
export async function deleteIfExists(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Read a UTF-8 file if present, returning undefined when missing.
 */
export async function readFileIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

/**
 * List non-hidden files in a directory, returning an empty array when absent.
 */
export async function listFiles(directory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory);
    return entries
      .filter((entry) => !entry.startsWith('.'))
      .map((entry) => path.join(directory, entry));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Retrieve the modification timestamp signature for a file.
 */
export async function getFileSignature(filePath: string): Promise<number | undefined> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtimeMs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}
