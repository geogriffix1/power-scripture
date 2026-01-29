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
    console.log("settings clicked!");
    this.settingsActive = !this.settingsActive;
    if (this.settingsActive) {
      this.importType = this.importTypes[this.activeType];
    }
  }

  onRadioClickSettings(i:number) {
    this.activeType = i;
    this.importType = this.importTypes[this.activeType];
    this.settingsActive = false;
  }
}
