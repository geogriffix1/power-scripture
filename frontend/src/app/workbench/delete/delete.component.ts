import { Router, ActivatedRoute } from '@angular/router';
import { Component, signal, WritableSignal, Input, Output, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { BibleThemeTreeComponent } from '../../bible-theme-tree/bible-theme-tree.component';
import { WorkbenchComponent } from '../workbench.component';
import { DeleteThemeComponent } from './delete-theme/delete-theme.component';
import { DeleteCitationComponent } from './delete-citation/delete-citation.component';
import { JstreeModel } from '../../model/jstree.model';

@Component({
    selector: 'app-delete',
    imports: [
        CommonModule,
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
  activeThemeNode!: WritableSignal<JstreeModel | null>;
  activeCitationNode!: WritableSignal<JstreeModel | null>;
  private subscriptions = new Subscription;

  activeType = 0;

  deleteType = this.deleteTypes[this.activeType];
  settingsActive = false;
  
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
      $("div.settings").hide(500).removeClass("settings-active");
      await this.delay(500);

      if (this.activeType != index) {
        this.router.navigate([this.paths[index]]);
      }

      this.settingsActive = false;
      this.activeType = index;
    })();
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ngOnInit() {
    DeleteComponent.isActive = true;

    this.activeType = this.paths.indexOf(this.actRoute.snapshot.routeConfig?.path ?? "delete");
    this.deleteType = this.deleteTypes[this.activeType];
    this.subscriptions = new Subscription;

    this.activeThemeNode = signal(WorkbenchComponent.activeTheme);
    this.activeCitationNode = signal(WorkbenchComponent.activeCitation);
  }

  ngAfterViewInit() {
    if (this.activeType == 0) {
      this.settingsActive = false;
      this.onClickSettings();
    }

    if (!DeleteComponent.isSubscribed) {
      this.subscriptions.add(
        BibleThemeTreeComponent.ActiveCitationSelector.subscribe((node: JstreeModel | null) => {
            this.activeCitationNode.set(node);
        })
      );

      this.subscriptions.add(
        BibleThemeTreeComponent.ActiveThemeSelector.subscribe((themeNode:JstreeModel | null) => {
          this.activeThemeNode.set(themeNode);
        })
      );

      DeleteComponent.isSubscribed = true;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    DeleteComponent.isSubscribed = false;
    DeleteComponent.isActive = false;
  }
}
