import { Component, Input, Signal, effect } from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from '../../../model/jstree.model';
import { BibleService } from '../../../bible.service';
import { ThemeModel, ThemeExtendedModel, ThemeModelReference } from '../../../model/theme.model';
import { ThemeToCitationLinkModel } from '../../../model/themeToCitation.model';
import { ThemeCascadeModel } from '../../../model/themeCascade.model';
import { ThemeCascadeCitationModel } from '../../../model/themeCascade.model';
import { ThemeChainLinkModel } from '../../../model/themeChain.model';
@Component({
    selector: 'app-delete-theme',
    imports: [],
    templateUrl: './delete-theme.component.html',
    styleUrl: './delete-theme.component.css'
})
export class DeleteThemeComponent {
  @Input({required: true})
    activeThemeNode!: Signal<JstreeModel|null>;
  activeTheme!: ThemeModel;
  themeListOpen = false;
  citationListOpen = false;
  themeToDeleteCascade?: ThemeCascadeModel;
  subthemeCount = 0;
  citationCount = 0;
  private successMessageTimeout?: ReturnType<typeof setTimeout>;

  jstreeModel!:JstreeModel;

  static isSubscribed = false;
  static isActive = false;
  missingThemeText = "Please select the <b>Theme</b> from the <b>Bible Theme Tree</b>";

  parentTheme!: ThemeModelReference;

  constructor(private service: BibleService)
  {
    console.log("DeleteThemeComponent ctor");
     effect(() => {      
      if (this.activeThemeNode()) {
        $(".command-message").text("").hide(100);
        let id = <number><unknown>this.activeThemeNode()?.id?.replace("theme", "");
        $("#name").val(this.activeThemeNode()!.text).show(500);
        $("#description").val(this.activeThemeNode()?.li_attr.title).show(500);
        $("div.theme.selected").removeClass("missing").text(this.activeThemeNode()?.data.path).show(500);
      }
      else {
        $("#name").val("");
        $("#description").val("");
        $("div.theme.selected")
          .removeClass("missing")
          .addClass("missing")
          .html("Please select the <b>Theme</b> to delete from the <b>Bible Theme Tree</b>")
          .show(500);
      }
    });
  }

  DeleteTheme(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();

    $(".command-warning").hide(100);
    $(".command-message").text("");

    (async () => {
      if (!this.activeThemeNode()!.parent.startsWith("theme")) {
        $(".command-message").text("Cannot delete a root theme").show(100);
        return;
      }

      this.themeToDeleteCascade = await this.service.getThemeCascade(+this.activeThemeNode()!.id.replace("theme", ""));

      const themes = (this.themeToDeleteCascade?.themes ?? []) as ThemeChainLinkModel[];
      const links = (this.themeToDeleteCascade?.citations ?? []) as ThemeCascadeCitationModel[]

      if (themes.length > 1 || links.length > 0) {
        this.subthemeCount = themes.length - 1;
        this.citationCount = links.length;
        $(".command-warning").show(100);
      }
      else if (themes.length == 1) {
        let themeId = +this.activeThemeNode()!.id.replace("theme", "");
        let remarks = this.activeThemeNode()?.data.remarks == 'Y';
        let success = await this.service.deleteTheme(themeId);
        if (success) {
          console.log("Delete successful");
          
          this.ShowSuccess(`Theme ${this.activeThemeNode()!.data.path} deleted successfully`);

          await this.service.deleteThemeRemarks(themeId);

          $("div.selected.theme").addClass("missing").html(this.missingThemeText);
          BibleThemeTreeComponent.refreshDomNodeFromDb(this.activeThemeNode()!.parent);
          WorkbenchComponent.activeTheme = JstreeModel.null;
          $("#name").val("");
          $("#description").val("");
          $(".command-warning").hide();
        }
        else {
          $(".command-message").text("Delete failed").show(100);
        }
      }
    })();
  }

