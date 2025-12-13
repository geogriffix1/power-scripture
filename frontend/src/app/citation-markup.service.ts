import { Injectable } from '@angular/core';
import {
  CitationVerseMarkup,
  CitationVerseMarkupKind,
  PristineSelection
} from './model/citationVerseMarkup.model';
import { CitationVerseExtendedModel } from './model/citationVerse.model';

@Injectable({
  providedIn: 'root'
})
export class CitationMarkupService {
  // --- Session state -----------------------------------------------------

  /** Verses participating in the current markup session (active range). */
  private sessionVerses: CitationVerseExtendedModel[] = [];

  /** Original markups snapshot (for full-session rollback). */
  private originalMarkupsByVerse = new Map<number, CitationVerseMarkup[]>();

  /** Working markups (current editable state for this session). */
  private workingMarkupsByVerse = new Map<number, CitationVerseMarkup[]>();

  /** Current pristine selection from the active verse editor. */
  private pristineSelection: PristineSelection | null = null;

  /**
   * Per-verse undo/redo stacks.
   * Each entry is a stack of snapshots (arrays of CitationVerseMarkup).
   */
  private undoStacks = new Map<number, CitationVerseMarkup[][]>();
  private redoStacks = new Map<number, CitationVerseMarkup[][]>();

  /** Temporary negative IDs for new markups (backend will assign real ones). */
  private nextTempId = -1;

  // --- Session lifecycle -------------------------------------------------

