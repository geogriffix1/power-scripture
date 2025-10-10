import { Component, Input, Signal, signal, effect, ElementRef, ViewChild } from '@angular/core';
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
    activeCitationNode!: Signal<JstreeModel>
  @ViewChild("scrollableContent", { static: false })
    scrollableContent!: ElementRef<HTMLElement>
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
  scriptureRanges!: Signal<CiteScriptureRangeModel[]>;
  editedCitationVerses!: CitationVerseModel[];
  activeScriptureRange?: CiteScriptureRangeModel;
  selectedEntry:any = [];
  scriptureRangeEditorIsActive:boolean = false;

   constructor(
    private actRoute: ActivatedRoute,
    private router: Router,
    private service: BibleService
  ) {
      effect(()=>{
      console.log("edit-citation: in effect");
      this.activeRoute = this.actRoute.snapshot.routeConfig?.path ?? "edit/citation";
      console.log(`activeRoute: ${this.activeRoute}`);
      console.log("activeCitationNode:");
      console.log(this.activeCitationNode());
      if (this.activeCitationNode()) {
        let id = <number><unknown>this.activeCitationNode().li_attr.citationId;
        console.log(`citation id: ${id}`);
        console.log(`previous citation exists? ${EditCitationComponent.previousCitation ? true : false}`);
        if (EditCitationComponent.previousCitation?.id == id) {
          this.activeCitation = <CitationExtendedModel>{
            id: EditCitationComponent.previousCitation.id,
            description: EditCitationComponent.previousCitation.description,
            citationLabel: EditCitationComponent.previousCitation.citationLabel,
            bibleOrder: EditCitationComponent.previousCitation.bibleOrder,
            verses: EditCitationComponent.previousCitation.verses
          };
        }
        else if (this.activeRoute.toLowerCase() != "edit/citation") {
          router.navigate(["edit/citation"]);
        }
        else {
          service.getCitation(id)
            .then(citation => {
              this.activeCitation = citation;
              $("#description").val(this.activeCitation.description).show(500);
              $("div.citation.selected").removeClass("missing").text(this.activeCitation.citationLabel).show(500);

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
          });
        }

        this.editedCitation =  {
          id: this.activeCitation.id,
          description: this.activeCitation.description,
          citationLabel: this.activeCitation.citationLabel,
          bibleOrder: this.activeCitation.bibleOrder,
          verses: this.activeCitation.verses
        };

        WorkbenchComponent.setScriptureRanges(this.activeCitation);
        this.scriptureRanges = signal(WorkbenchComponent.scriptureRanges.map(sr => 
          <CiteScriptureRangeModel>{
            citation: sr.citation,
            verses: sr.verses,
            scriptures: sr.scriptures,
            isOpen: false
          }));
      
      }
      else {
        $("#description").val("").show(500);
        $("div.citation.selected")
          .removeClass("missing")
          .addClass("missing")
          .html("Please select the <b>Citation</b> from the <b>Bible Theme Tree</b>")
          .show(500);
        
        this.activeCitation = this.nullCitation;
        this.editedCitation = this.nullCitation;
        this.scriptureRanges = signal([]);
      }
    });
  }

  paths = ["edit", "edit/theme", "edit/citation", "edit/citation/range", "edit/citation/verse", "edit/citation/verse/markup"];

  workbenchDomRect(rect:DOMRectReadOnly) {
    this.sectionWidth = rect.width;
    this.sectionHeight = rect.height;
  }

  static isActive = false;
  static isSubscribed = false;

  @Input()
    activeType = 2;

  path = this.paths[this.activeType];

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

  onRangeAdded(id:number) {
    (async () => {
      let service = new BibleService;
      this.editedCitation = await service.getCitation(id);
    })();
  }

  // ShowModalContextMenu(e:MouseEvent, scriptureRangeIndex: number) {
  //   e.preventDefault();
  //   console.log("ShowModalContextMenu");
  //   console.log(e);
  //   console.log(`show context menu for scriptureRange[${scriptureRangeIndex}]`);
  //   $("app-edit-scripture-range-context-menu").removeClass("hidden");
  //   console.log("returning from ShowModalContextMenu");
  // } 

  // callbacks = {
  //   canEditScriptureRange() { return true; },
  //   editScriptureRange(range: CiteScriptureRangeModel) {
  //     console.log("edit scripture range:");
  //     console.log(range);
  //   }
  // }

  EditCitationDescription() {
    if (!this.editedCitation.description || this.editedCitation.description.trim() != ($("#citationDiscription").val() ?? "")) {
      this.editedCitation.description = <string>$("#citationDescription").val() ?? "";
      let service = new BibleService;
      (async (obj) => {
        let edited = await service.editCitation(<CitationModel> {
          id: obj.editedCitation.id,
          description: obj.editedCitation.description
        });

        obj.activeCitation = edited;
        let treeNode = BibleThemeTreeComponent.getDomNode(`citation${edited.id}`);
        treeNode.li_attr.title = edited.description;
        BibleThemeTreeComponent.refreshDomNode(treeNode.id);
        console.log("treeNode for citation:");
        console.log(treeNode);
  
      })(this);
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
    console.log("initializing edit citation component");
    EditCitationComponent.isActive = true;
    let rect = WorkbenchComponent.getWorkbenchSize();

    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    this.activeScriptureRange = undefined;
    $("app-edit-theme").width(rect.width);
    $("#citationDescription").width(rect.width - 70);

    if (WorkbenchComponent.activeCitation) {
      this.activeCitationNode = signal(WorkbenchComponent.activeCitation);
    }
  
    // EditCitationComponent.isPreviousCitation = false;
    // if (WorkbenchComponent.activeCitation) {
    //   // Check for previous edited citation still in memory
    //   if (EditCitationComponent.previousCitation &&
    //     WorkbenchComponent.activeCitation.id == `citation${(<any>EditCitationComponent.previousCitation).id}`) {
    //       this.activeCitation = <CitationExtendedModel>{
    //         id: EditCitationComponent.previousCitation.id,
    //         description: EditCitationComponent.previousCitation.description,
    //         citationLabel: EditCitationComponent.previousCitation.citationLabel,
    //         bibleOrder: EditCitationComponent.previousCitation.bibleOrder,
    //         verses: EditCitationComponent.previousCitation.verses
    //       };

    //       this.editedCitation = <CitationExtendedModel>{
    //         id: EditCitationComponent.previousCitation.id,
    //         description: EditCitationComponent.previousCitation.description,
    //         citationLabel: EditCitationComponent.previousCitation.citationLabel,
    //         bibleOrder: EditCitationComponent.previousCitation.bibleOrder,
    //         verses: EditCitationComponent.previousCitation.verses
    //       };

    //       WorkbenchComponent.setScriptureRanges(this.activeCitation);
    //       const newRanges = WorkbenchComponent.scriptureRanges.map(sr => 
    //         <CiteScriptureRangeModel>{
    //           citation: sr.citation,
    //           verses: sr.verses,
    //           scriptures: sr.scriptures,
    //           isOpen: false
    //         });

    //       this.scriptureRanges = newRanges;

    //       EditCitationComponent.isPreviousCitation = true;
    //       console.log("previous citation found!");
    //       console.log(this.editedCitation);
    //   }
    //   else {
    //     EditCitationComponent.previousCitation = undefined;
    //     this.activePath = 2;
    //   }
    // }
    // else {
    //   this.isActiveCitation = false;
    //   this.activePath = 2;
    // }
  }

  ngAfterViewInit() {
    console.log("afterViewInit - edit-citation component");
    if (!EditCitationComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          if (EditCitationComponent.isActive) {
            $("#citationDescription").css('width', (rect.width - 70) + "px");
            let viewTop  = <number>$("as-split-area.workbench").offset()!.top;
            let viewHeight = <number>$("as-split-area.workbench").innerHeight();
            let viewBottom = viewTop + viewHeight;
            let scrollingTop = <number>$("div.scrolling").offset()!.top;
            this.verseListHeight = viewBottom - scrollingTop;
            $("div.scrolling").css("height", this.verseListHeight + "px");            
          }
        });
      
      // (async (obj:EditCitationComponent) => {
      //   console.log("subscribing to active citation selector");
      //   BibleThemeTreeComponent.ActiveCitationSelector
      //     .subscribe((node: JstreeModel) => {
      //       // Whenever the active citation changes while this component is active
      //       console.log(`EditCitationComponent.isActive? ${EditCitationComponent.isActive}`);
      //       if (EditCitationComponent.isActive) {
      //         console.log("activeCitationSelector - edit-citation-component");

      //         let service = new BibleService;
      //         let id = <number><unknown>node.id.replace("citation", "");
      //         console.log(`getCitation(${id})`);
      //         service.getCitation(id)
      //           .then(citation => {
      //             console.log("citation returned");
      //             console.log(citation);
      //             this.activeCitation = <CitationExtendedModel>{
      //               id: citation.id,
      //               description: citation.description,
      //               citationLabel: citation.citationLabel,
      //               bibleOrder: citation.bibleOrder,
      //               verses: citation.verses
      //             };

      //             this.editedCitation = <CitationExtendedModel>{
      //               id: citation.id,
      //               description: citation.description,
      //               citationLabel: citation.citationLabel,
      //               bibleOrder: citation.bibleOrder,
      //               verses: citation.verses
      //             };

      //             EditCitationComponent.previousCitation = <CitationExtendedModel>{
      //               id: citation.id,
      //               description: citation.description,
      //               citationLabel: citation.citationLabel,
      //               bibleOrder: citation.bibleOrder,
      //               verses: citation.verses
      //             };

                  // $("div.citation.selected")
                  //   .text(this.activeCitation.citationLabel)
                  //   .removeClass("missing")
                  //   .show(500);
                  // $("#citationDescription").val(this.activeCitation.description);
                  // this.editedCitation = <CitationExtendedModel>{
                  //   id: this.activeCitation.id,
                  //   citationLabel: this.activeCitation.citationLabel,
                  //   bibleOrder: this.activeCitation.bibleOrder,
                  //   verses: this.activeCitation.verses
                  // };

                  // this.activePath = 2;
                  // EditCitationComponent.isPreviousCitation = true;

                  // console.log(`routing to: ${this.paths[this.activePath]}`);
                  // this.router.navigate([`/${this.paths[this.activePath]}`]);
                //});
      //       }
      //     });
      // })(this);

      EditCitationComponent.isSubscribed = true;
    }

    console.log("initializing");
    // SETUP - if there is an active citation, the active citation is initialized

    // (async (obj:EditCitationComponent) => {
    //   if (!EditCitationComponent.isPreviousCitation) {
    //     let service = new BibleService;
    //     if (this.activeCitation) {
    //       console.log(`getting citation, id=${this.activeCitation.id}`);
    //       service.getCitation(this.activeCitation.id)
    //         .then(citation => {
    //           console.log("fetched citation:");
    //           console.log(citation);
    //             this.activeCitation = <CitationExtendedModel>{
    //               id: citation.id,
    //               description: citation.description,
    //               citationLabel: citation.citationLabel,
    //               bibleOrder: citation.bibleOrder,
    //               verses: citation.verses
    //             };

    //             this.editedCitation = <CitationExtendedModel>{
    //               id: citation.id,
    //               description: citation.description,
    //               citationLabel: citation.citationLabel,
    //               bibleOrder: citation.bibleOrder,
    //               verses: citation.verses
    //             };
                
    //             EditCitationComponent.previousCitation = <CitationExtendedModel>{
    //               id: this.activeCitation.id,
    //               citationLabel: this.activeCitation.citationLabel,
    //               bibleOrder: this.activeCitation.bibleOrder,
    //               verses: this.activeCitation.verses
    //             };

    //             WorkbenchComponent.setScriptureRanges(this.activeCitation);
    //             const newRanges = WorkbenchComponent.scriptureRanges.map(sr => 
    //               <CiteScriptureRangeModel>{
    //                 citation: sr.citation,
    //                 verses: sr.verses,
    //                 scriptures: sr.scriptures,
    //                 isOpen: false
    //               });

    //             this.scriptureRanges = newRanges;
    //             EditCitationComponent.isPreviousCitation = true;

    //             console.log("scriptureRanges:");
    //             console.log(this.scriptureRanges);
    //             console.log("ngAfterViewInit - after getCitation");
    //         });
    //     }
    //   }
    //   else {
    //       WorkbenchComponent.setScriptureRanges(this.editedCitation);
    //       const newRanges = WorkbenchComponent.scriptureRanges.map(sr => 
    //         <CiteScriptureRangeModel>{
    //           citation: sr.citation,
    //           verses: sr.verses,
    //           scriptures: sr.scriptures,
    //           isOpen: false
    //         });

    //       this.scriptureRanges = newRanges;
    //   }
    // })(this);
    
    // // console.log("setting the active citation");
    // // console.log(this.activeCitation);
    // $("div.citation.selected").text(this.editedCitation.citationLabel).removeClass("missing").show(500);
    // $("#citationDescription").val(this.editedCitation.description);
    // console.log(`ngAfterViewInit, editedCitation: ${this.editedCitation ? this.editedCitation.id : "undefined"}`);
    // console.log(this.editedCitation);
    // this.editedCitation = <CitationExtendedModel>{
    //     id: this.activeCitation.id,
    //     citationLabel: this.activeCitation.citationLabel,
    //     bibleOrder: this.activeCitation.bibleOrder,
    //     verses: this.activeCitation.verses
    // };

    // console.log("generating scripture ranges");
    // WorkbenchComponent.setScriptureRanges(this.editedCitation);
    // const newRanges = WorkbenchComponent.scriptureRanges.map(sr => 
    //   <CiteScriptureRangeModel>{
    //     citation: sr.citation,
    //     verses: sr.verses,
    //     scriptures: sr.scriptures,
    //     isOpen: false
    //   });

    // this.scriptureRanges = newRanges;
    // this.cd.detectChanges();

    let viewTop  = <number>$("as-split-area.workbench").offset()!.top;
    let viewHeight = <number>$("as-split-area.workbench").innerHeight();
    let viewBottom = viewTop + viewHeight;
    let scrollingTop = <number>$("div.scrolling").offset()!.top;
    this.verseListHeight = viewBottom - scrollingTop;
    $("div.scrolling").css("height", this.verseListHeight + "px");
  }

  ngOnDestroy() {
    EditCitationComponent.isActive = false;
  }
}
