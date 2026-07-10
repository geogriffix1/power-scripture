import { Component, input, output } from '@angular/core';
import { CitationVerseExtendedModel, NullCitationVerse } from '../../../../model/citationVerse.model';
import { CitationVerseMarkup, CitationVerseMarkupKind } from '../../../../model/citationVerseMarkup.model';
import { CitationMarkupService } from '../../../../citation-markup.service';
import { CitationVerseMarkupWorkareaComponent } from '../citation-verse-markup-workarea/citation-verse-markup-workarea.component';
import { BibleService } from '../../../../bible.service';

@Component({
  selector: 'app-citation-verse-select',
  imports: [CitationVerseMarkupWorkareaComponent],
  templateUrl: './citation-verse-select.component.html',
  styleUrl: './citation-verse-select.component.css'
})
export class CitationVerseSelectComponent {

  constructor(
    public markupService: CitationMarkupService,
    private bibleService: BibleService) {}

  // SIGNAL INPUT
  scriptureRangeLabel = input.required<string>();
  verses = input.required<CitationVerseExtendedModel[]>();

  // SIGNAL OUTPUTS
  hideChanged = output<{ id: number; hidden: boolean }>();
  markupClicked = output<CitationVerseExtendedModel>();
  closeSelectedRange = output<void>();

  onHideChanged(v: CitationVerseExtendedModel, checked: boolean) {
    v.hide = checked ? "Y" : "N";
    this.hideChanged.emit({ id: v.id, hidden: checked });
  }

  isFirstVerse(v: CitationVerseExtendedModel): boolean {
    return this.sortedVerses()[0]?.id === v.id;
  }

  isNewParagraph(v: CitationVerseExtendedModel): boolean {
    if (this.isFirstVerse(v)) {
      return true;
    }

    const previousVerse = this.previousConsecutiveVerse(v);
    return !!previousVerse && !!this.findTrailingParagraphMarkup(previousVerse);
  }

  onNewParagraphChanged(v: CitationVerseExtendedModel, checked: boolean) {
    if (this.isFirstVerse(v)) {
      return;
    }

    const previousVerse = this.previousConsecutiveVerse(v);
    if (!previousVerse) {
      return;
    }

    if (checked) {
      this.addTrailingParagraphMarkup(previousVerse);
    }
    else {
      this.removeTrailingParagraphMarkup(previousVerse);
    }
  }

  onMarkupClicked(v: CitationVerseExtendedModel) {
    this.markupService.beginSessionSnapshot(v);
    this.markupClicked.emit(v);
  }

  onCloseSelectedRange() {
    this.closeSelectedRange.emit();
  }

  onVerseSessionChanged(event:any) {

  }

  OnSaveMarkups() {
    // Markups that have been saved have positive id values. Markups that have not been saved
    // have negative id values. The editor does not edit existing markups, but it will delete all
    // existing markups for a given verse if it is directed to do so.
    const original = this.markupService.getOriginalMarkups();
    const verse = this.markupService.activeVerse();
    if (original.length > 0 && !verse.markups.some(markup => markup.id > 0)) {
      this.bibleService.deleteCitationVerseMarkups(this.markupService.activeVerse().id);
    }

    const markupsToSave  = this.markupService.activeVerse().markups.filter(markup => markup.id < 0);
    markupsToSave.forEach(markup => {
      this.bibleService.createCitationVerseMarkup(markup);
    });

    this.markupService.activeVerse.set(new NullCitationVerse);
  }

  OnCancelMarkups() {
    const original = this.markupService.getOriginalMarkups();
    const verse = this.markupService.activeVerse();
    verse.markups = original.map(markup => ({...markup}));
    const index = this.verses().findIndex(v => v.id == verse.id );
    this.verses()[index] = {
      id: verse.id,
      citationId: verse.citationId,
      scriptureId: verse.scripture.id,
      scripture: verse.scripture,
      hide: verse.hide,
      markups: verse.markups
    };

    this.markupService.activeVerse.set(new NullCitationVerse);
  }

  renderVerse(verse:CitationVerseExtendedModel) {
    const text = this.markupService.renderVerse(verse);
    return text;
  }

  private sortedVerses(): CitationVerseExtendedModel[] {
    return this.verses().slice().sort((a, b) => a.scripture.bibleOrder - b.scripture.bibleOrder);
  }

  private previousConsecutiveVerse(v: CitationVerseExtendedModel): CitationVerseExtendedModel | null {
    const verses = this.sortedVerses();
    const index = verses.findIndex(verse => verse.id === v.id);
    if (index <= 0) {
      return null;
    }

    const previousVerse = verses[index - 1];
    return previousVerse.scripture.bibleOrder + 1 === v.scripture.bibleOrder
      ? previousVerse
      : null;
  }

  private findTrailingParagraphMarkup(v: CitationVerseExtendedModel): CitationVerseMarkup | undefined {
    const trailingStart = this.trailingParagraphStart(v.scripture.text ?? "");

    return v.markups.find(markup =>
      markup.kind === CitationVerseMarkupKind.Paragraph &&
      markup.startIndex === markup.endIndex &&
      markup.startIndex >= trailingStart &&
      markup.startIndex <= (v.scripture.text ?? "").length
    );
  }

  private trailingParagraphStart(text: string): number {
    const lastContentIndex = text.search(/\s*$/) - 1;
    return Math.max(0, lastContentIndex);
  }

  private addTrailingParagraphMarkup(v: CitationVerseExtendedModel) {
    if (this.findTrailingParagraphMarkup(v)) {
      return;
    }

    const markup: CitationVerseMarkup = {
      id: -Date.now(),
      citationId: v.citationId,
      citationVerseId: v.id,
      startIndex: (v.scripture.text ?? "").length,
      endIndex: (v.scripture.text ?? "").length,
      kind: CitationVerseMarkupKind.Paragraph
    };

    v.markups = [...v.markups, markup];
    this.saveVerseMarkups(v);
  }

  private removeTrailingParagraphMarkup(v: CitationVerseExtendedModel) {
    const trailingMarkup = this.findTrailingParagraphMarkup(v);
    if (!trailingMarkup) {
      return;
    }

    v.markups = v.markups.filter(markup => markup !== trailingMarkup);
    this.saveVerseMarkups(v);
  }

  private async saveVerseMarkups(v: CitationVerseExtendedModel) {
    const markupsToSave = v.markups.map(markup => ({ ...markup }));
    await this.bibleService.deleteCitationVerseMarkups(v.id);

    for (let i = 0; i < markupsToSave.length; i++) {
      const markup = markupsToSave[i];
      await this.bibleService.createCitationVerseMarkup({
        ...markup,
        id: -Date.now() - i
      });
    }
  }
}
