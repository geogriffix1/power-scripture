import {
  Component,
  Input,
  Signal,
  WritableSignal,
  signal,
  effect,
  EnvironmentInjector,
  runInInjectionContext,
  inject,
  ElementRef,
  ViewChild
} from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { Router, ActivatedRoute } from '@angular/router';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { ScriptureRangeEditorComponent } from './scripture-range-editor/scripture-range-editor.component';
import { JstreeModel } from '../../../model/jstree.model';
import { CiteScriptureRangeModel, NullCiteScriptureRange } from '../../../model/citeScriptureRangeModel';
import { BibleService } from '../../../bible.service';
import { CitationModel, CitationExtendedModel } from '../../../model/citation.model';
import { CitationVerseModel, CitationVerseExtendedModel, NullCitationVerse } from '../../../model/citationVerse.model';
import { CitationVerseMarkupWorkareaComponent } from './citation-verse-markup-workarea/citation-verse-markup-workarea.component';
import { CitationVerseSelectComponent } from './citation-verse-select/citation-verse-select.component';
import { CitationMarkupService } from '../../../citation-markup.service';

@Component({
    selector: 'app-edit-citation',
    imports: [
      ScriptureRangeEditorComponent,
      CitationVerseSelectComponent
    ],
    templateUrl: './edit-citation.component.html',
    styleUrl: './edit-citation.component.css'
})
export class EditCitationComponent {
  @Input({required: true})
    activeCitationNode!: Signal<JstreeModel | null>;
  @ViewChild("scrollableContent", { static: false })
    scrollableContent!: ElementRef<HTMLElement>
  
  private injector = inject(EnvironmentInjector);

  previousCitationNode: JstreeModel | null = null;
  activeCitation!: CitationExtendedModel;
  editedCitation!: CitationExtendedModel;
  activeCitationRangeString = "";

  static previousCitation?: CitationExtendedModel;
  nullCitation = { id: 0, description: "", citationLabel: "", bibleOrder: 0, verses: [] };
  activeRoute!:string;
  selectedFolder!:string;
  sectionWidth!:number;
  sectionHeight!:number;
  verseListHeight!:number;
  citationLabel!:string;
  readonly scriptureRanges: WritableSignal<CiteScriptureRangeModel[]> = signal([]);
  editedCitationVerses!: CitationVerseModel[];
  activeScriptureRange: WritableSignal<CiteScriptureRangeModel> = signal(new NullCiteScriptureRange);
  activeVerses: WritableSignal<CitationVerseExtendedModel[]> = signal([]);
  activeVerse: WritableSignal<CitationVerseExtendedModel> = signal(new NullCitationVerse);
  selectedEntry:any = [];
  scriptureRangeEditorIsActive:boolean = false;
  newScriptureRange?: CiteScriptureRangeModel;

  constructor (
    private actRoute: ActivatedRoute,
    private service: BibleService,
    public markupService: CitationMarkupService
  ) { }


  refreshCitationEditor(citation: CitationExtendedModel) {
    $("#description").val(citation.description).show(100);
    $("div.citation.selected").removeClass("missing").text(citation?.citationLabel ?? "").show(100);

    this.activeCitation = {
      id: citation.id,
      description: citation.description,
      citationLabel: citation.citationLabel,
      bibleOrder: citation.bibleOrder,
      verses: citation.verses,
      extended: true
    };

    this.editedCitation =  {
      id: citation.id,
      description: citation.description,
      citationLabel: citation.citationLabel,
      bibleOrder: citation.bibleOrder,
      verses: citation.verses,
      extended: true
    };

    WorkbenchComponent.setScriptureRanges(citation);
    const newScriptureRanges = WorkbenchComponent.scriptureRanges.map(sr => 
      <CiteScriptureRangeModel>{
        citation: sr.citation,
        verses: sr.verses,
        scriptures: sr.scriptures,
        isOpen: false,
        citationId: this.editedCitation.id
      });


    this.scriptureRanges.set(newScriptureRanges);
  }
  paths = ["edit", "edit/theme", "edit/citation", "edit/citation/range", "edit/citation/verse", "edit/citation/verse/markup"];

  workbenchDomRect(rect:DOMRectReadOnly) {
    this.sectionWidth = rect.width;
    this.sectionHeight = rect.height;
  }

  static isActive = false;
  static isSubscribed = false;

