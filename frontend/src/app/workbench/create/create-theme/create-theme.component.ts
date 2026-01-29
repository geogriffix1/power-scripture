import { Component, ElementRef, ViewChild } from '@angular/core';
import { BibleService } from '../../../bible.service';
import { WorkbenchComponent } from '../../workbench.component';
import { ThemeModel } from '../../../model/theme.model';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';

@Component({
    selector: 'app-create-theme',
    imports: [],
    templateUrl: './create-theme.component.html',
    styleUrl: './create-theme.component.css'
})
export class CreateThemeComponent {
  @ViewChild('name', { static: true }) nameField!: ElementRef;
  @ViewChild('description', { static: true }) descriptionField!: ElementRef;
  activeTheme!:ThemeModel;

  CreateTheme() {
    $("div.command-message").text("");
    if (WorkbenchComponent.activeTheme == null) {
      $("div.command-message").text("Theme not created: Parent Theme was not selected.").show(100);
      return;
    }

    if (!this.nameField.nativeElement.value) {
      $("div.command-message").text("Theme not created: Theme Name is required.").show(100);
      return;
    }

    if (this.nameField.nativeElement.value.length > 30) {
      this.nameField.nativeElement.value = this.nameField.nativeElement.value.substring(0, 30);
    }

    if (this.descriptionField.nativeElement.value.length > 100) {
      this.descriptionField.nativeElement.value = this.descriptionField.nativeElement.value.substring(0, 100);
    }

    (async (obj) => {
      let service = new BibleService;
      if (WorkbenchComponent.activeTheme) {
        let id = <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", "");
        service.createTheme(id, this.nameField.nativeElement.value.trim(), this.descriptionField.nativeElement.value.trim())
          .then(theme => {
            console.log("after create theme attempt");
            console.log(theme);
             if (theme.id == -1) {
              console.log("theme.id==-1");
               $("div.command-message").text(theme.description);
             }
             else {
              BibleThemeTreeComponent.appendTheme(theme);
              obj.nameField.nativeElement.value = "";
              obj.descriptionField.nativeElement.value = "";
               $("div.command-message").text(`Theme "${theme.name}" created successfully`); 
             }
          });
      }
      else {
        $(".workbench-parent-theme div.selected-theme").addClass("missing");
      }
    })(this);
  }
}
