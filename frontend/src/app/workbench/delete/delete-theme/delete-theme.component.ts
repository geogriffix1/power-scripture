import { Component } from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from '../../../model/jstree.model';
import { BibleService } from '../../../bible.service';
import { ThemeModel, ThemeExtendedModel, ThemeModelReference } from '../../../model/theme.model';
import { ThemeToCitationLinkModel } from '../../../model/themeToCitation.model';
import { ThemeCascadeModel } from '../../../model/themeCascade.model';
@Component({
    selector: 'app-delete-theme',
    imports: [],
    templateUrl: './delete-theme.component.html',
    styleUrl: './delete-theme.component.css'
})
export class DeleteThemeComponent {
  activeTheme!: ThemeModel;
  sectionWidth!:number;
  sectionHeight!:number;
  resequencingHeight!:number;
  themeListOpen = false;
  citationListOpen = false;
  themeToDeleteCascade?: ThemeCascadeModel;
  subthemeCount = 0;
  citationCount = 0;

  jstreeModel!:JstreeModel;

  static isSubscribed = false;
  static isActive = false;

  parentTheme!: ThemeModelReference;

  constructor(private service: BibleService) {}

  DeleteTheme(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();

    $(".command-warning").hide(100);
    $("command-message").text("");

    (async () => {
      const cascade = await this.service.getThemeCascade(this.activeTheme.id);

      const themes = cascade?.themes ?? [];
      const links = cascade?.themeToCitations ?? [];

      if (themes.length > 1 || links.length > 0) {
        this.subthemeCount = themes.length - 1;
        this.citationCount = links.length;
        $(".command-warning").show(100);
      }
      else if (themes.length == 1) {
        let parentThemeId = this.activeTheme.parent;
        let success = await this.service.deleteTheme(this.activeTheme.id);
        if (success) {
          $(".command-message").text(`Theme ${this.activeTheme.name} deleted successfully`);
          $(".workbench-theme div.selected.theme").addClass("missing");
          BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${parentThemeId}`);
        }
        else {
          $(".command-message").text("Delete failed");
        }
      }
    })();
  }

  DeleteAll() {
    (async() => {
      let parentThemeId = this.activeTheme.parent;
      console.log(`deleting theme ${this.activeTheme.id}`);
      let success = await this.service.deleteTheme(this.activeTheme.id);
      $(".command-warning").hide(100);
      if (success) {
        $(".command-message").text(`Theme ${this.activeTheme.name} deleted successfully`);
        $(".workbench-theme div.selected.theme").addClass("missing");
        BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${parentThemeId}`);
      }
      else {
        $(".command-message").text("Delete failed");
      }

      $(".command-warning").hide(100);
    })();
  }

  Cancel() {
    $(".command-warning").hide(100);
    $("command-message").text("");
  }

  workbenchDomRect(rect:DOMRectReadOnly) {
    this.sectionWidth = rect.width;
    this.sectionHeight = rect.height;
  }

  ngOnInit() {
    console.log("initializing delete theme component");
    DeleteThemeComponent.isActive = true;

    let rect = WorkbenchComponent.getWorkbenchSize();

    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    $("app-delete-theme").width(rect.width);
    $("#description").width(rect.width - 60);
  }

  ngAfterViewInit() {
    console.log("ngAfterViewInit");
    if (!DeleteThemeComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          this.workbenchDomRect(rect);
          if (DeleteThemeComponent.isActive) {
            this.workbenchDomRect(rect);
            this.sectionWidth - rect.width - 4;
            $("app-delete-theme").width(rect.width);
            $("#description").width(rect.width - 60);
          }
        });

      (async (obj:DeleteThemeComponent) => {
        console.log("subscribing to active theme selector");
        BibleThemeTreeComponent.ActiveThemeSelector
          .subscribe((node:any) => {
            if (WorkbenchComponent.activeTheme) {
              console.log("WorkbenchComponent.activeTheme");
              let parent = WorkbenchComponent.activeTheme.parent;
              if (parent.startsWith("theme")) {
                parent = parent.replace("theme", "");
              }
              else {
                parent = "0";
              }

              this.activeTheme = {
                id: <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", ""),
                name: WorkbenchComponent.activeTheme.text,
                description: WorkbenchComponent.activeTheme.li_attr.title,
                parent: +parent,
                sequence: WorkbenchComponent.activeTheme.li_attr.sequence,
                childCount: 0,
                path: WorkbenchComponent.activeTheme.data.path,
                node: WorkbenchComponent.activeTheme
              };

              $("#name").val(obj.activeTheme.name);
              $("#description").val(obj.activeTheme.description);
              $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
              $(".command-warning").hide();
              $(".commandMessage").text("");
            }
            else {
              $(".workbench-theme div.selected.theme").addClass("missing");
            }
          });
      })(this);

      DeleteThemeComponent.isSubscribed = true;
    }

    (async (obj:DeleteThemeComponent) => {
      if (WorkbenchComponent.activeTheme) {
        console.log("WorkbenchComponent has an active theme");
        obj.activeTheme = {
          id: <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", ""),
          name: WorkbenchComponent.activeTheme.text,
          description: WorkbenchComponent.activeTheme.li_attr.title,
          parent: <number><unknown>WorkbenchComponent.activeTheme.parent.replace("theme", ""),
          sequence: WorkbenchComponent.activeTheme.li_attr.sequence,
          childCount: 0,
          path: WorkbenchComponent.activeTheme.data.path,
          node: WorkbenchComponent.activeTheme
        };

        $("#name").val(obj.activeTheme.name);
        $("#description").val(obj.activeTheme.description);
        $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
      }
      else {
        console.log("No WorkbenchComponent.activeTheme");
        $(".workbench-theme div.selected.theme").addClass("missing");
      }
    })(this);
  }

  ngOnDestroy() {
    console.log("ngOnDestroy");
    DeleteThemeComponent.isActive = false;
  }
}
