import { Component, Input, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { ScriptureRangeEditorComponent } from '../../tools/scripture-range-editor/scripture-range-editor.component';
import { CiteScriptureRangeModel } from '../../../model/citeScriptureRangeModel';
import { EditComponent } from '../edit.component';
import { BibleService } from '../../../bible.service';
import { CitationExtendedModel } from '../../../model/citation.model';
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
  activeCitation!: CitationExtendedModel;
  editedCitation!: CitationExtendedModel;
  selectedFolder!:string;
  sectionWidth!:number;
  sectionHeight!:number;
  verseListHeight!:number;
  citationLabel!:string;
  scriptureRanges!: CiteScriptureRangeModel[];
  editedCitationVerses!: CitationVerseModel[];

  constructor(private cdr: ChangeDetectorRef) {}

  workbenchDomRect(rect:DOMRectReadOnly) {
    this.sectionWidth = rect.width;
    this.sectionHeight = rect.height;
  }

  static isActive = false;
  static isSubscribed = false;

  OpenCloseScriptureRange(i:number) {
    console.log(`OpenCloseScriptureRange(${i})`)
    let activeRange = this.scriptureRanges[i];
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

    this.scriptureRanges[i].isOpen = !isOpen;
  }

  EditCitation() {

  }

  ngOnInit() {
    console.log("initializing edit citation component");
    EditCitationComponent.isActive = true;
    let rect = WorkbenchComponent.getWorkbenchSize();
  
    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    $("app-edit-theme").width(rect.width);
    $("#description").width(rect.width - 60);
  }

  ngAfterViewInit() {
    console.log("afterViewInit");
    if (!EditCitationComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          if (EditCitationComponent.isActive) {
            $("#description").css('width', (rect.width - 70) + "px");
            console.log(`description width set to ${(rect.width - 70) + "px"}`);
            let viewTop  = <number>$("as-split-area.workbench").offset()!.top;
            let viewHeight = <number>$("as-split-area.workbench").innerHeight();
            let viewBottom = viewTop + viewHeight;
            let scrollingTop = <number>$("div.scrolling").offset()!.top;
            this.verseListHeight = viewBottom - scrollingTop;
            $("div.scrolling").css("height", this.verseListHeight + "px");            
          }
        });
      
      (async (obj:EditCitationComponent) => {
        console.log("subscribing to active citation selector");
        BibleThemeTreeComponent.ActiveCitationSelector
          .subscribe((node: any) => {
            // Whenever the active citation changes while this component is active
            if (EditCitationComponent.isActive) {
              if (WorkbenchComponent.activeCitation) {
                let service = new BibleService;
                let id = <number><unknown>WorkbenchComponent.activeCitation.id.replace("citation", "");
                service.getCitation(id)
                  .then(citation => {

                      console.log("citation:");
                      console.log(citation);

                    obj.activeCitation = citation;
                    $("div.citation.selected").text(obj.activeCitation.citationLabel).removeClass("missing").show(500);
                    $("#description").val(obj.activeCitation.description);
                    obj.editedCitation = <CitationExtendedModel>{
                        id: obj.activeCitation.id,
                        citationLabel: obj.activeCitation.citationLabel,
                        bibleOrder: obj.activeCitation.bibleOrder,
                        verses: obj.activeCitation.verses
                    };

                    console.log("generating scripture ranges");
                    WorkbenchComponent.setScriptureRanges(obj.editedCitation);
                    obj.scriptureRanges = [];
                    WorkbenchComponent.scriptureRanges.forEach(sr => {
                      obj.scriptureRanges.push(<CiteScriptureRangeModel>{
                        citation: sr.citation,
                        verses: sr.verses,
                        scriptures: sr.scriptures,
                        isOpen: false
                      })
                    });
                    console.log(`scripture range count: ${obj.scriptureRanges.length}`);
                    obj.scriptureRanges.forEach(range => {
                      console.log(`citation: ${range.citation}`)
                    });
                  });
              }
            }
          });
      })(this);

      EditCitationComponent.isSubscribed = true;
    }

    console.log("initializing");
    // SETUP - if there is an active citation, the active citation is initialized
    (async (obj:EditCitationComponent) => {
      if (WorkbenchComponent.activeCitation) {
        let service = new BibleService;
        let id = <number><unknown>WorkbenchComponent.activeCitation.id.replace("citation", "");
        service.getCitation(id)
          .then(citation => {
            obj.activeCitation = citation;
            $("div.citation.selected").text(obj.activeCitation.citationLabel).removeClass("missing").show(500);
            $("#description").val(obj.activeCitation.description);
            obj.editedCitation = <CitationExtendedModel>{
                id: obj.activeCitation.id,
                citationLabel: obj.activeCitation.citationLabel,
                bibleOrder: obj.activeCitation.bibleOrder,
                verses: obj.activeCitation.verses
            };

            console.log("citation:");
            console.log(citation);

            console.log("generating scripture ranges");
            WorkbenchComponent.setScriptureRanges(obj.editedCitation);
            obj.scriptureRanges = WorkbenchComponent.scriptureRanges.map(sr => {
              sr.isOpen = false;
              return sr;
            });
          });
      };
    })(this);

    let viewTop  = <number>$("as-split-area.workbench").offset()!.top;
    let viewHeight = <number>$("as-split-area.workbench").innerHeight();
    let viewBottom = viewTop + viewHeight;
    let scrollingTop = <number>$("div.scrolling").offset()!.top;
    this.verseListHeight = viewBottom - scrollingTop;
    $("div.scrolling").css("height", this.verseListHeight + "px");
    console.log("initializing done");          
  }

  ngOnDestroy() {
    EditCitationComponent.isActive = false;
  }
}
