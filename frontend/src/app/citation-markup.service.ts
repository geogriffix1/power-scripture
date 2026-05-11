// src/app/citation-markup.service.ts
import { Injectable, signal } from '@angular/core';
import {
  CitationVerseMarkup,
  CitationVerseMarkupKind,
  PristineSelection
} from './model/citationVerseMarkup.model';
import { CitationVerseExtendedModel, NullCitationVerse } from './model/citationVerse.model';

@Injectable({ providedIn: 'root' })
export class CitationMarkupService {
  // --- Session state -----------------------------------------------------

  private sessionVerses: CitationVerseExtendedModel[] = [];

  private originalMarkups = <CitationVerseMarkup[]>[];
  private workingMarkups = <CitationVerseMarkup[]>[];

  // Persisted selection (so highlight can survive focus leaving the editor)
  private pristineSelection: PristineSelection | null = null;

  private undoStack = <CitationVerseMarkup[][]>[];
  private redoStack = <CitationVerseMarkup[][]>[];

  readonly activeVerseIsDirty = signal(false);
  readonly activeVerse = signal(new NullCitationVerse as CitationVerseExtendedModel);

  private nextTempId = -1;

  /** Bump this whenever markups/selection change so UIs can refresh via computed(). */
  readonly markupsVersion = signal(0);

  // --- Session lifecycle -------------------------------------------------

  beginSessionSnapshot(verse: CitationVerseExtendedModel): void {
    this.originalMarkups = verse.markups ? verse.markups.map(m => ({ ...m })) : [];
    this.workingMarkups = verse.markups ? verse.markups.map(m => ({ ...m })) : [];
    this.undoStack = [];
    this.redoStack = [];
    this.pristineSelection = null;
    this.activeVerse.set(({ ...verse }));
    this.activeVerseIsDirty.set(false);

    this.bump();
  }

  rollbackSession(): void {
    this.workingMarkups = [];
    this.workingMarkups.push(...this.originalMarkups.map(m => ({ ...m })));
    this.undoStack = [];
    this.redoStack = [];
    this.pristineSelection = null;
    this.update();
  }


  getSessionMarkups(): CitationVerseMarkup[] {
    return this.workingMarkups.map(m => ({ ...m }));
  }

  hasSessionChanges(): boolean {
    return this.areMarkupArraysEqual(this.originalMarkups, this.workingMarkups);
  }

