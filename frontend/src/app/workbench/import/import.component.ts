import { Component, signal } from '@angular/core';
import { WorkbenchComponent } from '../workbench.component';
import { ImportConsoleComponent } from './import-console/import-console.component';
import { ImportFileComponent } from './import-file/import-file.component';
import { BibleThemeTreeComponent } from '../../bible-theme-tree/bible-theme-tree.component';

@Component({
  selector: 'app-import',
  imports: [ImportConsoleComponent, ImportFileComponent],
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss']
})
export class ImportComponent {

  importTypes = [
    "Choose import type",
    "Import from Console",
    "Import from Text File"
  ];

  static isActive = false;
  static isSubscribed = false;

  activeType = 1;
  index = 0;
  activeThemeNode = signal(WorkbenchComponent.activeTheme);
  importType = this.importTypes[this.activeType];
  settingsActive = false;
  sectionWidth!: number;
  sectionHeight!: number;
  activeThemeId = 0;

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
      this.settingsActive = false;
      this.activeType = index;
      this.importType = this.importTypes[this.activeType];
    })();
  }
  
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
