import { OnInit, Input, Signal } from '@angular/core';
import { Component } from '@angular/core';
import { BibleService } from '../../../bible.service';
import { ThemeToCitationModel } from '../../../model/themeToCitation.model';
import { JstreeModel } from '../../../model/jstree.model';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { WorkbenchComponent } from '../../workbench.component';

@Component({
    selector: 'app-delete-citation',
    imports: [],
    templateUrl: './delete-citation.component.html',
    styleUrl: './delete-citation.component.css'
})
export class DeleteCitationComponent {
  @Input({required: true})
    activeCitationNode!: Signal<JstreeModel | null>;
  activeThemeToCitation!: ThemeToCitationModel;
  static isActive: boolean;
  static isSubscribed: boolean;
  sectionWidth?: number;
  missingMessage = "Please select an active <b>Citation</b> from the <b>Bible Theme Tree</b>";

  constructor(private service: BibleService) {}

  DeleteCitationLink(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();

    console.log("DeleteCitationLink clicked");
    console.log(`this.activeThemeToCitation.id: ${this.activeThemeToCitation.id}`);
    (async() => {
      const themeId = this.activeThemeToCitation.themeId;
      await this.service.deleteThemeToCitation(this.activeThemeToCitation.id);
      BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${themeId}`);
      WorkbenchComponent.activeCitation = JstreeModel.null;
      $("#label").val("");
      $("#citation-description").val("");
      $("div.citation.selected").addClass("missing").html(this.missingMessage);
      $(".command-warning").show(100);
      $(".command-message").text("Delete successful");
    })();

    $("command-message").text("");
  }

  ngOnInit() {
    DeleteCitationComponent.isActive = true;
  }
  
  ngAfterViewInit() {
    console.log("ngAfterViewInit");
    if (!DeleteCitationComponent.isSubscribed) {  
      (async (obj:DeleteCitationComponent) => {
        console.log("subscribing to active citation selector");
        BibleThemeTreeComponent.ActiveCitationSelector
          .subscribe((node:any) => {
            if (WorkbenchComponent.activeCitation) {
              console.log("WorkbenchComponent.activeCitation");
              console.log(WorkbenchComponent.activeCitation);
              let parent = WorkbenchComponent.activeCitation.parent;
              let parentNode = BibleThemeTreeComponent.getDomNode(parent);
              console.log("parentNode:");
              console.log(parentNode);
              console.log(`parentNode.data.path ${parentNode.data.path}`);
              if (parent.startsWith("theme")) {
                parent = parent.replace("theme", "");
              }
              else {
                parent = "0";
              }

              this.activeThemeToCitation = {
                id: <number><unknown>WorkbenchComponent.activeCitation.id.replace("citation", ""),
                citationLabel: WorkbenchComponent.activeCitation.text,
                description: WorkbenchComponent.activeCitation.li_attr.title,
                citationId: WorkbenchComponent.activeCitation.li_attr.citationId,
                themeId: +parent,
                sequence: WorkbenchComponent.activeCitation.li_attr.sequence,
              };

              $("#label").val(this.activeThemeToCitation.citationLabel);
              $("#citation-description").val(obj.activeThemeToCitation.description);
              $("div.citation.selected").removeClass("missing").text(parentNode.data.path).show(500);
              $(".command-warning").hide();
              $(".commandMessage").text("");
            }
            else {
              $("div.citation.selected").addClass("missing");
            }
          });
      })(this);

      DeleteCitationComponent.isSubscribed = true;
    }

    (async (obj:DeleteCitationComponent) => {
      if (WorkbenchComponent.activeCitation) {
        console.log("WorkbenchComponent has an active citation");
        let parent = WorkbenchComponent.activeCitation.parent;
        let parentNode = BibleThemeTreeComponent.getDomNode(parent);
        if (parent.startsWith("theme")) {
          parent = parent.replace("theme", "");
        }
        else {
          parent = "0";
        }

        this.activeThemeToCitation = {
          id: <number><unknown>WorkbenchComponent.activeCitation.id.replace("citation", ""),
          citationLabel: WorkbenchComponent.activeCitation.text,
          description: WorkbenchComponent.activeCitation.li_attr.title,
          citationId: WorkbenchComponent.activeCitation.li_attr.citationId,
          themeId: +parent,
          sequence: WorkbenchComponent.activeCitation.li_attr.sequence,
        };

        $("#label").val(this.activeThemeToCitation.citationLabel);
        $("#citation-description").val(obj.activeThemeToCitation.description);
        $("div.citation.selected").removeClass("missing").text(parentNode.data.path).show(500);
        $(".command-warning").hide();
        $(".command-message").text("");
      }
      else {
        console.log("No WorkbenchComponent.activeCitation");
        $("div.selected.citation").html(this.missingMessage).addClass("missing");
      }
    })(this);
  }
}
