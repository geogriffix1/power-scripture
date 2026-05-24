import { Component, Input, Signal, effect } from '@angular/core';
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
  private successMessageTimeout?: ReturnType<typeof setTimeout>;
  static isActive: boolean;
  static isSubscribed: boolean;
  sectionWidth?: number;
  missingMessage = "Please select the active <b>Citation</b> to delete from the <b>Bible Theme Tree</b>";

  constructor(private service: BibleService)
  {
     effect(() => {      
      $(".command-message, .command-warning").text("").hide(100);
      if (this.activeCitationNode()) {
        let path = BibleThemeTreeComponent.getDomNode(this.activeCitationNode()!.parent).data.path;
        let id = <number><unknown>this.activeCitationNode()?.id?.replace("citation", "");
        let description = this.activeCitationNode()!.li_attr.title;

        $("#label").val(this.activeCitationNode()!.text ?? "")
          .attr("title", this.activeCitationNode()!.text ?? "[empty description]")
          .show(500);
        $("#description")
          .val(description.trim() == "" ? "[empty description]" : description)
          .show(500);
        $("div.citation.selected").removeClass("missing").text(path);
      }
      else {
        $("#label").val("");
        $("#description").val("").attr("title", "");
        $("div.citation.selected")
          .removeClass("missing")
          .addClass("missing")
          .html(this.missingMessage);
      }
    });
  }

  DeleteCitationLink(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();

    $(".command-warning").hide(100);
    $(".command-message").text("");

    (async() => {
      const themeId = +this.activeCitationNode()!.parent.replace("theme", "");
      const themeToCitationId = +this.activeCitationNode()!.id.replace("citation", "");
      await this.service.deleteThemeToCitation(themeToCitationId);
      BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${themeId}`);
      WorkbenchComponent.activeCitation = JstreeModel.null;
      $("#label").val("");
      $("#description").val("").attr("title", "");
      $("div.citation.selected").addClass("missing").html(this.missingMessage);

      this.ShowSuccess("Delete was successful");
      // $(".command-warning").text("Delete successful").show(100);
    })();

    $("command-message").text("");
  }

    ShowSuccess(message: string) {
    if (this.successMessageTimeout) {
      clearTimeout(this.successMessageTimeout);
    }

    $(".command-message").text(message).show(100);
    this.successMessageTimeout = setTimeout(() => {
      $(".command-message").text("").hide(100);
    }, 5000);
  }

}
