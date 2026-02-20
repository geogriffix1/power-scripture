// bible-books.service.ts
import { Injectable } from "@angular/core";

export interface BibleBookListJson {
  books: Array<{ code: string, book: string, chapterCount: number }>;
}

export interface BookInfo {
  book: string;          // canonical e.g. "1 John"
  chapterCount: number;  // e.g. 5
  sortBase: string;      // "John" for "1 John"
  sortNum: 0 | 1 | 2 | 3;// 0 for no prefix, else 1/2/3
  oneChapter: boolean;   // chapterCount === 1
  code: string;          // three-character book name abbreviation
}

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function computeSort(book: string): { sortBase: string; sortNum: 0 | 1 | 2 | 3 } {
  const m = book.match(/^(1|2|3)\s+(.+)$/);
  if (!m) return { sortBase: book, sortNum: 0 };
  return { sortBase: m[2], sortNum: Number(m[1]) as 1 | 2 | 3 };
}

@Injectable({ providedIn: "root" })
export class BibleBooksService {
  private loaded = false;
  private byNorm = new Map<string, BookInfo>();
  private all: BookInfo[] = [];

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;

    const res = await fetch("/assets/BibleBookList.json", { cache: "no-cache" });
    const json = (await res.json()) as BibleBookListJson;

    this.all = json.books.map(b => {
      const { sortBase, sortNum } = computeSort(b.book);
      return {
        book: b.book,
        chapterCount: b.chapterCount,
        sortBase,
        sortNum,
        oneChapter: b.chapterCount === 1,
        code: b.code
      };
    });

    this.byNorm = new Map(this.all.map(b => [norm(b.book), b]));
    this.loaded = true;
  }

  getBookInfoExactSpellingCaseInsensitive(bookInput: string): BookInfo | undefined {
    return this.byNorm.get(norm(bookInput));
  }

  getHelpListSorted(): string[] {
    const copy = [...this.all];
    copy.sort((a, b) => {
      const baseA = a.sortBase.toLowerCase();
      const baseB = b.sortBase.toLowerCase();
      if (baseA < baseB) return -1;
      if (baseA > baseB) return 1;
      return a.sortNum - b.sortNum; // John, 1 John, 2 John, 3 John
    });
    return copy.map(b => b.book);
  }

  getAllBooks(): BookInfo[] {
    return [...this.all];
  }
}