  /**
   * Begin a new session for the given active range of verses.
   * We take a snapshot of their current markups and work off copies.
   */
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
    }
  }

  /**
   * Roll back all markups in the session to the original snapshot.
   * Used when the user cancels the session.
   */
  rollbackSession(): void {
    this.workingMarkupsByVerse.clear();
    for (const [verseId, originalMarkups] of this.originalMarkupsByVerse.entries()) {
      this.workingMarkupsByVerse.set(
        verseId,
        originalMarkups.map(m => ({ ...m }))
      );
    }
    this.undoStacks.clear();
    this.redoStacks.clear();
    this.pristineSelection = null;
  }

  /**
   * Return all markups currently in the working session (for persistence).
   */
  getSessionMarkups(): CitationVerseMarkup[] {
    const result: CitationVerseMarkup[] = [];
    for (const [_, arr] of this.workingMarkupsByVerse.entries()) {
      for (const m of arr) {
        result.push({ ...m });
      }
    }
    return result;
  }

  /**
   * Check if there are any changes compared to the original snapshot.
   */
  hasSessionChanges(): boolean {
    for (const v of this.sessionVerses) {
      const original = this.originalMarkupsByVerse.get(v.id) ?? [];
      const current = this.workingMarkupsByVerse.get(v.id) ?? [];
      if (!this.areMarkupArraysEqual(original, current)) {
        return true;
      }
    }
    return false;
  }

  /** Helper: shallow equality by field for two markup arrays. */
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
      ) {
        return false;
      }
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

  // --- Public access to working markups ---------------------------------

  /**
   * Get the current working markups for a verse in this session.
   * Returns a cloned array so callers can't mutate internal state.
   */
  getMarkupsForVerse(verseId: number): CitationVerseMarkup[] {
    const arr = this.workingMarkupsByVerse.get(verseId) ?? [];
    return arr.map(m => ({ ...m }));
  }

  // --- Undo / Redo (per active verse) -----------------------------------

  /** True if we can undo for the current active verse (pristineSelection.verseId). */
  canUndo(): boolean {
    const verseId = this.pristineSelection?.verseId;
    if (!verseId) return false;
    const stack = this.undoStacks.get(verseId);
    return !!stack && stack.length > 0;
  }

  /** True if we can redo for the current active verse (pristineSelection.verseId). */
  canRedo(): boolean {
    const verseId = this.pristineSelection?.verseId;
    if (!verseId) return false;
    const stack = this.redoStacks.get(verseId);
    return !!stack && stack.length > 0;
  }

  /** Clear undo/redo stacks for a verse (called when moving to a new verse). */
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
    const currentSnapshot = current.map(m => ({ ...m }));
    const redoStack = this.redoStacks.get(verseId) ?? [];
    redoStack.push(currentSnapshot);
    this.redoStacks.set(verseId, redoStack);

    const prev = undoStack.pop()!;
    this.workingMarkupsByVerse.set(
      verseId,
      prev.map(m => ({ ...m }))
    );
  }

  redo(): void {
    const verseId = this.pristineSelection?.verseId;
    if (!verseId) return;
    const redoStack = this.redoStacks.get(verseId);
    if (!redoStack || redoStack.length === 0) return;

    const current = this.workingMarkupsByVerse.get(verseId) ?? [];
    const currentSnapshot = current.map(m => ({ ...m }));
    const undoStack = this.undoStacks.get(verseId) ?? [];
    undoStack.push(currentSnapshot);
    this.undoStacks.set(verseId, undoStack);

    const next = redoStack.pop()!;
    this.workingMarkupsByVerse.set(
      verseId,
      next.map(m => ({ ...m }))
    );
  }

  // --- Toolbox-facing APIs for applying markups -------------------------

  /** Toolbox → highlight button. Uses current pristine selection. */
  applyMarkupHighlightToActiveVerse(verseId: number): void {
    this.applySpanMarkupToActiveVerse(verseId, CitationVerseMarkupKind.Highlight);
  }

  /** Toolbox → suppress button. Uses current pristine selection. */
  applyMarkupSuppressToActiveVerse(verseId: number): void {
    this.applySpanMarkupToActiveVerse(verseId, CitationVerseMarkupKind.Suppress);
  }

  /** Toolbox → replace button. Uses current pristine selection + replacement text. */
  applyMarkupReplaceToActiveVerse(verseId: number, replacementText: string): void {
    if (!replacementText?.length) {
      console.warn('No replacement text; ignoring replace markup.');
      return;
    }
    this.applySpanMarkupToActiveVerse(
      verseId,
      CitationVerseMarkupKind.Replace,
      replacementText
    );
  }

  /**
   * Toolbox → paragraph button.
   * Paragraph position: if selection non-empty, use startIndex;
   * otherwise use caretIndex.
   */
  applyParagraphMarkupToActiveVerse(verseId: number): void {
    if (!this.pristineSelection || this.pristineSelection.verseId !== verseId) {
      return;
    }
    const sel = this.pristineSelection;
    const index =
      sel.startIndex !== sel.endIndex ? sel.startIndex : sel.caretIndex;
    this.applyParagraphMarkup(verseId, index);
  }

  // --- Internal markup helpers ------------------------------------------

  private findSessionVerse(verseId: number): CitationVerseExtendedModel | undefined {
    return this.sessionVerses.find(v => v.id === verseId);
  }

  private applySpanMarkupToActiveVerse(
    verseId: number,
    kind: CitationVerseMarkupKind.Highlight | CitationVerseMarkupKind.Suppress | CitationVerseMarkupKind.Replace,
    replacementText?: string
  ): void {
    if (!this.pristineSelection || this.pristineSelection.verseId !== verseId) {
      return;
    }

    const { startIndex, endIndex } = this.pristineSelection;
    if (startIndex === endIndex) {
      return; // no span
    }

    const verse = this.findSessionVerse(verseId);
    if (!verse) return;

    const textLength = verse.scripture.text.length;
    const clampedStart = Math.max(0, Math.min(startIndex, textLength));
    const clampedEnd = Math.max(clampedStart, Math.min(endIndex, textLength));

    let arr = this.workingMarkupsByVerse.get(verseId) ?? [];

    // prevent overlapping with existing *span* markups
    for (const m of arr) {
      if (m.kind === CitationVerseMarkupKind.Paragraph) continue;
      const overlap =
        clampedStart < m.endIndex && m.startIndex < clampedEnd;
      if (overlap) {
        console.warn('Attempted to add overlapping span markup; rejected.');
        return;
      }
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

    arr = arr.concat(newMarkup);
    arr = this.sortMarkups(arr);
    this.workingMarkupsByVerse.set(verseId, arr);
  }

  private applyParagraphMarkup(verseId: number, index: number): void {
    const verse = this.findSessionVerse(verseId);
    if (!verse) return;

    const textLength = verse.scripture.text.length;
    const pos = Math.max(0, Math.min(index, textLength));

    let arr = this.workingMarkupsByVerse.get(verseId) ?? [];

    // avoid duplicate paragraph at same index
    const exists = arr.some(
      m =>
        m.kind === CitationVerseMarkupKind.Paragraph &&
        m.startIndex === pos &&
        m.endIndex === pos
    );
    if (exists) {
      return;
    }

    this.pushUndoSnapshot(verseId);

    const newMarkup: CitationVerseMarkup = {
      id: this.nextTempId--,
      citationId: verse.citationId,
      verseId,
      startIndex: pos,
      endIndex: pos,
      kind: CitationVerseMarkupKind.Paragraph
    };

    arr = arr.concat(newMarkup);
    arr = this.sortMarkups(arr);
    this.workingMarkupsByVerse.set(verseId, arr);
  }

  /** Sort by startIndex; if same, Paragraph comes before span markups. */
  private sortMarkups(markups: CitationVerseMarkup[]): CitationVerseMarkup[] {
    return markups.slice().sort((a, b) => {
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      if (a.kind === CitationVerseMarkupKind.Paragraph &&
          b.kind !== CitationVerseMarkupKind.Paragraph) {
        return -1;
      }
      if (b.kind === CitationVerseMarkupKind.Paragraph &&
          a.kind !== CitationVerseMarkupKind.Paragraph) {
        return 1;
      }
      return 0;
    });
  }

  // --- Rendering helpers -------------------------------------------------

  /** HTML-escape helper (replaces the missing `escape` function). */
  private escapeHtml(text: string): string {
    // return text
    //   .replace(/&/g, '&amp;')
    //   .replace(/</g, '&lt;')
    //   .replace(/>/g, '&gt;')
    //   .replace(/"/g, '&quot;')
    //   .replace(/'/g, '&#39;');

    return text;
  }

  /**
   * Render a single verse as final output (range preview).
   * Does NOT include verse number/superscript or hidden-verse merging.
   */
  renderVerse(verse: CitationVerseExtendedModel): string {
    if (verse.hide) {
      // Hidden verses are handled/merged in renderRange; here we just say ellipsis.
      return '…';
    }
    const text = verse.scripture.text;
    const markups = this.getMarkupsForVerse(verse.id);
    return this.renderTextWithMarkups(text, markups);
  }

  /**
   * Render an entire range of verses as a single paragraph with:
   * - merged hidden verses into a single ellipsis
   * - superscript verse numbers except:
   *   - first visible verse in range
   *   - any hidden verse
   */
  renderRange(verses: CitationVerseExtendedModel[]): string {
    if (!verses.length) return '';

    let html = '';
    let firstVisibleRendered = false;
    let lastWasHiddenBlock = false;

    for (const verse of verses) {
      if (verse.hide) {
        // Merge consecutive hidden verses into a single ellipsis.
        if (!lastWasHiddenBlock) {
          if (html.length > 0 && !html.endsWith(' ')) {
            html += ' ';
          }
          html += '…';
          lastWasHiddenBlock = true;
        }
        continue;
      }

      const verseHtml = this.renderVerse(verse);
      if (!verseHtml) {
        continue;
      }

      if (html.length > 0 && !html.endsWith(' ')) {
        html += ' ';
      }

      if (!firstVisibleRendered) {
        // First visible verse: no superscript.
        html += verseHtml;
        firstVisibleRendered = true;
      } else {
        // Subsequent visible verses get superscript verse number.
        const verseNumber = verse.scripture.verse;
        html += `<sup>${this.escapeHtml(verseNumber.toString())}</sup>${verseHtml}`;
      }

      lastWasHiddenBlock = false;
    }

    return html;
  }

  /**
   * Render overlay for the active verse in the pristine editor.
   * This shows original text with colored spans where markups exist.
   */
  renderActiveVerseOverlay(verse: CitationVerseExtendedModel): string {
    const text = verse.scripture.text;
    const markups = this.getMarkupsForVerse(verse.id);
    if (!markups.length) {
      return `<span class="overlay-none">${this.escapeHtml(text)}</span>`;
    }

    const sorted = this.sortMarkups(markups);
    let html = '';
    let idx = 0;

    for (const m of sorted) {
      // text before markup
      if (m.startIndex > idx) {
        const raw = text.slice(idx, m.startIndex);
        html += `<span class="overlay-none">${this.escapeHtml(raw)}</span>`;
      }

      if (m.kind === CitationVerseMarkupKind.Paragraph) {
        // Show a subtle paragraph marker for debugging / visualization.
        html += `<span class="overlay-paragraph-marker">¶</span>`;
        idx = m.endIndex; // same as startIndex
        continue;
      }

      const rawSpan = text.slice(m.startIndex, m.endIndex);
      const esc = this.escapeHtml(rawSpan);

      let cls = 'overlay-highlight';
      if (m.kind === CitationVerseMarkupKind.Suppress) {
        cls = 'overlay-suppress';
      } else if (m.kind === CitationVerseMarkupKind.Replace) {
        cls = 'overlay-replace';
      }

      html += `<span class="${cls}">${esc}</span>`;
      idx = m.endIndex;
    }

    if (idx < text.length) {
      const tail = text.slice(idx);
      html += `<span class="overlay-none">${this.escapeHtml(tail)}</span>`;
    }

    return html;
  }

  /**
   * Core renderer used by renderVerse for final output semantics:
   * - highlight → <mark>text</mark>
   * - suppress  → …
   * - replace   → [replacementText]
   * - paragraph → <br/><br/>
   */
  private renderTextWithMarkups(
    text: string,
    markups: CitationVerseMarkup[]
  ): string {
    if (!markups.length) {
      return this.escapeHtml(text);
    }

    const sorted = this.sortMarkups(markups);
    let html = '';
    let idx = 0;

    for (const m of sorted) {
      // plain text before markup
      if (m.startIndex > idx) {
        const raw = text.slice(idx, m.startIndex);
        html += this.escapeHtml(raw);
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
          const replacement = m.replacementText ?? '';
          html += `[${this.escapeHtml(replacement)}]`;
          idx = m.endIndex;
          break;
        }
        case CitationVerseMarkupKind.Highlight:
        default: {
          const rawSpan = text.slice(m.startIndex, m.endIndex);
          html += `<mark>${this.escapeHtml(rawSpan)}</mark>`;
          idx = m.endIndex;
          break;
        }
      }
    }

    if (idx < text.length) {
      html += this.escapeHtml(text.slice(idx));
    }

    return html;
  }
}
