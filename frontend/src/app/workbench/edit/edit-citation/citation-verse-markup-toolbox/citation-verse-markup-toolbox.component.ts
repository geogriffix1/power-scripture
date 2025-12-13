import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import { CitationMarkupService } from '../../../../citation-markup.service';

@Component({
  selector: 'app-citation-verse-markup-toolbox',
  standalone: true,
  imports: [],
  templateUrl: './citation-verse-markup-toolbox.component.html',
  styleUrls: ['./citation-verse-markup-toolbox.component.css']
})
export class CitationVerseMarkupToolboxComponent {

  @Input() activeVerse!: CitationVerseExtendedModel;
  @Input() activeVerses!: CitationVerseExtendedModel[];

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  /** Replacement textbox content */
  replacementDraft: string = '';

  constructor(private markupService: CitationMarkupService) {}

  // ---- Undo / Redo ----
  get canUndo(): boolean {
    return this.markupService.canUndo();
  }

  get canRedo(): boolean {
    return this.markupService.canRedo();
  }

  // ---- Highlight ----
  onHighlight(): void {
    const sel = this.markupService.getPristineSelection();
    if (!sel) return;
    this.markupService.applyMarkupHighlightToActiveVerse(this.activeVerse.id);
  }

  // ---- Suppress ----
  onSuppress(): void {
    const sel = this.markupService.getPristineSelection();
    if (!sel) return;
    this.markupService.applyMarkupSuppressToActiveVerse(this.activeVerse.id);
  }

  // ---- Replace ----
  onReplace(): void {
    const sel = this.markupService.getPristineSelection();
    if (!sel) return;

    this.markupService.applyMarkupReplaceToActiveVerse(
      this.activeVerse.id,
      this.replacementDraft
    );
  }

  // ---- Paragraph break ----
  onParagraphBreak(): void {
    const sel = this.markupService.getPristineSelection();
    if (!sel) return;

    this.markupService.applyParagraphMarkupToActiveVerse(this.activeVerse.id);
  }

  // ---- Undo / Redo buttons ----
  onUndo(): void {
    this.markupService.undo();
  }

  onRedo(): void {
    this.markupService.redo();
  }

  // ---- Save & Cancel ----
  onSave(): void {
    this.save.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