  OpenCloseScriptureRange(e:MouseEvent, i:number) {
    let activeRange = this.scriptureRanges()[i];
    let isOpen:boolean = activeRange.isOpen !== undefined ? activeRange.isOpen : false;

    if (isOpen) {
      $(`#range_${i}_title .spin-arrow-icon`).animate({rotate: "0deg"}, 500);
      $(`#range_${i}_content`).slideUp(500);
    }
    else {
      $(`#range_${i}_title .spin-arrow-icon`).animate({rotate: "90deg"}, 500);
      $(`#range_${i}_content`).slideDown(500);
    }

    this.scriptureRanges()[i].isOpen = !isOpen;
  }

  OpenCloseVerse(e:MouseEvent, i:number) {
    let activeVerse = this.activeVerses()[i];
    let isOpen = activeVerse.isOpen !== undefined ? activeVerse.isOpen : false;

    if (isOpen) {
      $(`#verse_${i}_title .spin-arrow-icon`).animate({rotate: "0deg"}, 500);
      $(`#verse_${i}_content`).slideUp(500);
    }
    else {
      $(`#verse_${i}_title .spin-arrow-icon`).animate({rotate: "90deg"}, 500);
      $(`#verse_${i}_content`).slideDown(500);
    }

    this.activeVerses()[i].isOpen = !isOpen;
  }

  onRangeAdded(scriptureRange?: CiteScriptureRangeModel) {
    (async () => {
      if (scriptureRange) {
        this.newScriptureRange = scriptureRange;
        if (this.newScriptureRange) {
          $("div.citation.selected").text(this.activeCitation?.citationLabel ?? "");
          let scriptureIds = this.newScriptureRange.scriptures.map(scripture => scripture.id);
          this.editedCitation.id = this.activeCitation.id;
          this.editedCitation.description = this.activeCitation.description;
          this.editedCitation.verses = await this.service.addCitationVerses(this.activeCitation.id, scriptureIds);

          WorkbenchComponent.setScriptureRanges(this.editedCitation);
          const newScriptureRanges = WorkbenchComponent.scriptureRanges.map(sr => 
            <CiteScriptureRangeModel>{
              citation: sr.citation,
              verses: sr.verses,
              scriptures: sr.scriptures,
              isOpen: false,
              citationId: this.editedCitation.id
            });

          this.scriptureRanges.set(newScriptureRanges);
          this.activeVerses.set([])
          
          const citationLabel = this.getCitationLabelFromScriptureRanges(newScriptureRanges);
          this.scriptureRanges.set(newScriptureRanges);
          const node = this.activeCitationNode()!;
          node.text = citationLabel;
          node.li_attr.title = this.activeCitation.description;
          BibleThemeTreeComponent.updateCitationNode(node);
          $("div.citation.selected").text(citationLabel);
          this.ShowSuccess("Range added successfully");
        }
      }
    })();
  }

  EditCitationDescription() {
    this.editedCitation.description = <string>$("#description").val() ?? "";
    console.log("citation description:", this.editedCitation.description);
    (async () => {
      let edited = await this.service.editCitation(<CitationModel> {
        id: this.editedCitation.id,
        description: this.editedCitation.description ?? ""
      });

      this.activeCitation = edited;
      let treeNode = <JstreeModel>this.activeCitationNode();
      treeNode.li_attr.title = edited.description;

      BibleThemeTreeComponent.updateCitationNode(treeNode);
      this.ShowSuccess("Citation description changed successfully");
    })();
  }

  EditScriptureRange(index: number) {
    (async () => {
      $("div.await").show(100);
      const activeRange = this.scriptureRanges()[index];
      const scriptureIds = activeRange.scriptures.map(scripture => scripture.id);

      this.activeVerses.set(
        (await this.service
          .getVersesByCitationAndScriptures(this.activeCitation.id, scriptureIds))
          .sort((a, b) => (a.scripture.bibleOrder - b.scripture.bibleOrder)));
      this.activeScriptureRange.set(activeRange);
      this.markupService.activeVerse.set(new NullCitationVerse);
      $("div.await").hide(100);
    })();
  }

  OnMarkupVerse(index: number) {
    let verse = this.activeVerses()[index];
    if (verse.scripture.book.match(/Obadiah|Philemon|2 John|3 John|Jude/)) {
      verse.verseCitationLabel = `${verse.scripture.book} ${verse.scripture.verse}`;
    }
    else {
      verse.verseCitationLabel = `${verse.scripture.book} ${verse.scripture.chapter}:${verse.scripture.verse}`;
    }

    this.activeVerse.set(verse);
  }

