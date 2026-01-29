import { Component, input, output } from '@angular/core';
import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import { CitationMarkupService } from '../../../../citation-markup.service';

@Component({
  selector: 'app-citation-verse-select',
  standalone: true,
  templateUrl: './citation-verse-select.component.html',
  styleUrl: './citation-verse-select.component.css'
})
export class CitationVerseSelectComponent {

  constructor(private markupService: CitationMarkupService) {}

  // SIGNAL INPUT
  verses = input.required<CitationVerseExtendedModel[]>();

  // SIGNAL OUTPUTS
  hideChanged = output<{ id: number; hidden: boolean }>();
  markupClicked = output<CitationVerseExtendedModel>();

  onHideChanged(v: CitationVerseExtendedModel, checked: boolean) {
    v.hide = checked ? "Y" : "N";
    this.hideChanged.emit({ id: v.id, hidden: checked });
  }

  onMarkupClicked(v: CitationVerseExtendedModel) {
    this.markupClicked.emit(v);
  }

  renderVerse(verse:CitationVerseExtendedModel) {
    const text = this.markupService.renderVerse(verse);
    return text;
  }

  ngOnInit() {
    this.markupService.beginSessionSnapshot(this.verses());
  }
}
