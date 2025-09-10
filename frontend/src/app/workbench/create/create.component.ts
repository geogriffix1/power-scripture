import { Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { WorkbenchComponent } from '../workbench.component';
import { BibleThemeTreeComponent } from '../../bible-theme-tree/bible-theme-tree.component';
import { CiteScriptureComponent } from '../search/cite-scripture/cite-scripture.component';
import { CreateThemeComponent } from './create-theme/create-theme.component';
import { JstreeModel } from '../../model/jstree.model';
import { ThemeModel, ThemeExtendedModel } from '../../model/theme.model';
import { BibleService } from '../../bible.service';
import $ from 'jquery';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    WorkbenchComponent,
     CiteScriptureComponent,
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
  activeTheme!:ThemeModel;
  sectionWidth!:number;
  sectionHeight!:number;


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
    // this.activeType = index;
    // this.createType = this.createTypes[index];
    $("div.settings.settings-active").hide(500).removeClass("settings-active");
    this.settingsActive = false; 
  }

  ngOnInit() {
    CreateComponent.isActive = true;
    console.log("CreateComponent ngOnInit");
    //this.activeTheme:ThemeExtendedModel!;
    console.log("activeTheme:")
    console.log(this.activeTheme);

    console.log("route:");
    console.log(this.actRoute);

    this.activeType = this.paths.indexOf(this.actRoute.snapshot.routeConfig?.path ?? "create");
    this.createType = this.createTypes[this.activeType];

    if (this.activeType == 0) {
      this.settingsActive = false;
      this.onClickSettings();
    }

    console.log(`activeType: ${this.activeType}`);
    //console.log(this.route.url.value)

    let rect = WorkbenchComponent.getWorkbenchSize();
    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    $("app-create").width(rect.width);
    $("#description").width(rect.width - 60);
  
    (async (obj:CreateComponent) => {
      let service = new BibleService;
      if (WorkbenchComponent.activeTheme) {
        let id = <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", "");
        obj.activeTheme = await service.getTheme(id);
      }
      else {
        $(".workbench-parent-theme div.selected-theme").addClass("missing");
      }

      if (!CreateComponent.isSubscribed) {
        BibleThemeTreeComponent.ActiveThemeSelector.subscribe((theme: JstreeModel) => {
          console.log("in ActiveThemeSelector subscription - activeTheme:");
          console.log(theme);
          let id = +theme.id.replace("theme", "");
          console.log(`invoking getTheme(${id})`);
          obj.activeTheme = <ThemeModel>{
            id: +theme.id.replace("theme", ""),
            name: theme.text,
            description: theme.li_attr.title,
            parent: +theme.parent.replace("theme", ""),
            sequence: theme.li_attr.sequence,
            childCount: Array.isArray(theme.children) ? theme.children.length : 0,
            path: theme.data.path
          };

          $("div.theme.selected-theme").text(obj.activeTheme.path);
          console.log(`Active Theme set to: ${obj.activeTheme.path}`);
          $(".workbench-parent-theme div.selected-theme").removeClass("missing");
        });
      }
    })(this);
  }

  ngAfterViewInit() {
    console.log("ngAfterViewInit");
    if (!CreateComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          this.workbenchDomRect(rect);
          if (CreateComponent.isActive) {
            this.workbenchDomRect(rect);            
            this.sectionWidth = rect.width - 4;
            $("app-create").width(rect.width);
            $("#description").width(rect.width - 60);
          }      
        });

      CreateComponent.isSubscribed = true;
    }
  }

  ngDestroy() {
    console.log("ngOnDestroy - create components");
    CreateComponent.isActive = false;
  }
}
