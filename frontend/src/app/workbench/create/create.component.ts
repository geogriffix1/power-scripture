import { Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { Subscription } from 'rxjs';
import { WorkbenchComponent } from '../workbench.component';
import { CreateCitationComponent } from './create-citation/create-citation.component';
import { CreateThemeComponent } from './create-theme/create-theme.component';
import { ThemeModel } from '../../model/theme.model';
import { BibleThemeTreeComponent } from '../../bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from '../../model/jstree.model';
import $ from 'jquery';

@Component({
    selector: 'app-create',
    imports: [
        CommonModule,
        NgFor,
        CreateCitationComponent,
        CreateThemeComponent
    ],
    templateUrl: './create.component.html',
    styleUrl: './create.component.css'
})
export class CreateComponent {

  constructor (
    private actRoute: ActivatedRoute,
    private router: Router
  ) { }

  paths = ["create", "create/theme", "create/citation"];

  createTypes = [
    "Choose the type to create",
    "Create a new Bible Theme",
    "Create a new Bible Scripture Citation"
  ];

  static isActive = false;
  static isSubscribed = false;

  activeType = 0;
  createType = this.createTypes[this.activeType];
  settingsActive = false;
  activeTheme:ThemeModel | null = null;
  sectionWidth!:number;
  sectionHeight!:number;
  private subscriptions = new Subscription;


  // workbenchDomRect(rect:DOMRectReadOnly) {
  //   this.sectionWidth = rect.width;
  //   this.sectionHeight = rect.height;
  // }

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
    (async() => {
      $("div.settings.settings-active").hide(500).removeClass("settings-active");
      await this.delay(500);
      
      if (this.activeType != index) {
        this.router.navigate([this.paths[index]]);
      }
      this.settingsActive = false; 
    })();
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ngOnInit() {
    CreateComponent.isActive = true;

    this.activeType = this.paths.indexOf(this.actRoute.snapshot.routeConfig?.path ?? "create");
    this.createType = this.createTypes[this.activeType];

    if (this.activeType == 0) {
      this.settingsActive = false;
      this.onClickSettings();
    }

    // let rect = WorkbenchComponent.getWorkbenchSize();
    // this.workbenchDomRect(rect);
    // this.sectionWidth = rect.width;
    // $("app-create").width(rect.width);
    // $("#description").width(rect.width - 60);
  
    this.setActiveTheme(WorkbenchComponent.activeTheme);

    this.subscriptions.add(
      BibleThemeTreeComponent.ActiveThemeSelector.subscribe((theme: JstreeModel|null) => {
        this.setActiveTheme(theme);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    CreateComponent.isActive = false;
  }

  private setActiveTheme(theme: JstreeModel | null) {
    if (!theme) {
      this.activeTheme = null;
      $(".workbench-parent-theme div.selected-theme").addClass("missing");
      return;
    }

    let parent = theme.parent ?? "0";
    if (parent.startsWith("theme")) {
      parent = parent.replace("theme", "");
    }
    else if (parent == "#") {
      parent = "0";
    }

    this.activeTheme = <ThemeModel>{
      id: +theme.id.replace("theme", ""),
      name: theme.text,
      description: theme.li_attr.title,
      parent: +parent,
      sequence: theme.li_attr.sequence,
      childCount: Array.isArray(theme.children) ? theme.children.length : 0,
      remarks: theme.data.remarks ?? false,
      path: theme.data.path,
      node: theme
    };

    $(".workbench-parent-theme div.selected-theme").removeClass("missing");
  }

  // ngAfterViewInit() {
  //   if (!CreateComponent.isSubscribed) {
  //     WorkbenchComponent.WorkbenchResizeBroadcaster
  //       .subscribe((rect:DOMRectReadOnly) => {
  //         this.workbenchDomRect(rect);
  //         if (CreateComponent.isActive) {
  //           this.workbenchDomRect(rect);            
  //           this.sectionWidth = rect.width - 4;
  //           $("app-create").width(rect.width);
  //           $("#description").width(rect.width - 60);
  //         }      
  //       });

  //     CreateComponent.isSubscribed = true;
  //   }
  // }

  // ngDestroy() {
  //   CreateComponent.isActive = false;
  // }
}
