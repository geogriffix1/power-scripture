import { Router, ActivatedRoute } from '@angular/router'
import { Component, signal, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleThemeTreeComponent } from '../../bible-theme-tree/bible-theme-tree.component';
import { WorkbenchComponent } from '../workbench.component';
import { EditThemeComponent } from './edit-theme/edit-theme.component';
import { EditCitationComponent } from './edit-citation/edit-citation.component';
import { JstreeModel } from '../../model/jstree.model';

@Component({
    selector: 'app-edit',
    imports: [
        CommonModule,
        EditThemeComponent,
        EditCitationComponent
    ],
    templateUrl: './edit.component.html',
    styleUrl: './edit.component.css'
})
export class EditComponent {

  constructor(
    private actRoute: ActivatedRoute,
    private router: Router,
    private injector: EnvironmentInjector
   ) {
    BibleThemeTreeComponent.ActiveCitationSelector.subscribe((node: JstreeModel) => {
      runInInjectionContext(this.injector, () => {
        this.activeCitationNode.set(node);
      });
    });
  }

  paths = ["edit", "edit/theme", "edit/citation", "edit/citation/range", "edit/citation/verse", "edit/citation/verse/markup"];
  
  editTypes = [
    "Choose the type to edit",
    "Edit a Bible Theme",
    "Edit a Bible Scripture Citation"
  ];

  static isSubscribed = false;
  static isActive = false;
  activeThemeNode = signal(WorkbenchComponent.activeTheme);
  activeCitationNode = signal(WorkbenchComponent.activeCitation);

  activeType = 0;

  editType = this.editTypes[this.activeType];
  settingsActive = false;
  sectionWidth!:number;
  sectionHeight!:number;
  instance = this;

  workbenchDomRect(rect:DOMRectReadOnly) {
    this.sectionWidth = rect.width;
    this.sectionHeight = rect.height;
  }
  
  onClickSettings() {
    if (this.settingsActive) {
      $("div.settings").hide(500).removeClass("settings-active");
    }
    else {
      $("div.settings").show(500).addClass("settings-active");
    }

    this.settingsActive = !this.settingsActive;
  }
  onRadioClickSettings(index:number) {
    if (this.activeType != index) {
      this.router.navigate([this.paths[index]]);
    }

    $("div.settings.settings-active").hide(500).removeClass("settings-active");
    this.settingsActive = false;

    this.activeType = index;
  }

  ngOnInit() {
    EditComponent.isActive = true;

    this.activeType = this.paths.indexOf(this.actRoute.snapshot.routeConfig?.path ?? "edit");
    this.editType = this.editTypes[this.activeType];

    if (this.activeType == 0) {
      this.settingsActive = false;
      this.onClickSettings();
    }

    let rect = WorkbenchComponent.getWorkbenchSize();
    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    $("app-edit").width(rect.width);
    $("#description").width(rect.width - 60);
  }

  ngAfterViewInit() {
    if (!EditComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          if (EditComponent.isActive) {
            this.workbenchDomRect(rect);            
            this.sectionWidth = rect.width - 4;
            $("app-edit").width(rect.width);
            $("#description").width(rect.width - 60);
          }      
        });

      BibleThemeTreeComponent.ActiveThemeSelector.subscribe((themeNode:JstreeModel) => {
        this.activeThemeNode.set(themeNode);
      });

      EditComponent.isSubscribed = true;
    }
  }

  ngOnDestroy() {
    EditComponent.isActive = false;
  }
}
