import { Component, input, output } from '@angular/core';
import { CitationVerseExtendedModel, NullCitationVerse } from '../../../../model/citationVerse.model';
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
}
