export interface ByteRangeChunk {
  index: number;
  start: number;
  end: number;
}

export const PARALLEL_CHUNK_MIN_BYTES = 262_144; // 256 KB

export function parseTotalSizeFromContentRange(contentRange: string | null | undefined): number | null {
  if (!contentRange) return null;
  const slashIdx = contentRange.lastIndexOf('/');
  if (slashIdx < 0) return null;
  const rawTotal = contentRange.slice(slashIdx + 1).trim();
  if (!rawTotal || rawTotal === '*') return null;
  const parsed = Number(rawTotal);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function canUseParallelRange(
  totalBytes: number | null | undefined,
  acceptRanges: boolean,
  connections: number,
  minSizeBytes = PARALLEL_CHUNK_MIN_BYTES
): boolean {
  if (!acceptRanges) return false;
  if (totalBytes == null || !Number.isFinite(totalBytes) || totalBytes < minSizeBytes) return false;
  return connections > 1;
}

export function computeByteRanges(totalBytes: number, connections: number): ByteRangeChunk[] {
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) return [];
  const safeConns = Math.max(1, Math.min(8, Math.floor(connections)));
  if (safeConns === 1 || totalBytes < PARALLEL_CHUNK_MIN_BYTES) {
    return [{ index: 0, start: 0, end: totalBytes - 1 }];
  }

  const chunkSize = Math.ceil(totalBytes / safeConns);
  const ranges: ByteRangeChunk[] = [];
  let cursor = 0;
  let index = 0;

  while (cursor < totalBytes) {
    const end = Math.min(totalBytes - 1, cursor + chunkSize - 1);
    ranges.push({ index, start: cursor, end });
    cursor = end + 1;
    index += 1;
  }
  return ranges;
}
