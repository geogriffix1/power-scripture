import { Component, Input, Signal, computed, inject, effect } from '@angular/core';

import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import { CitationMarkupService } from '../../../../citation-markup.service';

import { CitationVerseMarkupToolboxComponent } from '../citation-verse-markup-toolbox/citation-verse-markup-toolbox.component';
import { MarkupActiveVerseComponent } from '../markup-active-verse/markup-active-verse.component';

@Component({
  selector: 'app-citation-verse-markup-workarea',
  standalone: true,
  imports: [
    CitationVerseMarkupToolboxComponent,
    MarkupActiveVerseComponent
  ],
  templateUrl: './citation-verse-markup-workarea.component.html',
  styleUrls: ['./citation-verse-markup-workarea.component.css']
})
export class CitationVerseMarkupWorkareaComponent {
  private markup = inject(CitationMarkupService);

  @Input({ required: true }) activeVerse!: Signal<CitationVerseExtendedModel>;
  @Input({ required: true }) activeVerses!: Signal<CitationVerseExtendedModel[]>;

  constructor() {
    effect(() => {
      const verses = this.activeVerses();
      if (!verses || verses.length === 0) return;

      // 🔑 ALWAYS initialize session before any selection can occur
      this.markup.beginSessionSnapshot(verses);
    });
  }

  previewOpen = true;

  renderedRangeHtml = computed(() => {
    this.markup.markupsVersion();
    return this.markup.renderRange(this.activeVerses());
  });

  togglePreview() {
    this.previewOpen = !this.previewOpen;
  }

  beginSession() {
    this.markup.beginSessionSnapshot(this.activeVerses());
    console.log("beginSession - citationVerseMarkupWorkarea");
    console.log(this.activeVerse());

    // 🔑 Seed an initial pristine selection for the active verse
    const v = this.activeVerse();
    this.markup.setPristineSelection({
      verseId: v.id,
      startIndex: 0,
      endIndex: 0,
      caretIndex: 0
    });
  }
}
