// src/app/citation-markup.service.ts
import { Injectable, signal } from '@angular/core';
import {
  CitationVerseMarkup,
  CitationVerseMarkupKind,
  PristineSelection
} from './model/citationVerseMarkup.model';
import { CitationVerseExtendedModel } from './model/citationVerse.model';

@Injectable({ providedIn: 'root' })
export class CitationMarkupService {
  // --- Session state -----------------------------------------------------

  private sessionVerses: CitationVerseExtendedModel[] = [];

  private originalMarkupsByVerse = new Map<number, CitationVerseMarkup[]>();
  private workingMarkupsByVerse = new Map<number, CitationVerseMarkup[]>();

  private pristineSelection: PristineSelection | null = null;

  private undoStacks = new Map<number, CitationVerseMarkup[][]>();
  private redoStacks = new Map<number, CitationVerseMarkup[][]>();

  private nextTempId = -1;

  /** Bump this whenever markups change so UIs can refresh via computed(). */
  readonly markupsVersion = signal(0);

  // --- Session lifecycle -------------------------------------------------

  beginSessionSnapshot(verses: CitationVerseExtendedModel[]): void {
    this.sessionVerses = verses.slice();
    this.originalMarkupsByVerse.clear();
    this.workingMarkupsByVerse.clear();
    this.undoStacks.clear();
    this.redoStacks.clear();
    this.pristineSelection = null;

    for (const v of verses) {
      const cloned = (v.markups ?? []).map(m => ({ ...m }));
      this.originalMarkupsByVerse.set(v.id, cloned.map(m => ({ ...m })));
      this.workingMarkupsByVerse.set(v.id, cloned);

      // keep the verse objects aligned with working state
      v.markups = this.getMarkupsForVerse(v.id);
    }

    this.bump();
  }

  rollbackSession(): void {
    this.workingMarkupsByVerse.clear();

    for (const [verseId, originalMarkups] of this.originalMarkupsByVerse.entries()) {
      this.workingMarkupsByVerse.set(verseId, originalMarkups.map(m => ({ ...m })));
      const verse = this.findSessionVerse(verseId);
      if (verse) verse.markups = this.getMarkupsForVerse(verseId);
    }

    this.undoStacks.clear();
    this.redoStacks.clear();
    this.pristineSelection = null;
    this.bump();
  }

  getSessionMarkups(): CitationVerseMarkup[] {
    const result: CitationVerseMarkup[] = [];
    for (const arr of this.workingMarkupsByVerse.values()) {
      for (const m of arr) result.push({ ...m });
    }
    return result;
  }

  hasSessionChanges(): boolean {
    for (const v of this.sessionVerses) {
      const original = this.originalMarkupsByVerse.get(v.id) ?? [];
      const current = this.workingMarkupsByVerse.get(v.id) ?? [];
      if (!this.areMarkupArraysEqual(original, current)) return true;
    }
    return false;
  }

  private areMarkupArraysEqual(a: CitationVerseMarkup[], b: CitationVerseMarkup[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      if (
        x.id !== y.id ||
        x.citationId !== y.citationId ||
        x.verseId !== y.verseId ||
        x.startIndex !== y.startIndex ||
        x.endIndex !== y.endIndex ||
        x.kind !== y.kind ||
        (x.replacementText ?? '') !== (y.replacementText ?? '')
      ) return false;
    }
    return true;
  }

  // --- Pristine selection ------------------------------------------------

  setPristineSelection(selection: PristineSelection | null): void {
    this.pristineSelection = selection;
  }

  getPristineSelection(): PristineSelection | null {
    return this.pristineSelection;
  }

  // --- Working markups access -------------------------------------------

  getMarkupsForVerse(verseId: number): CitationVerseMarkup[] {
    const arr = this.workingMarkupsByVerse.get(verseId) ?? [];
    return arr.map(m => ({ ...m }));
  }

