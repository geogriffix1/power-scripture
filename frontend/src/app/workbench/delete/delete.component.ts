import { Router, ActivatedRoute } from '@angular/router'
import { Component, Input, Output, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { BibleThemeTreeComponent } from '../../bible-theme-tree/bible-theme-tree.component';
import { WorkbenchComponent } from '../workbench.component';
import { DeleteThemeComponent } from './delete-theme/delete-theme.component';
import { DeleteCitationComponent } from './delete-citation/delete-citation.component';

@Component({
  selector: 'app-delete',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    WorkbenchComponent,
    DeleteThemeComponent,
    DeleteCitationComponent
  ],
  templateUrl: './delete.component.html',
  styleUrl: './delete.component.css'
})
export class DeleteComponent implements OnInit {

  constructor(
    private actRoute: ActivatedRoute,
    private router: Router,
  ) { }
  paths = ["delete", "delete/theme", "delete/citation"];
  
  deleteTypes = [
    "Choose the type to delete",
    "Delete a Bible Theme",
    "Delete a Bible Scripture Citation"
  ];

  static isSubscribed = false;
  static isActive = false;

  @Input()
    activeType = 0;
  @Output()
    activeTheme = WorkbenchComponent.activeTheme;
  @Output()
    activeCitation = WorkbenchComponent.activeCitation;
  deleteType = this.deleteTypes[this.activeType];
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
    DeleteComponent.isActive = true;
    console.log("DeleteComponent ngOnInit");
    console.log("route:");
    console.log(this.actRoute);

    this.activeType = this.paths.indexOf(this.actRoute.snapshot.routeConfig?.path ?? "delete");
    this.deleteType = this.deleteTypes[this.activeType];

    if (this.activeType == 0) {
      this.settingsActive = false;
      this.onClickSettings();
    }

    console.log(`activeType: ${this.activeType}`);

    let rect = WorkbenchComponent.getWorkbenchSize();
    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    $("app-delete").width(rect.width);
    $("#description").width(rect.width - 60);
  }

  ngAfterViewInit() {
    console.log("ngAfterViewInit");
    if (!DeleteComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          this.workbenchDomRect(rect);
          if (DeleteComponent.isActive) {
            this.workbenchDomRect(rect);            
            this.sectionWidth = rect.width - 4;
            $("app-delete").width(rect.width);
            $("#description").width(rect.width - 60);
          }      
        });

      DeleteComponent.isSubscribed = true;
    }
  }

  ngOnDestroy() {
    console.log("ngOnDestroy - delete component");
    DeleteComponent.isActive = false;
  }
}
