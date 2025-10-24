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
import { CiteScriptureRangeModel } from '../../../model/citeScriptureRangeModel';
import { EditComponent } from '../edit.component';
import { BibleService } from '../../../bible.service';
import { CitationModel, CitationExtendedModel } from '../../../model/citation.model';
import { CitationVerseModel, CitationVerseExtendedModel } from '../../../model/citationVerse.model';

@Component({
    selector: 'app-edit-citation',
    imports: [
      ScriptureRangeEditorComponent
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
  activeScriptureRange?: CiteScriptureRangeModel;
  selectedEntry:any = [];
  scriptureRangeEditorIsActive:boolean = false;
  newScriptureRange?: CiteScriptureRangeModel;

  constructor (
    private actRoute: ActivatedRoute,
    private router: Router,
    private service: BibleService
  ) { }


  refreshCitationEditor(citation: CitationExtendedModel) {
    this.activeCitation = citation;
    $("#citationDescription").val(this.activeCitation.description).show(500);
    $("div.citation.selected").removeClass("missing").text(this.activeCitation.citationLabel).show(500);

    console.log("Freshly-queried citation:");
    console.log(citation);

    this.activeCitation = {
      id: citation.id,
      description: citation.description,
      citationLabel: citation.citationLabel,
      bibleOrder: citation.bibleOrder,
      verses: citation.verses
    };

    EditCitationComponent.previousCitation = {
      id: citation.id,
      description: citation.description,
      citationLabel: citation.citationLabel,
      bibleOrder: citation.bibleOrder,
      verses: citation.verses
    };

    this.editedCitation =  {
      id: this.activeCitation.id,
      description: this.activeCitation.description,
      citationLabel: this.activeCitation.citationLabel,
      bibleOrder: this.activeCitation.bibleOrder,
      verses: this.activeCitation.verses
    };

    WorkbenchComponent.setScriptureRanges(this.editedCitation);
    const newScriptureRanges = WorkbenchComponent.scriptureRanges.map(sr => 
      <CiteScriptureRangeModel>{
        citation: sr.citation,
        verses: sr.verses,
        scriptures: sr.scriptures,
        isOpen: false
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

  onRangeAdded(scriptureRange?: CiteScriptureRangeModel) {
    console.log("onRangeAdded");
    (async () => {
      console.log("activeCitation:");
      console.log(this.activeCitation);
      console.log("scriptureRange:");
      console.log(scriptureRange);
      if (scriptureRange) {
        this.newScriptureRange = scriptureRange;
        console.log("onRangeAdded()");
        console.log("newScriptureRange:");
        console.log(this.newScriptureRange);
        if (this.newScriptureRange) {
          let scriptureIds = this.newScriptureRange.scriptures.map(scripture => scripture.id);
          this.editedCitation.id = this.activeCitation.id;
          this.editedCitation.description = this.activeCitation.description;
          this.editedCitation.verses = await this.service.addCitationVerses(this.activeCitation.id, scriptureIds);

          let treeNode = <JstreeModel>this.activeCitationNode();
          treeNode.li_attr.title = this.editedCitation.description;
          treeNode.text = this.editedCitation.citationLabel;
          
          BibleThemeTreeComponent.updateCitationNode(treeNode);
          console.log("treeNode for citation:");
          console.log(treeNode);  

          WorkbenchComponent.setScriptureRanges(this.editedCitation);
          const newScriptureRanges = WorkbenchComponent.scriptureRanges.map(sr => 
            <CiteScriptureRangeModel>{
              citation: sr.citation,
              verses: sr.verses,
              scriptures: sr.scriptures,
              isOpen: false
            });

          console.log("newScriptureRanges:");
          console.log(newScriptureRanges);

          this.scriptureRanges.set(newScriptureRanges);
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
    let rangeToEdit = this.scriptureRanges()[index];
    let book = "";
    let chapter = "";
    let verse = "";
    let endVerse = "";

    if (rangeToEdit.scriptures.length > 0) {
      book = rangeToEdit.scriptures[0].book;
      chapter = "" + rangeToEdit.scriptures[0].chapter;
      verse = "" + rangeToEdit.scriptures[0].verse;
      
      let last = rangeToEdit.scriptures.length - 1;
      endVerse = "" + rangeToEdit.scriptures[last].verse;

      console.log(`${book} ${chapter} ${verse}:${endVerse}`);
    }
  }

  DeleteScriptureRange(id: number) {

  }

  ngOnInit() {
    console.log("ON INIT");
    console.log("initializing edit citation component");
    console.log("Child received signal identity:", this.activeCitationNode());
    EditCitationComponent.isActive = true;
    let rect = WorkbenchComponent.getWorkbenchSize();

    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    this.activeScriptureRange = undefined;
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

          this.service.getCitation(id)
            .then(citation => {
              this.refreshCitationEditor(citation);
           });
        }
      });
    });
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
