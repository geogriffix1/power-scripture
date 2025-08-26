import { Component, Input, OnInit } from '@angular/core';
import { ContextMenu } from './interfaces/context-menu';
import { ContextMenuItem } from './interfaces/context-menu-item';

@Component({
  selector: 'app-search-context-menu',
  standalone: true,
  imports: [],
  templateUrl: './search-context-menu.component.html',
  styleUrl: './search-context-menu.component.css'
})
export class SearchContextMenuComponent implements ContextMenu, OnInit {
  menuName = "Search Context Menu";
  menuItems = <SearchContextMenuItem[]>[];
  static instance:SearchContextMenuComponent;
  @Input()
    callbacks!:any;
  @Input()
    selectedEntry!:any;
  @Input()
    searchResults!:any[];
  @Input()
    context?:any;

  ngOnInit() {}

  public static showContextMenu(searchResults:any[], context:any) {
    SearchContextMenuComponent.instance.menuItems = [];
    //console.log(`entry: ${entry}`);

    SearchContextMenuComponent.instance.menuItems.push({
      text: "Select All",
      title: "Select all search items in the list",
      isActive: () => { return SearchContextMenuComponent.instance.callbacks.canSelectAll(); },
      onClick: (entry:any) => {
        SearchContextMenuComponent.instance.callbacks.selectAll();
        this.hide();
      }
    });
    SearchContextMenuComponent.instance.menuItems.push({
      text: "Deselect All",
      title: "Deselect all search items in the list",
      isActive: () => { return SearchContextMenuComponent.instance.callbacks.canDeselectAll(); },
      onClick: (entry:any) => {
        SearchContextMenuComponent.instance.callbacks.deselectAll();
        this.hide();
      }
    });
    SearchContextMenuComponent.instance.menuItems.push({
      text: "Remove Selected",
      title: "Remove all selected items from the list",
      isActive: () => { return SearchContextMenuComponent.instance.callbacks.canRemoveSelected(); },
      onClick: (entry:any) => {
        SearchContextMenuComponent.instance.callbacks.removeSelected(searchResults);
        this.hide();
      }
    });
    SearchContextMenuComponent.instance.menuItems.push({
      text: "Create Citation",
      title: "Store selected items as a Bible Citation in a Theme",
      isActive: () => { return SearchContextMenuComponent.instance.callbacks.canCreateCitation(); },
      onClick: (entry:any) => {
        SearchContextMenuComponent.instance.callbacks.createCitation(searchResults, context);
        this.hide();
      }
    }); 
    SearchContextMenuComponent.instance.menuItems.push({
      text: "Export Selected",
      title: "Export the selected scriptures to a file",
      isActive: () => { return SearchContextMenuComponent.instance.callbacks.canExportSelected(); },
      onClick: (entry:any) => {
        SearchContextMenuComponent.instance.callbacks.exportSelected(searchResults, context);
        this.hide();
      }
    });

    $("div.context-menu.hidden").removeClass("hidden");
  }

  public static hide() {
    console.log("hiding");
    $("app-search-context-menu").addClass("hidden");
  }

  constructor() {
    SearchContextMenuComponent.instance = this;
    SearchContextMenuComponent.showContextMenu(this.searchResults, this.context);
  }
}

export class SearchContextMenuItem implements ContextMenuItem {
  text:string;
  title:string;
  isActive:any;
  onClick:any;

  constructor(text:string, title:string, isActive:any, onClick:any) {
    this.text = text;
    this.title = title;
    this.isActive = isActive;
    this.onClick = onClick;
  }
}
