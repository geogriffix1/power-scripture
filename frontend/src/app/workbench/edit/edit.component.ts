import { Router, ActivatedRoute } from '@angular/router'
import { Component, Input, Output, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { BibleThemeTreeComponent } from '../../bible-theme-tree/bible-theme-tree.component';
import { WorkbenchComponent } from '../workbench.component';
import { EditThemeComponent } from './edit-theme/edit-theme.component';
import { EditCitationComponent } from './edit-citation/edit-citation.component';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    WorkbenchComponent,
    EditThemeComponent,
    EditCitationComponent
  ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css'
})
export class EditComponent implements OnInit {

  constructor(
    private actRoute: ActivatedRoute,
    private router: Router,
  ) { }
  paths = ["edit", "edit/theme", "edit/citation"];
  
  editTypes = [
    "Choose the type to edit",
    "Edit a Bible Theme",
    "Edit a Bible Scripture Citation"
  ];

  static isSubscribed = false;
  static isActive = false;

  @Input()
    activeType = 0;
  
  @Output()
    activeTheme = WorkbenchComponent.activeTheme;
  @Output()
    activeCitation = WorkbenchComponent.activeCitation;
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
          this.workbenchDomRect(rect);
          if (EditComponent.isActive) {
            this.workbenchDomRect(rect);            
            this.sectionWidth = rect.width - 4;
            $("app-edit").width(rect.width);
            $("#description").width(rect.width - 60);
          }      
        });

      EditComponent.isSubscribed = true;
    }
  }

  ngOnDestroy() {
    console.log("ngOnDestroy - edit component");
    EditComponent.isActive = false;
  }
}
