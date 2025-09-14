import { Component, Input, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { CiteScriptureRangeModel } from '../../../model/citeScriptureRangeModel';
import { EditComponent } from '../edit.component';
import { BibleService } from '../../../bible.service';
import { CitationExtendedModel } from '../../../model/citation.model';
import { CitationVerseModel, CitationVerseExtendedModel } from '../../../model/citationVerse.model';

@Component({
  selector: 'app-edit-citation',
  standalone: true,
  imports: [
    //EditCitationContextMenuComponent,
    EditComponent],
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

  workbenchDomRect(rect:DOMRectReadOnly) {
    this.sectionWidth = rect.width;
    this.sectionHeight = rect.height;
  }

  static isActive = false;
  static isSubscribed = false;

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
      console.log("not subscribed");
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          console.log("resizing")
          this.workbenchDomRect(rect);
          if(EditCitationComponent.isActive) {
            console.log("EditCitationComponent is active for resize");
            this.workbenchDomRect(rect);
            this.sectionWidth - rect.width - 4;
            $("app-edit-theme").width(rect.width);
            $("#description").width(rect.width - 60);
            let viewTop = $("as-split-area.workbench").offset()!.top;
            let viewHeight = <number>$("as-split-area.workbench").innerHeight();
            let resultsTop = $("section.scrollable-content").offset()!.top;
            this.verseListHeight = viewHeight - resultsTop + viewTop;
            $("div.resequencing").css("height", this.verseListHeight + "px");
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
                    obj.activeCitation = citation;
                    $("div.citation.selected").text(obj.activeCitation.citationLabel).removeClass("missing").show(500);
                    $("#description").val(obj.activeCitation.description);
                    obj.editedCitation = <CitationExtendedModel>{
                        id: obj.activeCitation.id,
                        citationLabel: obj.activeCitation.citationLabel,
                        bibleOrder: obj.activeCitation.bibleOrder,
                        verses: obj.activeCitation.verses
                    };

                    obj.editedCitationVerses = obj.editedCitation.verses;
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
            $("div.citation").text(obj.activeCitation.citationLabel).removeClass("missing").show(500);
            $("#description").val(obj.activeCitation.description);
            obj.editedCitation = <CitationExtendedModel>{
                id: obj.activeCitation.id,
                citationLabel: obj.activeCitation.citationLabel,
                bibleOrder: obj.activeCitation.bibleOrder,
                verses: obj.activeCitation.verses
            };

            obj.editedCitationVerses = obj.editedCitation.verses;
          });
      };
    })(this);

    let rect = WorkbenchComponent.getWorkbenchSize();
    //$("#description").css('width', (rect.width - 5) + "px");
    let viewTop = <number>$("as-split-area.workbench").offset()!.top;
    let viewHeight = <number>$("as-split-area.workbench").innerHeight();
    let resultsTop = $("section.scrollable-content").offset()!.top;
    let searchResultsHeight = viewTop + viewHeight - resultsTop;

    $("div.search-results").css("height", searchResultsHeight + "px");
  }

  ngOnDestroy() {
    EditCitationComponent.isActive = false;
  }
}
