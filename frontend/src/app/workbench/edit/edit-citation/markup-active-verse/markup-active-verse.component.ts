import {
  Component,
  ElementRef,
  Input,
  Signal,
  ViewChild,
  computed,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import { CitationMarkupService } from '../../../../citation-markup.service';
import { PristineSelection } from '../../../../model/citationVerseMarkup.model';

@Component({
  selector: 'app-markup-active-verse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './markup-active-verse.component.html',
  styleUrls: ['./markup-active-verse.component.css']
})
export class MarkupActiveVerseComponent {
  private markup = inject(CitationMarkupService);

  @Input({ required: true }) activeVerse!: Signal<CitationVerseExtendedModel>;

  @ViewChild('editor', { static: true }) editorRef!: ElementRef<HTMLDivElement>;

  overlayHtml = computed(() => {
    // force refresh on version changes
    this.markup.markupsVersion();
    return this.markup.renderActiveVerseOverlay(this.activeVerse());
  });

  renderedVerseHtml = computed(() => {
    this.markup.markupsVersion();
    const v = this.activeVerse();
    const hasMarkups = (this.markup.getMarkupsForVerse(v.id)?.length ?? 0) > 0;
    return hasMarkups ? this.markup.renderVerse(v) : '';
  });

  constructor() {
    // Ensure service has a verseId ready so toolbox works immediately on first entry.
    effect(() => {
      const v = this.activeVerse();
      if (!v?.id) return;

      // set editor text
      const el = this.editorRef?.nativeElement;
      if (el && el.textContent !== v.scripture.text) {
        el.textContent = v.scripture.text;
      }

      this.markup.ensureActiveVerseSelection(v.id);
    });
  }

  // --- Selection tracking ------------------------------------------------

  onEditorMouseUp() {
    this.captureSelection();
  }

  onEditorKeyUp() {
    this.captureSelection();
  }

  onEditorFocus() {
    this.captureSelection();
  }

  /** Rule: selection clears when user clicks inside pristine editor. */
  onEditorMouseDown() {
    this.markup.clearPristineSelection();
  }

  private captureSelection() {
    const root = this.editorRef.nativeElement;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
      return;
    }

    const startIndex = this.offsetFromStart(root, range.startContainer, range.startOffset);
    const endIndex = this.offsetFromStart(root, range.endContainer, range.endOffset);

    const s = Math.max(0, Math.min(startIndex, endIndex));
    const e = Math.max(0, Math.max(startIndex, endIndex));

    // caretIndex: if collapsed use caret, else caretIndex = start of selection (your rule)
    const caretIndex = (s === e) ? s : s;

    const verseId = this.activeVerse().id;

    const selection: PristineSelection = {
      verseId,
      startIndex: s,
      endIndex: e,
      caretIndex
    };

    this.markup.setPristineSelection(selection);
  }

  /**
   * Compute offset from start of root to (node, nodeOffset) using Range text length.
   * This avoids "backslash throws count off" issues caused by HTML escaping.
   */
  private offsetFromStart(root: HTMLElement, node: Node, nodeOffset: number): number {
    const r = document.createRange();
    r.setStart(root, 0);
    r.setEnd(node, nodeOffset);
    return r.toString().length;
  }

  // --- Read-only contenteditable behavior --------------------------------

  onBeforeInput(e: InputEvent) {
    // Prevent edits but allow selection & caret movement
    if (e.inputType.startsWith('insert') || e.inputType.startsWith('delete')) {
      e.preventDefault();
    }
  }

  onKeyDown(e: KeyboardEvent) {
    // Allow navigation + selection keys
    const allowed =
      e.key.startsWith('Arrow') ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown' ||
      e.key === 'Shift' ||
      e.key === 'Control' ||
      e.key === 'Alt' ||
      (e.ctrlKey && (e.key === 'a' || e.key === 'A')); // Ctrl+A select all

    if (allowed) return;

    // Block character input, backspace/delete, etc.
    e.preventDefault();
  }
}
