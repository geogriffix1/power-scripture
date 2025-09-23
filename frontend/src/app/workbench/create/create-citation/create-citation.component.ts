import { Component, Input, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { CiteScriptureRangeModel } from '../../../model/citeScriptureRangeModel';
import { CreateComponent } from '../create.component';
//import { CreateCitationContextMenuComponent } from '../../../context-menu/create-citation-context-menu.component';

@Component({
    selector: 'app-create-citation',
    imports: [],
    templateUrl: './create-citation.component.html',
    styleUrl: './create-citation.component.css'
})
export class CreateCitationComponent {
  selectedFolder!:string;
  sectionWidth!:number;
  sectionHeight!:number;
  citationLabel!:string;
  scriptureRanges!: CiteScriptureRangeModel[];

  static isActive = false;
  static isSubscribed = false;

  ngOnInit() {
    CreateCitationComponent.isActive = true;
    let rect = WorkbenchComponent.getWorkbenchSize();
  
    console.log("create-citation ngOnInit rect:");
    console.log(rect);
    this.scriptureRanges = WorkbenchComponent.scriptureRanges ?? [];
    let label = "";
    let comma = "";
    for (let i=0; i< this.scriptureRanges.length; i++) {
      label = `${label}${comma}${this.scriptureRanges[i].citation}`;
      comma = ", ";
    }

    this.citationLabel = label;
  }

  ngAfterViewInit() {
    let rect = WorkbenchComponent.getWorkbenchSize();
    let viewTop = <number>$("as-split-area.workbench").offset()!.top;
    let viewHeight = <number>$("as-split-area.workbench").innerHeight();
    let resultsTop = $("section.scrollable-content").offset()!.top;
    let searchResultsHeight = viewTop + viewHeight - resultsTop;

    $("div.search-results").css("height", searchResultsHeight + "px");

    if (!CreateCitationComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          if (CreateCitationComponent.isActive) {
            $("#description").css('width', (rect.width - 70) + "px");
            console.log(`description width set to ${(rect.width - 70) + "px"}`);
            let viewTop  = <number>$("as-split-area.workbench").offset()!.top;
            let viewHeight = <number>$("as-split-area.workbench").innerHeight();
            let resultsTop = $("div.search-results").offset()!.top;
            let searchResultsHeight = viewTop + viewHeight - resultsTop;
            
            $("div.search-results").css("height", searchResultsHeight + "px");
          }
        });

      CreateCitationComponent.isSubscribed = true;
    }
  }

  ngOnDestroy() {
    CreateCitationComponent.isActive = false;
  }
}
