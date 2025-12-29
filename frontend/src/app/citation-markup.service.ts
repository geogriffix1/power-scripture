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

  // Persisted selection (so highlight can survive focus leaving the editor)
  private pristineSelection: PristineSelection | null = null;

  private undoStacks = new Map<number, CitationVerseMarkup[][]>();
  private redoStacks = new Map<number, CitationVerseMarkup[][]>();
  private activeVerseId: number | null = null;

  private nextTempId = -1;

  /** Bump this whenever markups/selection change so UIs can refresh via computed(). */
  readonly markupsVersion = signal(0);

  // --- Session lifecycle -------------------------------------------------

  beginSessionSnapshot(verses: CitationVerseExtendedModel[]): void {
    this.sessionVerses = verses.slice();

    this.originalMarkupsByVerse.clear();
    this.workingMarkupsByVerse.clear();
    this.undoStacks.clear();
    this.redoStacks.clear();
    this.pristineSelection = null;
    this.activeVerseId = verses.length > 0 ? this.sessionVerses[0].id : null;

    for (const v of verses) {
      const cloned = (v.markups ?? []).map(m => ({ ...m }));
      this.originalMarkupsByVerse.set(v.id, cloned.map(m => ({ ...m })));
      this.workingMarkupsByVerse.set(v.id, cloned);
    }

    this.bump();
  }

  rollbackSession(): void {
    this.workingMarkupsByVerse.clear();

    for (const [verseId, original] of this.originalMarkupsByVerse.entries()) {
      this.workingMarkupsByVerse.set(verseId, original.map(m => ({ ...m })));
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
        x.citationVerseId !== y.citationVerseId ||
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
    this.bump();
  }

  getPristineSelection(): PristineSelection | null {
    return this.pristineSelection;
  }

  /** Called by toolbox after any tool action (per your rule). */
  clearPristineSelection(): void {
    this.pristineSelection = null;
    this.bump();
  }

  /** Ensure verseId is set even before user selects (fixes "buttons don't work first time"). */
  ensureActiveVerseSelection(verseId: number): void {
    if (!this.pristineSelection || this.pristineSelection.verseId !== verseId) {
      this.pristineSelection = {
        verseId,
        startIndex: 0,
        endIndex: 0,
        caretIndex: 0
      };
      this.bump();
    }
  }

  // --- Working markups access -------------------------------------------

  getMarkupsForVerse(verseId: number): CitationVerseMarkup[] {
    const arr = this.workingMarkupsByVerse.get(verseId) ?? [];
    return arr.map(m => ({ ...m }));
  }

  getOriginalMarkupsForVerse(verseId: number): CitationVerseMarkup[] {
    const arr = this.originalMarkupsByVerse.get(verseId) ?? [];
    return arr.map(m => ({ ...m}));
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
    const verseId = this.activeVerseId;
    if (!verseId) return false;
    const stack = this.undoStacks.get(verseId);
    return !!stack && stack.length > 0;
  }

  canRedo(): boolean {
    const verseId = this.activeVerseId;
    if (!verseId) return false;
    const stack = this.redoStacks.get(verseId);
    return !!stack && stack.length > 0;
  }

  resetUndoRedoForVerse(verseId: number): void {
    this.undoStacks.delete(verseId);
    this.redoStacks.delete(verseId);
    this.bump();
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
    const verseId = this.activeVerseId;
    if (!verseId) return;

    const undoStack = this.undoStacks.get(verseId);
    if (!undoStack || undoStack.length === 0) return;

    const current = undoStack.pop()!;
    const redoStack = this.redoStacks.get(verseId) ?? [];
    redoStack.push(current.map(m => ({ ...m })));
    this.redoStacks.set(verseId, redoStack);

    if (undoStack.length > 0) {
      const prev = undoStack.at(-1);
      this.workingMarkupsByVerse.set(verseId, prev!.map(m => ({ ...m })));
    }
    else {
      const prev = this.originalMarkupsByVerse.get(verseId);
      this.workingMarkupsByVerse.set(verseId, prev!.map(m => ({ ...m })));
    }

    const verse = this.findSessionVerse(verseId);
    if (verse) verse.markups = this.getMarkupsForVerse(verseId);

    this.bump();
  }

  redo(): void {
    const verseId = this.activeVerseId;
    if (!verseId) return;

    const redoStack = this.redoStacks.get(verseId);
    if (!redoStack || redoStack.length === 0) return;

    const undoStack = this.undoStacks.get(verseId) ?? [];
    const next = redoStack.pop()!;
    undoStack.push(next.map(m => ({ ...m })));
    this.undoStacks.set(verseId, undoStack);

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

    // non-overlap rule for span markups (paragraph allowed at same index)
    for (const m of arr) {
      if (m.kind === CitationVerseMarkupKind.Paragraph) continue;
      const overlap = clampedStart < m.endIndex && m.startIndex < clampedEnd;
      if (overlap) return;
    }

    const newMarkup: CitationVerseMarkup = {
      id: this.nextTempId--,
      citationId: verse.citationId,
      citationVerseId: verseId,
      startIndex: clampedStart,
      endIndex: clampedEnd,
      kind,
      replacementText
    };

    arr = this.sortMarkups(arr.concat(newMarkup));
    this.workingMarkupsByVerse.set(verseId, arr);
    verse.markups = this.getMarkupsForVerse(verseId);

    console.log("pushing new markup:");
    console.log(newMarkup);
    this.pushUndoSnapshot(verseId);

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
      citationVerseId: verseId,
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

  private bump(): void {
    this.markupsVersion.update(x => x + 1);
  }

  // --- Rendering helpers -------------------------------------------------

  private escapeHtml(text: string): string {
    // IMPORTANT: This is correct for [innerHTML]. "&" will display as "&".
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * FINAL verse render semantics:
   * - highlight → <mark>text</mark>
   * - suppress  → …
   * - replace   → [replacementText]
   * - paragraph → <br/><br/>
   *
   * NOTE: hide is handled at range level by merging hidden verses.
   */
  renderVerse(verse: CitationVerseExtendedModel): string {
    const text = verse.scripture.text;
    const markups = this.getMarkupsForVerse(verse.id);
    return this.renderTextWithMarkups(text, markups);
  }

  /**
   * Render a full range as ONE paragraph-ish HTML string:
   * - Consecutive hidden verses merged into ONE ellipsis
   * - Superscript verse numbers for verses after hidden-block or after first visible verse
   * - First visible verse has no superscript
   * - Hidden verses have no superscript
   */
  renderRange(verses: CitationVerseExtendedModel[]): string {
    if (!verses?.length) return '';

    let html = '';
    let firstVisibleRendered = false;
    let lastWasHiddenBlock = false;

    for (const v of verses) {
      const isHidden = v.hide == "Y";

      if (isHidden) {
        if (!lastWasHiddenBlock) {
          if (html.length > 0 && !html.endsWith(' ')) html += ' ';
          html += '…';
          lastWasHiddenBlock = true;
        }
        continue;
      }

      const verseHtml = this.renderVerse(v);
      if (!verseHtml) continue;

      if (html.length > 0 && !html.endsWith(' ')) html += ' ';

      if (!firstVisibleRendered) {
        html += verseHtml; // first visible verse: no superscript
        firstVisibleRendered = true;
      } else {
        // if we just came out of a hidden-block, this verse MUST have superscript (your rule)
        const verseNumber = v.scripture.verse;
        html += `<sup>${this.escapeHtml(String(verseNumber))}</sup>${verseHtml}`;
      }

      lastWasHiddenBlock = false;
    }

    return html;
  }

  /**
   * Overlay renderer for pristine editor:
   * - shows subtle background for already-marked spans
   * - shows stronger background for the current selection (persisted in service)
   * - text itself is transparent so you don't see double-text (editor provides visible text)
   */
  renderActiveVerseOverlay(verse: CitationVerseExtendedModel): string {
    // depend on version so computed() refreshes
    this.markupsVersion();

    const text = verse.scripture.text ?? '';
    const markups = this.getMarkupsForVerse(verse.id);
    const sel = (this.pristineSelection?.verseId === verse.id) ? this.pristineSelection : null;

    // Build boundaries from markups + selection
    type Boundary = { i: number };
    const boundaries: Boundary[] = [{ i: 0 }, { i: text.length }];

    for (const m of markups) {
      if (m.kind === CitationVerseMarkupKind.Paragraph) continue;
      boundaries.push({ i: m.startIndex }, { i: m.endIndex });
    }
    if (sel && sel.startIndex !== sel.endIndex) {
      boundaries.push({ i: sel.startIndex }, { i: sel.endIndex });
    }

    // unique + sort
    const uniq = Array.from(new Set(boundaries.map(b => Math.max(0, Math.min(b.i, text.length))))).sort((a, b) => a - b);

    let html = '';
    for (let k = 0; k < uniq.length - 1; k++) {
      const a = uniq[k];
      const b = uniq[k + 1];
      if (a === b) continue;

      const slice = text.slice(a, b);
      const esc = this.escapeHtml(slice);

      const inSelection = !!(sel && sel.startIndex !== sel.endIndex && a >= sel.startIndex && b <= sel.endIndex);
      const inMarkedSpan = markups.some(m =>
        m.kind !== CitationVerseMarkupKind.Paragraph &&
        a >= m.startIndex &&
        b <= m.endIndex
      );

      const cls = inSelection
        ? 'ov ov-selection'
        : inMarkedSpan
          ? 'ov ov-marked'
          : 'ov ov-none';

      html += `<span class="${cls}">${esc}</span>`;
    }

    return html;
  }

  private renderTextWithMarkups(text: string, markups: CitationVerseMarkup[]): string {
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
          idx = m.endIndex;
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
}
