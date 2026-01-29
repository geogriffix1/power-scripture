// citation-range-parser.ts
import { BibleBooksService, BookInfo } from "../../bible-books.service";

/**
 * A fully explicit range understood by the backend.
 */
export interface RangeSpec {
  book: string;      // canonical book name, e.g. "John", "1 John", "Jude"
  chapter: number;   // always explicit internally
  start: number;     // >= 1
  end: number;       // >= start
}

/* ============================================================
   Helpers
   ============================================================ */

function slugBook(book: string): string {
  // backend examples: genesis1:..., john3:..., jude5-7
  return book.toLowerCase().replace(/\s+/g, "");
}

function parseStartEnd(token: string): { start: number; end: number } {
  const m = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!m) {
    throw new Error(`Illegal verse segment "${token}". Use "16" or "16-20".`);
  }

  const start = parseInt(m[1], 10);
  const end = m[2] ? parseInt(m[2], 10) : start;

  if (start < 1 || end < 1 || end < start) {
    throw new Error(`Invalid verse range "${token}".`);
  }

  return { start, end };
}

/**
 * Longest-prefix, case-insensitive book match.
 */
function matchLeadingBook(
  token: string,
  books: BookInfo[]
): { book: BookInfo; rest: string } | null {
  let best: BookInfo | null = null;
  let bestLen = -1;

  for (const b of books) {
    const name = b.book;
    if (token.length < name.length) continue;

    if (token.substring(0, name.length).toLowerCase() === name.toLowerCase()) {
      const boundary = token.substring(name.length, name.length + 1);
      if (boundary === "" || /\s/.test(boundary)) {
        if (name.length > bestLen) {
          best = b;
          bestLen = name.length;
        }
      }
    }
  }

  if (!best) return null;
  return { book: best, rest: token.slice(bestLen).trim() };
}

function assertChapterValid(book: BookInfo, chapter: number) {
  if (chapter < 1 || chapter > book.chapterCount) {
    throw new Error(
      `Chapter ${chapter} is invalid for "${book.book}" (1-${book.chapterCount}).`
    );
  }
  if (book.chapterCount === 1 && chapter !== 1) {
    throw new Error(`"${book.book}" has only one chapter.`);
  }
}

/* ============================================================
   Public API
   ============================================================ */

/**
 * Parses a citation string into explicit (book, chapter, start, end) ranges.
 *
 * Supports:
 *   - John 3:16,18-20
 *   - John 3:16, 4:1-2
 *   - John 3:16, Luke 2:1-3
 *   - Jude 5-7, 10
 *   - 2 John 6
 */
export async function parseCitationToRanges(
  input: string,
  booksService: BibleBooksService
): Promise<RangeSpec[]> {
  await booksService.ensureLoaded();
  const books = booksService.getAllBooks();

  const tokens = input
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  if (!tokens.length) {
    throw new Error("Citation is empty.");
  }

  const ranges: RangeSpec[] = [];
  let currentBook: BookInfo | undefined;
  let currentChapter: number | undefined;

  for (const token of tokens) {
    // Try "<Book> <Chapter>:<verses>" OR "<Book> <verses>" (one-chapter)
    const bookMatch = matchLeadingBook(token, books);

    if (bookMatch) {
      currentBook = bookMatch.book;
      const rest = bookMatch.rest;

      // Chapter explicitly provided
      const chv = rest.match(/^(\d+)\s*:\s*(.+)$/);
      if (chv) {
        const chapter = parseInt(chv[1], 10);
        assertChapterValid(currentBook, chapter);
        currentChapter = chapter;

        const se = parseStartEnd(chv[2]);
        ranges.push({
          book: currentBook.book,
          chapter,
          start: se.start,
          end: se.end
        });
        continue;
      }

      // One-chapter shorthand: "<Book> <verses>"
      if (currentBook.chapterCount !== 1) {
        throw new Error(
          `"${currentBook.book}" requires a chapter (e.g. "${currentBook.book} 3:16").`
        );
      }

      currentChapter = 1;
      const se = parseStartEnd(rest);
      ranges.push({
        book: currentBook.book,
        chapter: 1,
        start: se.start,
        end: se.end
      });
      continue;
    }

    // "<Chapter>:<verses>" (reuse book)
    const chv = token.match(/^(\d+)\s*:\s*(.+)$/);
    if (chv) {
      if (!currentBook) {
        throw new Error(`Chapter specified without a book: "${token}".`);
      }

      const chapter = parseInt(chv[1], 10);
      assertChapterValid(currentBook, chapter);
      currentChapter = chapter;

      const se = parseStartEnd(chv[2]);
      ranges.push({
        book: currentBook.book,
        chapter,
        start: se.start,
        end: se.end
      });
      continue;
    }

    // "<verses>" (reuse book + chapter)
    if (!currentBook) {
      throw new Error(`Verse specified without a book: "${token}".`);
    }

    if (!currentChapter) {
      if (currentBook.chapterCount === 1) {
        currentChapter = 1;
      } else {
        throw new Error(
          `Verse specified without a chapter for "${currentBook.book}".`
        );
      }
    }

    const se = parseStartEnd(token);
    ranges.push({
      book: currentBook.book,
      chapter: currentChapter,
      start: se.start,
      end: se.end
    });
  }

  return ranges;
}

/**
 * Converts explicit ranges into backend resolver format.
 *
 * Examples:
 *   John 3:16        -> john3:16
 *   John 3:16-18     -> john3:16-18
 *   Jude 5-7         -> jude5-7
 *   2 John 6         -> 2john6
 */
export function rangesToResolverQuery(
  ranges: RangeSpec[],
  booksService: BibleBooksService
): string {
  const bookMap = new Map(
    booksService.getAllBooks().map(b => [b.book, b.chapterCount])
  );

  return ranges
    .map(r => {
      const slug = slugBook(r.book);
      const versePart = r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`;
      const chapterCount = bookMap.get(r.book) ?? 0;

      // One-chapter books: jude5-7
      if (chapterCount === 1) {
        return `${slug}${versePart}`;
      }

      return `${slug}${r.chapter}:${versePart}`;
    })
    .join(",");
}