  ShowSuccess(message: string) {
    $(".success-message").text(message).show(100);
    setTimeout(() => {
      $(".success-message").text("").hide(100);
    }, 5000);
  }

  DeleteScriptureRange(id: number) {
    (async () => {
      $(".await").show(100);
      let range:CiteScriptureRangeModel = this.scriptureRanges()[id];
      let scriptureIds = range.scriptures.map(scripture => scripture.id);
      let verseIds = this.editedCitation.verses
        .filter(verse => scriptureIds.includes(Number(verse.scriptureId)))
        .map(verse => verse.id);
      this.service.deleteCitationVerses(this.activeCitation.id, verseIds)
        .then(citation => {
          $("div.citation.selected").text(citation?.citationLabel ?? "");
          WorkbenchComponent.setScriptureRanges(citation);
          const newScriptureRanges = WorkbenchComponent.scriptureRanges.map(sr => 
            <CiteScriptureRangeModel>{
              citation: sr.citation,
              verses: sr.verses,
              scriptures: sr.scriptures,
              isOpen: false,
              citationId: this.editedCitation.id
            });
          
          const citationLabel = this.getCitationLabelFromScriptureRanges(newScriptureRanges);
          this.scriptureRanges.set(newScriptureRanges);
          const node = this.activeCitationNode()!;
          node.text = citationLabel;
          node.li_attr.title = citation.description;
          BibleThemeTreeComponent.updateCitationNode(node);
          $("div.citation.selected").text(citationLabel);
          $(".await").hide(100);
        });
    })();
  }

  OnCloseSelectedRange() {
    $(".await").show(100);
    const id = this.activeScriptureRange().citationId!
    this.activeScriptureRange.set(new NullCiteScriptureRange);
    this.service.getCitation(id)
      .then(citation => {
        this.refreshCitationEditor(citation);
        $(".await").hide(100);
      });
  }

  onVerseSelected(selectedVerse: CitationVerseExtendedModel) {
    this.activeVerse.set(selectedVerse);
  }

  onHideVerseChanged($event:any) {
    const hide = $event.hidden ? "Y" : "N"
    this.service.editCitationVerseHide($event.id, hide);
    this.activeVerses().filter(verse => verse.id == $event.id)[0].hide = hide;
  }

  ngAfterViewInit() {
    this.activeRoute = this.actRoute.snapshot.routeConfig?.path ?? "";
    this.markupService.activeVerse.set(new NullCitationVerse);

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const node = this.activeCitationNode(); // 👈 direct signal read

        if (node) {
          const id = Number(node?.li_attr?.citationId);
          if (!id)
            return;
          
          $(".await").show(100);
          this.activeScriptureRange.set(new NullCiteScriptureRange);
          this.service.getCitation(id)
            .then(citation => {
              this.refreshCitationEditor(citation);
              $(".await").hide(100);
           });
        }
      });
    });
  }

  getCitationLabelFromScriptureRanges(scriptureRanges: CiteScriptureRangeModel[]): string {
    let label = "";
    const singleChapterBooks = ["Philemon", "Obadiah", "2 John", "3 John", "Jude"];

    if (scriptureRanges) {
      scriptureRanges.forEach(range => {
        let lastIndex = null;
        if (range.scriptures && range.scriptures.length > 0) {
          let firstIndex = 0;
          lastIndex = range.scriptures.length > 1 ? range.scriptures.length - 1 : null;
          if (singleChapterBooks.includes(range.scriptures[0].book)) {
            label = `${label}, ${range.scriptures[0].book} ${range.scriptures[firstIndex].verse}`;
          }
          else {
            label = `${label}, ${range.scriptures[0].book} ${range.scriptures[firstIndex].chapter}:${range.scriptures[firstIndex].verse}`;
          }

          if (lastIndex !== null) {
            label = `${label}-${range.scriptures[Number(lastIndex)].verse}`;
          }
        }
      });

      label = label.substring(2);
      if (label.length > 100) {
        label = label.substring(0, 97) + "...";
      }
    }

    return label;
  }

  updateScrollingHeight() {
    if (this.activeCitationNode()) {
      const scrollingEl = this.scrollableContent.nativeElement;
      const areaEl = scrollingEl.closest('as-split-area') as HTMLElement;

      if (areaEl) {
        const areaRect = areaEl.getBoundingClientRect();
        const scrollRect = scrollingEl.getBoundingClientRect();
        const newHeight = areaRect.height - (scrollRect.top - areaRect.top);
        scrollingEl.style.height = `${newHeight}px`;
      }
    }
  }
}