  private areMarkupArraysEqual(a: CitationVerseMarkup[], b: CitationVerseMarkup[]): boolean {
    // if (a.length !== b.length) return false;
    // for (let i = 0; i < a.length; i++) {
    //   const x = a[i];
    //   const y = b[i];
    //   if (
    //     x.id !== y.id ||
    //     x.citationId !== y.citationId ||
    //     x.citationVerseId !== y.citationVerseId ||
    //     x.startIndex !== y.startIndex ||
    //     x.endIndex !== y.endIndex ||
    //     x.kind !== y.kind ||
    //     (x.replacementText ?? '') !== (y.replacementText ?? '')
    //   ) return false;
    //}

    return JSON.stringify(a) === JSON.stringify(b);
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

  getMarkups(): CitationVerseMarkup[] {
    return this.workingMarkups.map(m => ({ ...m }));
  }

  getOriginalMarkups(): CitationVerseMarkup[] {
    return this.originalMarkups.map(m => ({ ...m }));
  }

  deleteAllMarkups(): void {
    if (!this.workingMarkups.length) return;

    this.workingMarkups = [];
    this.pushUndoSnapshot();
    this.update();
  }

  // --- Undo/Redo (per verse) --------------------------------------------

  canUndo(): boolean {
    console.log("canUndo - undoStack:", this.undoStack);
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    console.log("canRedo - redoStack:", this.redoStack);
    return this.redoStack.length > 0;
  }

  resetUndoRedo(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.bump();
  }

  private pushUndoSnapshot(): void {
    const snapshot = this.getMarkups();
    this.undoStack.push(snapshot);
  }

  undo(): void {
    if (!this.undoStack) return;

    const current = this.undoStack.pop()!;
    this.redoStack.push(current.map(m => ({ ...m })));

    if (this.undoStack.length > 0) {
      const prev = this.undoStack.at(-1)!;
      this.workingMarkups = prev.map(m => ({ ...m }));
    }
    else {
      this.workingMarkups = this.getOriginalMarkups();
    }

    this.update();
  }

  redo(): void {
    if (!this.redoStack || this.redoStack.length === 0) return;

    const next = this.redoStack.pop()!;
    this.undoStack.push(next.map(m => ({ ...m })));
    this.workingMarkups = next.map(m => ({ ...m }));

    this.update();
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

  // private findSessionVerse(verseId: number): CitationVerseExtendedModel | undefined {
  //   return this.sessionVerses.find(v => v.id === verseId);
  // }

  private applySpanMarkupToVerse(
    verseId: number,
    kind: CitationVerseMarkupKind.Highlight | CitationVerseMarkupKind.Suppress | CitationVerseMarkupKind.Replace,
    replacementText?: string
  ): void {
    if (!this.pristineSelection || this.pristineSelection.verseId !== verseId) return;

    const { startIndex, endIndex } = this.pristineSelection;
    if (kind !== CitationVerseMarkupKind.Replace && startIndex === endIndex) return;

    const textLength = this.activeVerse().scripture.text.length;
    const clampedStart = Math.max(0, Math.min(startIndex, textLength));
    const clampedEnd = Math.max(clampedStart, Math.min(endIndex, textLength));

    let arr = this.workingMarkups;

    // non-overlap rule for span markups (paragraph allowed at same index)
    for (const m of arr) {
      if (m.kind === CitationVerseMarkupKind.Paragraph) continue;
      const overlap = clampedStart < m.endIndex && m.startIndex < clampedEnd;
      if (overlap) return;
    }

    const newMarkup: CitationVerseMarkup = {
      id: this.nextTempId--,
      citationId: this.activeVerse().citationId,
      citationVerseId: this.activeVerse().id,
      startIndex: clampedStart,
      endIndex: clampedEnd,
      kind,
      replacementText
    };

    arr = this.sortMarkups(arr.concat(newMarkup));
    this.workingMarkups = arr;
    this.pushUndoSnapshot();

    this.update();
  }

  private applyParagraphMarkup(verseId: number, index: number): void {
    const verse = this.activeVerse();
  
    const textLength = verse.scripture.text.length;
    const pos = Math.max(0, Math.min(index, textLength));

    let arr = this.workingMarkups;

    // avoid duplicate paragraph at same index
    const exists = arr.some(m =>
      m.kind === CitationVerseMarkupKind.Paragraph &&
      m.startIndex === pos &&
      m.endIndex === pos
    );
    if (exists) return;

    this.pushUndoSnapshot();

    const newMarkup: CitationVerseMarkup = {
      id: this.nextTempId--,
      citationId: verse.citationId,
      citationVerseId: verse.id,
      startIndex: pos,
      endIndex: pos,
      kind: CitationVerseMarkupKind.Paragraph
    };

    arr = this.sortMarkups(arr.concat(newMarkup));
    this.workingMarkups = arr;
    verse.markups = this.workingMarkups;

    this.update();
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

  private update(): void {
    let verse = this.activeVerse();
    verse.markups = this.getMarkups();
    this.activeVerse.set({...verse});
    this.activeVerseIsDirty.set(!this.areMarkupArraysEqual(this.originalMarkups, this.getMarkups()));

    console.log("update: ", this.activeVerse());
    this.bump();
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
    const markups = verse.markups;
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
    const markups = this.getMarkups();
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
          if (m.startIndex > 0 && text[m.startIndex - 1] !== ' ') html += " ";
          html += `[${this.escapeHtml(m.replacementText ?? '')}]`;
          if (m.endIndex < text.length && ![' ','.',',','!','?'].some(c => text[m.endIndex] === c)) html += " ";
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
