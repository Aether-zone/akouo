/** An inclusive byte range, the way an HTTP `Range` header describes one. */
export interface ByteRange {
  start: number;
  /** Inclusive: the whole of a 10-byte file is `{ start: 0, end: 9 }`. */
  end: number;
}

/** What a `Range` header asks for, once checked against the size of the file. */
export type ByteRangeRequest =
  | { kind: 'full' }
  | { kind: 'partial'; range: ByteRange }
  | { kind: 'unsatisfiable' };

/** `bytes=0-499`, `bytes=500-`, `bytes=-500` — one range, which is what players send. */
const SINGLE_RANGE = /^bytes=(\d*)-(\d*)$/;

/**
 * Reads a `Range` header against a known file size.
 *
 * Anything this does not understand — a multi-range request, a unit other than bytes,
 * a malformed header — comes back as `full`: serving the whole file is always a
 * correct answer to a range request, where a 416 would break playback.
 */
export const parseByteRange = (
  header: string | undefined,
  size: number,
): ByteRangeRequest => {
  if (!header) {
    return { kind: 'full' };
  }

  const match = SINGLE_RANGE.exec(header.trim());

  if (!match) {
    return { kind: 'full' };
  }

  const [, rawStart, rawEnd] = match;

  // `bytes=-` names neither end, so it asks for nothing in particular.
  if (rawStart === '' && rawEnd === '') {
    return { kind: 'full' };
  }

  let start: number;
  let end: number;

  if (rawStart === '') {
    // A suffix range: `bytes=-500` is the *last* 500 bytes.
    const suffix = Number(rawEnd);

    if (suffix === 0) {
      return { kind: 'unsatisfiable' };
    }

    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    // An end past the last byte is not an error; it means "to the end".
    end = rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1);
  }

  if (size === 0 || start >= size || start > end) {
    return { kind: 'unsatisfiable' };
  }

  return { kind: 'partial', range: { start, end } };
};

/** Number of bytes a range covers, for `Content-Length`. */
export const byteRangeLength = (range: ByteRange): number =>
  range.end - range.start + 1;