  deleteAllMarkupsForVerse(verseId: number): void {
    const current = this.workingMarkupsByVerse.get(verseId) ?? [];
    if (!current.length) return;

    this.pushUndoSnapshot(verseId);
    this.workingMarkupsByVerse.set(verseId, []);

    const verse = this.findSessionVerse(verseId);
    if (verse) verse.markups = [];

    this.bump();
  }

  // --- Undo/Redo (per verse) --------------------------------------------

  canUndo(): boolean {
    const verseId = this.pristineSelection?.verseId;
    if (!verseId) return false;
    const stack = this.undoStacks.get(verseId);
    return !!stack && stack.length > 0;
  }

  canRedo(): boolean {
    const verseId = this.pristineSelection?.verseId;
    if (!verseId) return false;
    const stack = this.redoStacks.get(verseId);
    return !!stack && stack.length > 0;
  }

  resetUndoRedoForVerse(verseId: number): void {
    this.undoStacks.delete(verseId);
    this.redoStacks.delete(verseId);
  }

  private pushUndoSnapshot(verseId: number): void {
    const current = this.workingMarkupsByVerse.get(verseId) ?? [];
    const snapshot = current.map(m => ({ ...m }));
    const stack = this.undoStacks.get(verseId) ?? [];
    stack.push(snapshot);
    this.undoStacks.set(verseId, stack);
    this.redoStacks.delete(verseId);
  }

  undo(): void {
    const verseId = this.pristineSelection?.verseId;
    if (!verseId) return;

    const undoStack = this.undoStacks.get(verseId);
    if (!undoStack || undoStack.length === 0) return;

    const current = this.workingMarkupsByVerse.get(verseId) ?? [];
    const redoStack = this.redoStacks.get(verseId) ?? [];
    redoStack.push(current.map(m => ({ ...m })));
    this.redoStacks.set(verseId, redoStack);

    const prev = undoStack.pop()!;
    this.workingMarkupsByVerse.set(verseId, prev.map(m => ({ ...m })));

    const verse = this.findSessionVerse(verseId);
    if (verse) verse.markups = this.getMarkupsForVerse(verseId);

    this.bump();
  }

  redo(): void {
    const verseId = this.pristineSelection?.verseId;
    if (!verseId) return;

    const redoStack = this.redoStacks.get(verseId);
    if (!redoStack || redoStack.length === 0) return;

    const current = this.workingMarkupsByVerse.get(verseId) ?? [];
    const undoStack = this.undoStacks.get(verseId) ?? [];
    undoStack.push(current.map(m => ({ ...m })));
    this.undoStacks.set(verseId, undoStack);

    const next = redoStack.pop()!;
    this.workingMarkupsByVerse.set(verseId, next.map(m => ({ ...m })));

    const verse = this.findSessionVerse(verseId);
    if (verse) verse.markups = this.getMarkupsForVerse(verseId);

    this.bump();
  }

  // --- Toolbox APIs ------------------------------------------------------

  applyMarkupHighlightToActiveVerse(verseId: number): void {
    this.applySpanMarkupToVerse(verseId, CitationVerseMarkupKind.Highlight);
  }

  applyMarkupSuppressToActiveVerse(verseId: number): void {
    this.applySpanMarkupToVerse(verseId, CitationVerseMarkupKind.Suppress);
  }

  applyMarkupReplaceToActiveVerse(verseId: number, replacementText: string): void {
    this.applySpanMarkupToVerse(verseId, CitationVerseMarkupKind.Replace, replacementText);
  }

  applyParagraphMarkupToActiveVerse(verseId: number): void {
    if (!this.pristineSelection || this.pristineSelection.verseId !== verseId) return;

    const sel = this.pristineSelection;
    const index = (sel.startIndex !== sel.endIndex) ? sel.startIndex : sel.caretIndex;
    this.applyParagraphMarkup(verseId, index);
  }

  // --- Internal helpers --------------------------------------------------

  private bump(): void {
    this.markupsVersion.update(x => x + 1);
  }

  private findSessionVerse(verseId: number): CitationVerseExtendedModel | undefined {
    return this.sessionVerses.find(v => v.id === verseId);
  }

