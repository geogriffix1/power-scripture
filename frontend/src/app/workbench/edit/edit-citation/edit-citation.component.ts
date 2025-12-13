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
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild
} from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { Router, ActivatedRoute } from '@angular/router';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { ScriptureRangeEditorComponent } from '../../tools/scripture-range-editor/scripture-range-editor.component';
import { JstreeModel, JstreeState } from '../../../model/jstree.model';
import { CiteScriptureRangeModel, NullCiteScriptureRange } from '../../../model/citeScriptureRangeModel';
import { EditComponent } from '../edit.component';
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
      CitationVerseMarkupWorkareaComponent,
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
    private router: Router,
    private service: BibleService,
    private markupService: CitationMarkupService
  ) { }


  refreshCitationEditor(citation: CitationExtendedModel) {
    console.log("refreshing the Citation Editor, active citation:");
    console.log(citation);

    $("#citationDescription").val(citation.description).show(100);
    $("div.citation.selected").removeClass("missing").text(citation?.citationLabel ?? "").show(100);

    console.log("Freshly-queried citation:");
    console.log(citation);

    this.activeCitation = {
      id: citation.id,
      description: citation.description,
      citationLabel: citation.citationLabel,
      bibleOrder: citation.bibleOrder,
      verses: citation.verses
    };

    // EditCitationComponent.previousCitation = {
    //   id: citation.id,
    //   description: citation.description,
    //   citationLabel: citation.citationLabel,
    //   bibleOrder: citation.bibleOrder,
    //   verses: citation.verses
    // };

    this.editedCitation =  {
      id: citation.id,
      description: citation.description,
      citationLabel: citation.citationLabel,
      bibleOrder: citation.bibleOrder,
      verses: citation.verses
    };

    console.log("Calling setScriptureRanges - editedCitation:");
    console.log(citation);
    WorkbenchComponent.setScriptureRanges(citation);
    const newScriptureRanges = WorkbenchComponent.scriptureRanges.map(sr => 
      <CiteScriptureRangeModel>{
        citation: sr.citation,
        verses: sr.verses,
        scriptures: sr.scriptures,
        isOpen: false,
        citationId: this.editedCitation.id
      });

    console.log("newScriptureRanges:");
    console.log(newScriptureRanges);

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
    console.log(`OpenCloseScriptureRange(${i})`)
    let activeRange = this.scriptureRanges()[i];
    console.log(activeRange);
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
    console.log(`open close verse ${i}`);
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
    console.log("onRangeAdded");
    (async () => {
      if (scriptureRange) {
        this.newScriptureRange = scriptureRange;
        console.log(this.newScriptureRange);
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

          console.log("newScriptureRanges:");
          console.log(newScriptureRanges);

          this.scriptureRanges.set(newScriptureRanges);
          this.activeVerses.set([])
          
          const citationLabel = this.getCitationLabelFromScriptureRanges(newScriptureRanges);
          this.scriptureRanges.set(newScriptureRanges);
          const node = this.activeCitationNode()!;
          node.text = citationLabel;
          node.li_attr.title = this.activeCitation.description;
          BibleThemeTreeComponent.updateCitationNode(node);
          $("div.citation.selected").text(citationLabel);
        }
      }
    })();
  }

  EditCitationDescription() {
    if (!this.editedCitation.description || this.editedCitation.description.trim() != ($("#citationDiscription").val() ?? "")) {
      this.editedCitation.description = <string>$("#citationDescription").val() ?? "";
      (async () => {
        let edited = await this.service.editCitation(<CitationModel> {
          id: this.editedCitation.id,
          description: this.editedCitation.description
        });

        this.activeCitation = edited;
        let treeNode = <JstreeModel>this.activeCitationNode();
        treeNode.li_attr.title = edited.description;

        BibleThemeTreeComponent.updateCitationNode(treeNode);
        console.log("treeNode for citation:");
        console.log(treeNode);  
      })();
    }
  }

  EditScriptureRange(index: number) {
    console.log(`Edit scripture range, index: ${index}`);
    console.log(this.scriptureRanges()[index]);
    this.activeScriptureRange.set(this.scriptureRanges()[index]);
    const scriptureIds = this.activeScriptureRange().scriptures.map(scripture => scripture.id);
    console.log("scriptureIds:");
    console.log(scriptureIds);
    (async () => {
      $("div.await").show(100);
      console.log(`calling getVersesByCitationAndScriptures active citation id: ${this.activeCitation.id}`);
      this.activeVerses.set(await this.service.getVersesByCitationAndScriptures(this.activeCitation.id, scriptureIds));
      console.log(this.activeVerses());
      $("div.await").hide(100);
    })();
  }

  OnMarkupVerse(index: number) {
    console.log(`markup ${index}`);
    console.log(this.activeVerses()[index]);
    let verse = this.activeVerses()[index];
    if (verse.scripture.book.match(/Obadiah|Philemon|2 John|3 John|Jude/)) {
      verse.verseCitation = `${verse.scripture.book} ${verse.scripture.verse}`;
    }
    else {
      verse.verseCitation = `${verse.scripture.book} ${verse.scripture.chapter}:${verse.scripture.verse}`;
    }

    this.activeVerse.set(verse);
  }

  OnSaveMarkups() {}

  OnCancelMarkups() {
    this.activeVerse.set(new NullCitationVerse);
  }

  DeleteScriptureRange(id: number) {
    (async () => {
      $(".await").show(100);
      console.log(`DeleteScriptureRange(${id})`);
      let range:CiteScriptureRangeModel = this.scriptureRanges()[id];
      let scriptureIds = range.scriptures.map(scripture => scripture.id);
      let verseIds = this.editedCitation.verses
        .filter(verse => scriptureIds.includes(Number(verse.scriptureId)))
        .map(verse => verse.id);
      console.log("verseIds:");
      console.log(verseIds);
      this.service.deleteCitationVerses(this.activeCitation.id, verseIds)
        .then(citation => {
          console.log("after deleteCitationVerses:");
          console.log(citation);
          $("div.citation.selected").text(citation?.citationLabel ?? "");
          WorkbenchComponent.setScriptureRanges(citation);
          console.log("scriptureRanges:");
          console.log(WorkbenchComponent.scriptureRanges);
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
    this.activeScriptureRange.set(new NullCiteScriptureRange);
  }

  onVerseSessionEnded(event:any) {
    console.log("Verse markup session ended.");
    console.log(event);
  }

  onVerseSelected(selectedVerse: CitationVerseExtendedModel) {
    console.log("Verse Selected for Markup!");
    console.log(selectedVerse);
    this.activeVerse.set(selectedVerse);
  }
  ngOnInit() {
    console.log("ON INIT");
    console.log("initializing edit citation component");
    EditCitationComponent.isActive = true;
    let rect = WorkbenchComponent.getWorkbenchSize();

    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    this.activeScriptureRange.set(new NullCiteScriptureRange);
    $("app-edit-theme").width(rect.width);
    $("#citationDescription").width(rect.width - 60);

    this.updateScrollingHeight();

    console.log(this.actRoute.snapshot);

    this.activeRoute = this.actRoute.snapshot.routeConfig?.path ?? "";
  }

  ngAfterViewInit() {
    console.log("AFTER VIEW INIT");
    console.log("afterViewInit - edit-citation component");
    this.activeRoute = this.actRoute.snapshot.routeConfig?.path ?? "";
    if (!EditCitationComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          if(EditCitationComponent.isActive) {
            this.workbenchDomRect(rect);
            this.sectionWidth - rect.width - 4;
            $("app-edit-theme").width(rect.width);
            $("#citationDescription").width(rect.width - 60);

            this.updateScrollingHeight();
          }
        });
      }

    EditCitationComponent.isSubscribed = true;

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const node = this.activeCitationNode(); // 👈 direct signal read
        console.log('Child effect triggered, node:', node);

        if (node) {
          const id = Number(node?.li_attr?.citationId);
          if (!id)
            return;
          
          $(".await").show(100);
          console.log(`citationId: ${id}`);
          this.activeScriptureRange.set(new NullCiteScriptureRange);
          this.service.getCitation(id)
            .then(citation => {
              console.log("citation refreshed:");
              console.log(citation);
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

  ngOnDestroy() {
    EditCitationComponent.isActive = false;
  }
}
