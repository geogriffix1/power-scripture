import { Component, Input, Signal, computed, effect, inject } from '@angular/core';

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

  // bottom preview panel (collapsible)
  previewOpen = true;

  constructor() {
    /**
     * 🔑 CRITICAL FIX
     * Start a new markup session whenever the active verse range changes.
     * This guarantees toolbox buttons work on FIRST entry.
     */
    effect(() => {
      const verses = this.activeVerses?.();
      if (!verses || verses.length === 0) return;

      this.markup.beginSessionSnapshot(verses);

      // Also clear undo/redo for the newly active verse
      const active = this.activeVerse?.();
      if (active) {
        this.markup.resetUndoRedoForVerse(active.id);
      }
    });
  }

  renderedRangeHtml = computed(() => {
    // depend on service version bump so it refreshes
    this.markup.markupsVersion();
    return this.markup.renderRange(this.activeVerses());
  });

  togglePreview() {
    this.previewOpen = !this.previewOpen;
  }
}