  private applySpanMarkupToVerse(
    verseId: number,
    kind: CitationVerseMarkupKind.Highlight | CitationVerseMarkupKind.Suppress | CitationVerseMarkupKind.Replace,
    replacementText?: string
  ): void {
    if (!this.pristineSelection || this.pristineSelection.verseId !== verseId) return;

    const verse = this.findSessionVerse(verseId);
    if (!verse) return;

    const { startIndex, endIndex } = this.pristineSelection;
    if (startIndex === endIndex) return;

    const textLength = verse.scripture.text.length;
    const clampedStart = Math.max(0, Math.min(startIndex, textLength));
    const clampedEnd = Math.max(clampedStart, Math.min(endIndex, textLength));

    let arr = this.workingMarkupsByVerse.get(verseId) ?? [];

    // no overlap with other span markups (paragraphs allowed at same index)
    for (const m of arr) {
      if (m.kind === CitationVerseMarkupKind.Paragraph) continue;
      const overlap = clampedStart < m.endIndex && m.startIndex < clampedEnd;
      if (overlap) return;
    }

    this.pushUndoSnapshot(verseId);

    const newMarkup: CitationVerseMarkup = {
      id: this.nextTempId--,
      citationId: verse.citationId,
      verseId,
      startIndex: clampedStart,
      endIndex: clampedEnd,
      kind,
      replacementText
    };

    arr = this.sortMarkups(arr.concat(newMarkup));
    this.workingMarkupsByVerse.set(verseId, arr);
    verse.markups = this.getMarkupsForVerse(verseId);

    this.bump();
  }

  private applyParagraphMarkup(verseId: number, index: number): void {
    const verse = this.findSessionVerse(verseId);
    if (!verse) return;

    const textLength = verse.scripture.text.length;
    const pos = Math.max(0, Math.min(index, textLength));

    let arr = this.workingMarkupsByVerse.get(verseId) ?? [];

    // avoid duplicate paragraph at same index
    const exists = arr.some(m =>
      m.kind === CitationVerseMarkupKind.Paragraph &&
      m.startIndex === pos &&
      m.endIndex === pos
    );
    if (exists) return;

    this.pushUndoSnapshot(verseId);

    const newMarkup: CitationVerseMarkup = {
      id: this.nextTempId--,
      citationId: verse.citationId,
      verseId,
      startIndex: pos,
      endIndex: pos,
      kind: CitationVerseMarkupKind.Paragraph
    };

    arr = this.sortMarkups(arr.concat(newMarkup));
    this.workingMarkupsByVerse.set(verseId, arr);
    verse.markups = this.getMarkupsForVerse(verseId);

    this.bump();
  }

  /** Sort by startIndex; if same, Paragraph first. */
  private sortMarkups(markups: CitationVerseMarkup[]): CitationVerseMarkup[] {
    return markups.slice().sort((a, b) => {
      if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
      if (a.kind === CitationVerseMarkupKind.Paragraph && b.kind !== CitationVerseMarkupKind.Paragraph) return -1;
      if (b.kind === CitationVerseMarkupKind.Paragraph && a.kind !== CitationVerseMarkupKind.Paragraph) return 1;
      return 0;
    });
  }

  // --- Rendering helpers -------------------------------------------------

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * PUBLIC on purpose: components can use the same canonical renderer.
   * - highlight → <mark>text</mark>
   * - suppress  → …
   * - replace   → [replacementText]
   * - paragraph → (handled in caller with <br/><br/>)
   */
  renderTextWithMarkups(text: string, markups: CitationVerseMarkup[]): string {
    if (!markups.length) return this.escapeHtml(text);

    const sorted = this.sortMarkups(markups);
    let html = '';
    let idx = 0;

    for (const m of sorted) {
      if (m.startIndex > idx) {
        html += this.escapeHtml(text.slice(idx, m.startIndex));
      }

      switch (m.kind) {
        case CitationVerseMarkupKind.Paragraph: {
          html += '<br/><br/>';
          idx = m.endIndex; // same as startIndex
          break;
        }
        case CitationVerseMarkupKind.Suppress: {
          html += '…';
          idx = m.endIndex;
          break;
        }
        case CitationVerseMarkupKind.Replace: {
          html += `[${this.escapeHtml(m.replacementText ?? '')}]`;
          idx = m.endIndex;
          break;
        }
        case CitationVerseMarkupKind.Highlight:
        default: {
          html += `<mark>${this.escapeHtml(text.slice(m.startIndex, m.endIndex))}</mark>`;
          idx = m.endIndex;
          break;
        }
      }
    }

    if (idx < text.length) html += this.escapeHtml(text.slice(idx));
    return html;
  }

