import { Router, ActivatedRoute } from '@angular/router'
import { Component, signal, EnvironmentInjector, WritableSignal, runInInjectionContext } from '@angular/core';
import { Subscription } from 'rxjs';
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
   ) { }

  paths = ["edit", "edit/theme", "edit/citation", "edit/citation/range", "edit/citation/verse", "edit/citation/verse/markup"];
  
  editTypes = [
    "Choose the type to edit",
    "Edit a Bible Theme",
    "Edit a Bible Scripture Citation"
  ];

  static isSubscribed = false;
  static isActive = false;
  activeThemeNode!: WritableSignal<JstreeModel | null>;
  activeCitationNode!: WritableSignal<JstreeModel | null>;
  private subscriptions = new Subscription;

  activeType = 0;

  editType = this.editTypes[this.activeType];
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
    EditComponent.isActive = true;

    this.activeType = this.paths.indexOf(this.actRoute.snapshot.routeConfig?.path ?? "edit");
    this.editType = this.editTypes[this.activeType];
    this.subscriptions = new Subscription;
    
    this.activeThemeNode = signal(WorkbenchComponent.activeTheme);
    this.activeCitationNode = signal(WorkbenchComponent.activeCitation);
  }

  ngAfterViewInit() {
    if (this.activeType == 0) {
      this.settingsActive = false;
      this.onClickSettings();
    }
    
    if (!EditComponent.isSubscribed) {
      this.subscriptions.add(
        BibleThemeTreeComponent.ActiveCitationSelector.subscribe((node: JstreeModel | null) => {
            this.activeCitationNode.set(node);
        })
      );

      this.subscriptions.add(
        BibleThemeTreeComponent.ActiveThemeSelector.subscribe((themeNode:JstreeModel | null) => {
          console.log("active theme changed");
          this.activeThemeNode.set(themeNode);
        })
      );

      EditComponent.isSubscribed = true;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    EditComponent.isSubscribed = false;
    EditComponent.isActive = false;
  }
}
