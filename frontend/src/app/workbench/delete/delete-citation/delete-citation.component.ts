import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { BibleService } from '../../../bible.service';
import { JstreeModel } from '../../../model/jstree.model';
import { WorkbenchComponent } from '../../workbench.component';

@Component({
    selector: 'app-delete-citation',
    imports: [],
    templateUrl: './delete-citation.component.html',
    styleUrl: './delete-citation.component.css'
})
export class DeleteCitationComponent {
  activeCitation?: JstreeModel;
  static isActive: boolean;
  sectionWidth?: number;

  constructor(private service: BibleService) {}

  DeleteCitationLink(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();

    $("command-message").text("");

    // (async () => {
    //   const cascade = await this.service.deleteCitationLink(this!.activeCitation.id);

    //   if (themes.length > 1 || links.length > 0) {
    //     this.subthemeCount = themes.length - 1;
    //     this.citationCount = links.length;
    //     $(".command-warning").show(100);
    //   }
    //   else if (themes.length == 1) {
    //     let parentThemeId = this.activeTheme.parent;
    //     let success = await this.service.deleteTheme(this.activeTheme.id);
    //     if (success) {
    //       $(".command-message").text(`Theme ${this.activeTheme.name} deleted successfully`);
    //       $(".workbench-theme div.selected.theme").addClass("missing");
    //       BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${parentThemeId}`);
    //     }
    //     else {
    //       $(".command-message").text("Delete failed");
    //     }
    //   }
    // })();
  }

  ngOnInit() {
    DeleteCitationComponent.isActive = true;
    let rect = WorkbenchComponent.getWorkbenchSize();

    //WorkbenchComponent.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    $("app-edit-theme").width(rect.width);
    $("#citationDescription").width(rect.width - 60);
  }
}
