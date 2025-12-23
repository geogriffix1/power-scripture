import {
  Component, ElementRef, HostListener, Input, Signal, computed, inject, viewChild
} from '@angular/core';
import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import { CitationMarkupService } from '../../../../citation-markup.service';
import { PristineSelection } from '../../../../model/citationVerseMarkup.model';

@Component({
  selector: 'app-markup-active-verse',
  standalone: true,
  templateUrl: './markup-active-verse.component.html',
  styleUrls: ['./markup-active-verse.component.css']
})
export class MarkupActiveVerseComponent {
  private markup = inject(CitationMarkupService);

  @Input({ required: true }) activeVerse!: Signal<CitationVerseExtendedModel>;

  private pristineElRef = viewChild.required<ElementRef<HTMLDivElement>>('pristine');

  // overlay html depends on markupsVersion so it refreshes immediately after toolbox actions
  overlayHtml = computed(() => {
    this.markup.markupsVersion();
    return this.markup.renderActiveVerseOverlay(this.activeVerse());
  });

  // rendered verse under pristine (only if any markups exist on active verse)
  renderedActiveVerseHtml = computed(() => {
    this.markup.markupsVersion();
    const v = this.activeVerse();
    const mk = this.markup.getMarkupsForVerse(v.id);
    if (!mk.length) return '';
    return this.markup.renderVerse(v);
  });

  hasAnyMarkups = computed(() => {
    this.markup.markupsVersion();
    return this.markup.getMarkupsForVerse(this.activeVerse().id).length > 0;
  });

  // Disallow edits but allow navigation keys
  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    const allowed = [
      'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
      'Home','End','PageUp','PageDown',
      'Shift','Control','Alt','Meta'
    ];

    const ctrlCombo = e.ctrlKey || e.metaKey;

    // allow copy/select combos
    if (ctrlCombo && (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'c')) return;

    // allow navigation
    if (allowed.includes(e.key)) return;

    // block anything that would modify text
    e.preventDefault();
  }

  // Keep the pristine text exactly equal to scripture text (no HTML escaping here)
  ngAfterViewInit() {
    this.syncPristineText();
  }

  ngOnChanges() {
    // active verse changed
    queueMicrotask(() => this.syncPristineText());
  }

  private syncPristineText() {
    const el = this.pristineElRef().nativeElement;
    const text = this.activeVerse().scripture.text ?? '';
    // textContent preserves backslashes exactly; no HTML interpretation
    if (el.textContent !== text) {
      el.textContent = text;
    }
  }

  onMouseUpOrKeyUp() {
    this.updateSelectionFromDom();
  }

  onBlur() {
    // when losing focus, preserve caret location using current selection
    this.updateSelectionFromDom();
  }

  private updateSelectionFromDom() {
    const verse = this.activeVerse();
    const root = this.pristineElRef().nativeElement;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.markup.setPristineSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);

    // compute offsets based on text nodes inside the contenteditable root
    const startIndex = this.getOffsetWithin(root, range.startContainer, range.startOffset);
    const endIndex   = this.getOffsetWithin(root, range.endContainer, range.endOffset);

    const caretIndex = endIndex; // caret at end of selection; service decides paragraph index rule

    const selection: PristineSelection = {
      verseId: verse.id,
      startIndex: Math.min(startIndex, endIndex),
      endIndex: Math.max(startIndex, endIndex),
      caretIndex
    };

    this.markup.setPristineSelection(selection);
  }

  // Robust offset calculator: counts characters in text nodes (backslashes included correctly)
  private getOffsetWithin(root: HTMLElement, node: Node, nodeOffset: number): number {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let offset = 0;

    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text;
      if (textNode === node) {
        return offset + nodeOffset;
      }
      offset += (textNode.nodeValue?.length ?? 0);
    }

    // If selection container isn't a text node (e.g. root), best-effort fallback
    return offset;
  }
}