  /**
   * Render a single verse (NO verse-number prefix here).
   * Hide verses render as '…' (range merge is handled by renderRange()).
   */
  renderVerse(verse: CitationVerseExtendedModel): string {
    this.markupsVersion(); // dependency for computed() consumers
    if (verse.hide) return '…';
    return this.renderTextWithMarkups(
      verse.scripture.text,
      this.getMarkupsForVerse(verse.id)
    );
  }

  /**
   * Render an entire range of verses as ONE paragraph:
   * - merged consecutive hidden verses into one ellipsis
   * - superscript verse numbers except:
   *    - first visible verse
   *    - hidden verses (never show number)
   */
  renderRange(verses: CitationVerseExtendedModel[]): string {
    this.markupsVersion(); // dependency
    if (!verses.length) return '';

    let html = '';
    let firstVisibleRendered = false;
    let lastWasHiddenBlock = false;

    for (const verse of verses) {
      if (verse.hide) {
        if (!lastWasHiddenBlock) {
          if (html.length > 0 && !html.endsWith(' ')) html += ' ';
          html += '…';
          lastWasHiddenBlock = true;
        }
        continue;
      }

      const verseHtml = this.renderVerse(verse);
      if (!verseHtml) continue;

      if (html.length > 0 && !html.endsWith(' ')) html += ' ';

      if (!firstVisibleRendered) {
        html += verseHtml; // first visible verse: no superscript
        firstVisibleRendered = true;
      } else {
        html += `<sup>${this.escapeHtml(String(verse.scripture.verse))}</sup>${verseHtml}`;
      }

      lastWasHiddenBlock = false;
    }

    return html;
  }

  /**
   * Overlay HTML for the pristine active verse editor:
   * Colors existing marked-up spans differently from unmarked text.
   * Paragraph marks show as a subtle "¶" marker.
   */
  renderActiveVerseOverlay(verse: CitationVerseExtendedModel): string {
    this.markupsVersion(); // dependency
    const text = verse.scripture.text;
    const markups = this.getMarkupsForVerse(verse.id);

    if (!markups.length) {
      return `<span class="overlay-none">${this.escapeHtml(text)}</span>`;
    }

    const sorted = this.sortMarkups(markups);
    let html = '';
    let idx = 0;

    for (const m of sorted) {
      if (m.startIndex > idx) {
        html += `<span class="overlay-none">${this.escapeHtml(text.slice(idx, m.startIndex))}</span>`;
      }

      if (m.kind === CitationVerseMarkupKind.Paragraph) {
        html += `<span class="overlay-paragraph-marker">¶</span>`;
        idx = m.endIndex;
        continue;
      }

      const rawSpan = text.slice(m.startIndex, m.endIndex);
      const esc = this.escapeHtml(rawSpan);

      let cls = 'overlay-highlight';
      if (m.kind === CitationVerseMarkupKind.Suppress) cls = 'overlay-suppress';
      if (m.kind === CitationVerseMarkupKind.Replace) cls = 'overlay-replace';

      html += `<span class="${cls}">${esc}</span>`;
      idx = m.endIndex;
    }

    if (idx < text.length) {
      html += `<span class="overlay-none">${this.escapeHtml(text.slice(idx))}</span>`;
    }

    return html;
  }
}
