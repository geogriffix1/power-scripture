import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import {
  CitationVerseMarkup,
  CitationVerseMarkupKind,
  PristineSelection
} from '../../../../model/citationVerseMarkup.model';
import { CitationMarkupService } from '../../../../citation-markup.service';

@Component({
  selector: 'app-markup-active-verse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './markup-active-verse.component.html',
  styleUrls: ['./markup-active-verse.component.css']
})
export class MarkupActiveVerseComponent {
  private markupService = inject(CitationMarkupService);

  @Input({ required: true })
  activeVerse!: CitationVerseExtendedModel;

  @ViewChild('pristineEditor', { static: true })
  pristineEditorRef!: ElementRef<HTMLDivElement>;

  // Overlay HTML computed from the active verse + its markups
  readonly overlayHtml = computed(() => {
    if (!this.activeVerse?.scripture?.text) {
      return '';
    }
    return this.buildOverlayHtml(
      this.activeVerse.scripture.text,
      this.markupService.getMarkupsForVerse(this.activeVerse.id)
    );
  });

  constructor() {
    // You can keep an effect here if later you want to react
    // when activeVerse changes, but right now we don't need extra logic.
    effect(() => {
      const v = this.activeVerse;
      // just to subscribe to changes; no-op body
      void v;
    });
  }

  // --------------------------------------------------------
  // Overlay rendering logic (uses escapeHtml helper)
  // --------------------------------------------------------
  private buildOverlayHtml(
    text: string,
    markups: CitationVerseMarkup[]
  ): string {
    if (!markups?.length) {
      // No markups: overlay is just raw escaped text
      return this.escapeHtml(text);
    }

    // Sort by startIndex; if same index, Paragraph first
    const sorted = [...markups].sort((a, b) => {
      if (a.startIndex === b.startIndex) {
        if (a.kind === CitationVerseMarkupKind.Paragraph &&
            b.kind !== CitationVerseMarkupKind.Paragraph) {
          return -1;
        }
        if (b.kind === CitationVerseMarkupKind.Paragraph &&
            a.kind !== CitationVerseMarkupKind.Paragraph) {
          return 1;
        }
        return 0;
      }
      return a.startIndex - b.startIndex;
    });

    let html = '';
    let idx = 0;

    for (const m of sorted) {
      // text before markup
      if (m.startIndex > idx) {
        html += this.escapeHtml(text.slice(idx, m.startIndex));
      }

      // Paragraph markups don't color spans; they are structural.
      // For the overlay we just leave underlying text as-is.
      if (m.kind === CitationVerseMarkupKind.Paragraph) {
        // no visible span for the paragraph itself here
        // (paragraph breaks handled when rendering the range)
      } else {
        const seg = text.slice(m.startIndex, m.endIndex);
        const escapedSeg = this.escapeHtml(seg);
        const cssClass = this.classForMarkup(m.kind);
        html += `<span class="${cssClass}">${escapedSeg}</span>`;
      }

      idx = Math.max(idx, m.endIndex);
    }

    // trailing text after last markup
    if (idx < text.length) {
      html += this.escapeHtml(text.slice(idx));
    }

    return html;
  }

  private classForMarkup(kind: CitationVerseMarkupKind): string {
    switch (kind) {
      case CitationVerseMarkupKind.Highlight:
        return 'markup-highlight';
      case CitationVerseMarkupKind.Suppress:
        return 'markup-suppress';
      case CitationVerseMarkupKind.Replace:
        return 'markup-replace';
      case CitationVerseMarkupKind.Paragraph:
        // paragraphs are structural; no color span in overlay
        return '';
      default:
        return '';
    }
  }

  // ✅ Missing helper: escape function
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --------------------------------------------------------
  // Pristine editor: block text changes, allow caret & selection
  // --------------------------------------------------------

  onKeydown(event: KeyboardEvent): void {
    // Allow navigation keys and modifiers (no text change)
    const navKeys = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'PageUp', 'PageDown',
      'Shift', 'Control', 'Alt', 'Meta', 'Tab'
    ];

    // F-keys
    if (event.key.startsWith('F')) {
      return;
    }

    // Allow Ctrl/Meta + arrows (word navigation, etc.)
    if ((event.ctrlKey || event.metaKey) &&
        (event.key.startsWith('Arrow') || navKeys.includes(event.key))) {
      return;
    }

    if (navKeys.includes(event.key)) {
      return;
    }

    // Block everything that could mutate text:
    // - character keys
    // - Backspace, Delete, Enter, etc.
    event.preventDefault();
  }

  onMouseUp(): void {
    this.updateSelectionFromDom();
  }

  onKeyUp(): void {
    this.updateSelectionFromDom();
  }

  onBlur(): void {
    // We don't move the caret in the service here;
    // the service keeps the last caretIndex from updateSelectionFromDom().
    // You may later add a fake-caret in an overlay using that index.
  }

  onFocus(): void {
    // When regaining focus, you can restore caret from service if needed.
    // For now we'll let the browser keep where it was if possible.
  }

  private updateSelectionFromDom(): void {
    const verse = this.activeVerse;
    if (!verse) {
      return;
    }

    const editor = this.pristineEditorRef?.nativeElement;
    if (!editor) {
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return;
    }

    const range = sel.getRangeAt(0);

    // Ensure the selection is inside our editor
    if (!editor.contains(range.startContainer) ||
        !editor.contains(range.endContainer)) {
      return;
    }

    // Because the editor's content is plain text (no spans), we can
    // use the range offsets directly as indices into scripture.text.
    const pristineSelection = {
      verseId: this.activeVerse.id,
      startIndex: range.startOffset,
      endIndex: range.endOffset,
      caretIndex: 0
    }

    this.markupService.setPristineSelection(pristineSelection);
  }
}
