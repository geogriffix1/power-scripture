import { Component, Input, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import { CitationMarkupService } from '../../../../citation-markup.service';

@Component({
  selector: 'app-citation-verse-markup-toolbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './citation-verse-markup-toolbox.component.html',
  styleUrls: ['./citation-verse-markup-toolbox.component.css']
})
export class CitationVerseMarkupToolboxComponent {
  public markupService = inject(CitationMarkupService);

  @Input({ required: true }) activeVerse!: Signal<CitationVerseExtendedModel>;

  replacementDraft = '';

  highlight() {
    const verseId = this.activeVerse().id;
    this.markupService.applyMarkupHighlightToActiveVerse(verseId);
    this.markupService.clearPristineSelection(); // rule: clear when toolbox button clicked
  }

  suppress() {
    const verseId = this.activeVerse().id;
    this.markupService.applyMarkupSuppressToActiveVerse(verseId);
    this.markupService.clearPristineSelection();
  }

  paragraph() {
    const verseId = this.activeVerse().id;
    this.markupService.applyParagraphMarkupToActiveVerse(verseId);
    this.markupService.clearPristineSelection();
  }

  replace() {
    const verseId = this.activeVerse().id;
    if (!this.replacementDraft?.length) return;
    this.markupService.applyMarkupReplaceToActiveVerse(verseId, this.replacementDraft);
    this.markupService.clearPristineSelection();
  }

  deleteAllMarkups() {
    const verseId = this.activeVerse().id;
    this.markupService.deleteAllMarkupsForVerse(verseId);
    this.markupService.clearPristineSelection();
  }

  undo() {
    this.markupService.undo();
    this.markupService.clearPristineSelection();
  }

  redo() {
    this.markupService.redo();
    this.markupService.clearPristineSelection();
  }
}
