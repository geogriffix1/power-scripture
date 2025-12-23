// src/app/workbench/edit/edit-citation/citation-verse-markup-toolbox/citation-verse-markup-toolbox.component.ts

import { Component, Input, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CitationMarkupService } from '../../../../citation-markup.service';
import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';

@Component({
  selector: 'app-citation-verse-markup-toolbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './citation-verse-markup-toolbox.component.html',
  styleUrls: ['./citation-verse-markup-toolbox.component.css']
})
export class CitationVerseMarkupToolboxComponent {

  private markup = inject(CitationMarkupService);

  /** Active verse (already selected elsewhere) */
  @Input({ required: true }) activeVerse!: Signal<CitationVerseExtendedModel>;

  /** Replacement text draft (NOT a signal — simple string is correct) */
  replacementDraft = '';

  // --- Button handlers --------------------------------------------------

  highlight(): void {
    this.markup.applyMarkupHighlightToActiveVerse(this.activeVerse().id);
  }

  suppress(): void {
    this.markup.applyMarkupSuppressToActiveVerse(this.activeVerse().id);
  }

  replace(): void {
    if (!this.replacementDraft.trim()) return;
    this.markup.applyMarkupReplaceToActiveVerse(
      this.activeVerse().id,
      this.replacementDraft
    );
    this.replacementDraft = '';
  }

  paragraph(): void {
    this.markup.applyParagraphMarkupToActiveVerse(this.activeVerse().id);
  }

  deleteAll(): void {
    this.markup.deleteAllMarkupsForVerse(this.activeVerse().id);
  }

  undo(): void {
    this.markup.undo();
  }

  redo(): void {
    this.markup.redo();
  }

  // --- State helpers ----------------------------------------------------

  canUndo(): boolean {
    return this.markup.canUndo();
  }

  canRedo(): boolean {
    return this.markup.canRedo();
  }
}
