import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CitationVerseExtendedModel } from '../../../../model/citationVerse.model';
import { CitationMarkupService } from '../../../../citation-markup.service';

// Child components
import { MarkupActiveVerseComponent } from '../markup-active-verse/markup-active-verse.component';
import { CitationVerseMarkupToolboxComponent } from '../citation-verse-markup-toolbox/citation-verse-markup-toolbox.component';

@Component({
  selector: 'app-citation-verse-markup-workarea',
  standalone: true,
  imports: [
    CommonModule,
    MarkupActiveVerseComponent,
    CitationVerseMarkupToolboxComponent
  ],
  template: `
    <div class="workarea-container">

      <!-- TOOLBOX (left) -->
      <div class="toolbox-column">
        <app-citation-verse-markup-toolbox
          [activeVerse]="activeVerse"
          (save)="onSave()"
          (cancel)="onCancel()">
        </app-citation-verse-markup-toolbox>
      </div>

      <!-- ACTIVE VERSE EDITOR (right) -->
      <div class="editor-column">
        <app-markup-active-verse
          [activeVerse]="activeVerse">
        </app-markup-active-verse>
      </div>

    </div>

    <!-- PREVIEW PANEL BELOW BOTH -->
    <div class="preview-toggle" (click)="togglePreview()">
      {{ previewCollapsed() ? 'Show Preview ▼' : 'Hide Preview ▲' }}
    </div>

    <div class="preview-panel" *ngIf="!previewCollapsed()">
      <div class="preview-content" [innerHTML]="renderedRangeHtml()"></div>
    </div>
  `,
  styles: [`
    .workarea-container {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: auto;
      gap: 1rem;
    }

    .toolbox-column {
      width: 124px;
      flex-shrink: 0;
      border-right: 1px solid #ddd;
    }

    .editor-column {
      flex: 1;
      padding: 0.5rem;
    }

    .preview-toggle {
      margin-top: 0.5rem;
      cursor: pointer;
      user-select: none;
      color: #0a4a8a;
      font-weight: 600;
    }

    .preview-panel {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: #fafafa;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .preview-content {
      white-space: pre-wrap;
      line-height: 1.5rem;
      font-family: Georgia, 'Times New Roman', serif;
    }
  `]
})
export class CitationVerseMarkupWorkareaComponent {

  // EXTERNAL INPUTS
  @Input() activeVerse!: CitationVerseExtendedModel;
  @Input() activeVerses: CitationVerseExtendedModel[] = [];

  // OUTPUT SIGNALS
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private service = inject(CitationMarkupService);

  previewCollapsed = signal<boolean>(false);

  constructor() {}

  // ---------- Preview HTML for FULL RANGE ----------
  renderedRangeHtml = computed(() => {
    return this.service.renderRange(this.activeVerses);
  });

  togglePreview() {
    this.previewCollapsed.update(v => !v);
  }

  // ---------- Lifecycle / Save / Cancel ----------
  onSave() {
    // service emits whether changes exist — you already know how to persist
    this.save.emit();
  }

  onCancel() {
    this.service.rollbackSession();
    this.cancel.emit();
  }

  // OPTIONAL: Reset history if verse changes
  ngOnChanges() {
    if (this.activeVerse) {
      this.service.resetUndoRedoForVerse(this.activeVerse.id);
      this.service.beginSessionSnapshot(this.activeVerses);
    }
  }
}
