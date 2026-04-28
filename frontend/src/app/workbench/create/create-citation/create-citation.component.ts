import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BibleService } from '../../../bible.service';
import { WorkbenchComponent } from '../../workbench.component';
import { ThemeModel } from '../../../model/theme.model';
import { CitationModel } from '../../../model/citation.model';
import { ThemeToCitationLinkModel } from '../../../model/themeToCitation.model';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';

@Component({
    selector: 'app-create-citation',
    imports: [],
    templateUrl: './create-citation.component.html',
    styleUrl: './create-citation.component.css'
})
export class CreateCitationComponent {
  @ViewChild('description', { static: true}) descriptionField!: ElementRef;
  activeTheme!: ThemeModel;
  selectedFolder!:string;

  constructor(private router: Router) {}

  CreateCitation() {
    $("div.command-message").text("");
    if (WorkbenchComponent.activeTheme == null) {
      $("div.command-message").text("Citation not created: Parent Theme was not selected.").show(100);
      return;
    }

    if (this.descriptionField.nativeElement.value.length > 100) {
      this.descriptionField.nativeElement.value = this.descriptionField.nativeElement.value.substring(0, 100);
    }

    (async () => {
      let service = new BibleService;
      if (WorkbenchComponent.activeTheme) {
        let id = <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", "");
        service.createCitation(this.descriptionField.nativeElement.value, id, 0, [])
          .then(link => {
            const themeToCitation = link.themeToCitation;
            BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${themeToCitation.themeId}`, parent => {
              BibleThemeTreeComponent.openDomThemeNode(parent);
              let newCitation = BibleThemeTreeComponent.getDomNode(`citation${themeToCitation.id}`);
              BibleThemeTreeComponent.setActiveCitation(newCitation);
              this.showOptions();
            });
          });
      }
      else {
        $(".workbench-parent-theme div.selected-theme").addClass("missing");
      }
    })();
  }

  EditCitation() {
    this.router.navigate(['/edit/citation']);
  }

  showOptions() {
    console.log("show options!");
    $(".ps-action-btn").show(500);
  }
}