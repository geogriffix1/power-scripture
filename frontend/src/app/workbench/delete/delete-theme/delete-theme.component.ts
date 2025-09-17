import { Component } from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from '../../../model/jstree.model';
import { BibleService } from '../../../bible.service';
import { ThemeModel, ThemeExtendedModel, ThemeModelReference } from '../../../model/theme.model';
import { ThemeToCitationLinkModel } from '../../../model/themeToCitation.model';
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

  jstreeModel!:JstreeModel;

  static isSubscribed = false;
  static isActive = false;

  parentTheme!: ThemeModelReference;

  DeleteTheme() {
    console.log("Delete theme clicked");
    $(".command-message").text("");
    this.activeTheme.name = <string>$("#name").val();
    this.activeTheme.description = <string>$("#description").val();

    console.log("Deleting");
    console.log(this.activeTheme.name);

    let service = new BibleService;
    
    //(async (obj:DeleteThemeComponent) => {
      console.log("preparing to delete theme:");
      console.log(this.activeTheme);
      //console.log(obj.activeTheme);
      // await service.deleteTheme(obj.activeTheme.id, (success:boolean, message:string) => {
      //   $(".command-message").text(message);
      //   console.log("deleting dom node");
      //   BibleThemeTreeComponent.deleteDomNode(`#theme${obj.activeTheme.id}`);
      // });

      // console.log("preparing to resequence:");
      // await service.normalizeThemeSequence(obj.activeTheme.parent, (success:boolean, message:string) => {
      //   console.log(`normalizeThemeSequence success:${success}, ${message}`);
      // });

      let theme = service.getTheme(this.activeTheme.parent).then();
      console.log("back from getTheme");
      console.log(theme);

    //})(this);
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
