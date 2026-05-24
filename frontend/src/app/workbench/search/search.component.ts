import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchScriptureComponent } from './search-scripture/search-scripture.component';
import $ from 'jquery';

@Component({
    selector: 'app-search',
    imports: [
        SearchScriptureComponent,
        CommonModule
    ],
    templateUrl: './search.component.html',
    styleUrl: './search.component.css'
})
export class SearchComponent {
    searchTypes = [
    "Pull scripture citing Book, Chapter, Verse-Range",
    "Advanced Search",
    "Standard Search"
  ];

  activeType = 2;
  searchType = this.searchTypes[this.activeType];
  settingsActive = false;

  public onClickSettings():void {
    if (this.settingsActive) {
      $("div.settings.settings-active").hide(500).removeClass("settings-active");
    }
    else {
      $("div.settings").show(500).addClass("settings-active");
    }

    this.settingsActive = !this.settingsActive;
  }

  public getActiveType():number {
    return this.activeType;
  }

  public onRadioClickSettings(index:number):void {
    this.activeType = index;
    this.searchType = this.searchTypes[index];
    $("div.settings.settings-active").hide(500).removeClass("settings-active");
    this.settingsActive = false;
  }
}
