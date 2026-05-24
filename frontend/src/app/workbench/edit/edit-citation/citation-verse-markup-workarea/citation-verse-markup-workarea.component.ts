import { Component, Input, output, Signal, computed, inject, effect } from '@angular/core';
import { AddEventListenerOptions } from 'rxjs/internal/observable/fromEvent';

import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import { CitationMarkupService } from '../../../../citation-markup.service';

import { CitationVerseMarkupToolboxComponent } from '../citation-verse-markup-toolbox/citation-verse-markup-toolbox.component';
import { MarkupActiveVerseComponent } from '../markup-active-verse/markup-active-verse.component';

export interface VerseSessionChangedEvent {
  verseId: number | null;
  isDirty: boolean;
}

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
  private originalVerse: CitationVerseExtendedModel | null = null;
  private isDirty = false;

  @Input({ required: true }) activeVerse!: Signal<CitationVerseExtendedModel>;
  @Input({ required: true }) activeVerses!: Signal<CitationVerseExtendedModel[]>;

  constructor() {
    effect(() => {
      const verse = this.activeVerse();
      if (this.originalVerse === null) {
        this.originalVerse = verse;
        // 🔑 ALWAYS initialize session before any selection can occur
        this.markup.beginSessionSnapshot(verse);
        return;
      }

      this.isDirty = this.markup.activeVerseIsDirty();
      this.verseSessionChanged.emit({ verseId: this.activeVerse().id, isDirty: this.isDirty });
    });
  }

  previewOpen = true;
  verseSessionChanged = output<VerseSessionChangedEvent>();

  renderedRangeHtml = computed(() => {
    this.markup.markupsVersion();
    const range = this.activeVerses();
    if (this.markup.activeVerse()) {
      const verse = this.markup.activeVerse();
      let index = this.activeVerses().findIndex(v => v.id == verse.id);
      range[index] = verse;
    }

    return this.markup.renderRange(range);
  });

  togglePreview() {
    this.previewOpen = !this.previewOpen;
  }

  beginSession() {
    this.markup.beginSessionSnapshot(this.activeVerse());

    // 🔑 Seed an initial pristine selection for the active verse
    const v = this.activeVerse();
    this.markup.setPristineSelection({
      verseId: v.id,
      startIndex: 0,
      endIndex: 0,
      caretIndex: 0
    });
  }

  isSameAsOriginal(verse: CitationVerseExtendedModel): boolean {
    return JSON.stringify(verse) == JSON.stringify(this.originalVerse);
  }
}
