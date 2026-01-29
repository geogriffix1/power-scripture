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

  // workbenchDomRect(rect:DOMRectReadOnly) {
  //   this.sectionWidth = rect.width;
  //   this.sectionHeight = rect.height;
  // }

  // ngOnInit() {
  //   ImportComponent.isActive = true;
  //   console.log("ImportComponent ngOnInit");

  //   let rect = WorkbenchComponent.getWorkbenchSize();
  //   this.workbenchDomRect(rect);
  //   this.sectionWidth = rect.width;
  //   $("app-import").width(rect.width);
  //   //$("#description").width(rect.width - 60);
  // }

//   ngAfterViewInit() {
//     console.log("ngAfterViewInit");
//     const activeTheme = WorkbenchComponent.activeTheme;
//     if (activeTheme) {
//       this.activeThemeId = Number(activeTheme.id.substring(5));
//     }

//     console.log(`activeTheme: ${this.activeThemeId}`);

//     if (!ImportComponent.isSubscribed) {
//       WorkbenchComponent.WorkbenchResizeBroadcaster
//         .subscribe((rect:DOMRectReadOnly) => {
//           if (ImportComponent.isActive) {
//             this.workbenchDomRect(rect);       
//             this.sectionWidth = rect.width - 4;
//             $("app-import").width(rect.width);
//           }      
//         });

//       ImportComponent.isSubscribed = true;
//     }
//   }

//   ngOnDestroy() {
//     console.log("ngOnDestroy - import component");
//     ImportComponent.isActive = false;
//   }
}
