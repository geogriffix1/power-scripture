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
        console.log('Parent setting activeCitationNode', node);
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
    console.log("onClickSettings");
    if (this.settingsActive) {
      $("div.settings").hide(500).removeClass("settings-active");
    }
    else {
      $("div.settings").show(500).addClass("settings-active");
    }

    this.settingsActive = !this.settingsActive;
  }
  onRadioClickSettings(index:number) {
    console.log("onRadioClickSettings");

    if (this.activeType != index) {
      console.log(`navigating to ${this.paths[index]}`);
      this.router.navigate([this.paths[index]]);
    }

    $("div.settings.settings-active").hide(500).removeClass("settings-active");
    this.settingsActive = false;

    this.activeType = index;
    console.log(`onRadioClickSettings this.activeType = ${index}`);
  }

  ngOnInit() {
    EditComponent.isActive = true;
    console.log("EditComponent ngOnInit");
    console.log("route:");
    console.log(this.actRoute);

    this.activeType = this.paths.indexOf(this.actRoute.snapshot.routeConfig?.path ?? "edit");
    this.editType = this.editTypes[this.activeType];

    if (this.activeType == 0) {
      this.settingsActive = false;
      this.onClickSettings();
    }

    console.log(`activeType: ${this.activeType}`);

    let rect = WorkbenchComponent.getWorkbenchSize();
    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    $("app-edit").width(rect.width);
    $("#description").width(rect.width - 60);
  }

  ngAfterViewInit() {
    console.log("ngAfterViewInit");
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
        console.log("edit component ActiveThemeSelector");
        console.log(themeNode);
        this.activeThemeNode.set(themeNode);
        console.log("ActiveThemeSelector is done.")
      });

      //BibleThemeTreeComponent.ActiveCitationSelector.subscribe((citationNode:JstreeModel) => {
      //  console.log("ActiveCitationSelector event -> citationNode:", citationNode);
      //   console.log("Parent signal identity:", this.activeCitationNode);
      //   console.log("Parent signal current value:", this.activeCitationNode());
      //   this.activeCitationNode.set(citationNode);
      //   this.cdr.detectChanges();
      // });

      EditComponent.isSubscribed = true;
    }
  }

  ngOnDestroy() {
    console.log("ngOnDestroy - edit component");
    EditComponent.isActive = false;
  }
}