  DeleteAll() {
    (async() => {
      let themeId = +this.activeThemeNode()!.id.replace("theme", "");
      console.log(`deleting theme ${this.activeThemeNode()!.id}`);
      let success = await this.service.deleteTheme(themeId);
      $(".command-warning").hide(100);
      if (success) {
        console.log("Delete success");
        const tasks = [];
        tasks.push(this.service.deleteThemeRemarks(themeId));

        const themes = (this.themeToDeleteCascade?.themes ?? []) as ThemeChainLinkModel[];
        this.ShowSuccess(`Theme ${this.activeThemeNode()!.data.path} deleted successfully`);
          for (const theme of themes) {
            if (theme.remarks) {
              tasks.push(this.service.deleteThemeRemarks(theme.themeId));
            }
          }

        await Promise.all(tasks);
        $(".workbench-theme div.selected.theme").addClass("missing");
        BibleThemeTreeComponent.refreshDomNodeFromDb(this.activeThemeNode()!.parent);
        WorkbenchComponent.activeTheme = JstreeModel.null;
        $("#name").val("");
        $("#description").val("");
        $(".command-warning").hide();
      }
      else {
        console.log("Delete Failed");
        $(".command-message").text("Delete failed").show(100);
      }

      $(".command-warning").hide(100);
    })();
  }

  Cancel() {
    $(".command-warning").hide(100);
    $(".command-message").text("");
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

//   ngOnInit() {
//     DeleteThemeComponent.isActive = true;
//   }

//   ngAfterViewInit() {
//     console.log("ngAfterViewInit");
//     if (!DeleteThemeComponent.isSubscribed) {
//       (async (obj:DeleteThemeComponent) => {
//         console.log("subscribing to active theme selector");
//         BibleThemeTreeComponent.ActiveThemeSelector
//           .subscribe((node:any) => {
//             if (WorkbenchComponent.activeTheme) {
//               console.log("WorkbenchComponent.activeTheme");
//               let parent = WorkbenchComponent.activeTheme.parent;
//               if (parent.startsWith("theme")) {
//                 parent = parent.replace("theme", "");
//               }
//               else {
//                 parent = "0";
//               }

//               this.activeTheme = {
//                 id: <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", ""),
//                 name: WorkbenchComponent.activeTheme.text,
//                 description: WorkbenchComponent.activeTheme.li_attr.title,
//                 parent: +parent,
//                 sequence: WorkbenchComponent.activeTheme.li_attr.sequence,
//                 childCount: 0,
//                 path: WorkbenchComponent.activeTheme.data.path,
//                 node: WorkbenchComponent.activeTheme
//               };

//               $("#name").val(obj.activeTheme.name);
//               $("#description").val(obj.activeTheme.description);
//               $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
//               $(".command-warning").hide();
//               $(".command-message").text("");
//             }
//             else {
//               $(".workbench-theme div.selected.theme").addClass("missing");
//             }
//           });
//       })(this);

//       DeleteThemeComponent.isSubscribed = true;
//     }

//     (async (obj:DeleteThemeComponent) => {
//       if (WorkbenchComponent.activeTheme) {
//         console.log("WorkbenchComponent has an active theme");
//         obj.activeTheme = {
//           id: <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", ""),
//           name: WorkbenchComponent.activeTheme.text,
//           description: WorkbenchComponent.activeTheme.li_attr.title,
//           parent: <number><unknown>WorkbenchComponent.activeTheme.parent.replace("theme", ""),
//           sequence: WorkbenchComponent.activeTheme.li_attr.sequence,
//           childCount: 0,
//           path: WorkbenchComponent.activeTheme.data.path,
//           node: WorkbenchComponent.activeTheme
//         };

//         $("#name").val(obj.activeTheme.name);
//         $("#description").val(obj.activeTheme.description);
//         $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
//       }
//       else {
//         console.log("No WorkbenchComponent.activeTheme");
//         $(".workbench-theme div.selected.theme").addClass("missing");
//       }
//     })(this);
//   }
 }
