import { Component, Input, OnInit } from '@angular/core';
import { ContextMenu } from './interfaces/context-menu';
import { ContextMenuItem } from './interfaces/context-menu-item';

@Component({
    selector: 'app-create-citation-context-menu',
    imports: [],
    templateUrl: './create-citation-context-menu.component.html',
    styleUrl: './create-citation-context-menu.component.css'
})
export class CreateCitationContextMenuComponent implements ContextMenu, OnInit {
  menuName = "Create Bible Citation Context Menu";
  menuItems = <CreateCitationContextMenuItem[]>[];
  static instance:CreateCitationContextMenuComponent;
  @Input()
    callbacks!:any;
  @Input()
    selectedEntry!:any;
  @Input()
    inputObject!:any;
  @Input()
    context?:any;

  ngOnInit() {}

  public static showContextMenu(inputObject:any, context:any) {
    CreateCitationContextMenuComponent.instance.menuItems = [];
    //console.log(`entry: ${entry}`);

    CreateCitationContextMenuComponent.instance.menuItems.push({
      text: "Create Bible Citation",
      title: "Save this Bible Citation",
      isActive: () => { return CreateCitationContextMenuComponent.instance.callbacks.canCreateCitation(); },
      onClick: (entry:any) => {
        CreateCitationContextMenuComponent.instance.callbacks.selectAll();
        this.hide();
      }
    });
    CreateCitationContextMenuComponent.instance.menuItems.push({
      text: "Cancel",
      title: "Cancel the Operation",
      isActive: () => { return CreateCitationContextMenuComponent.instance.callbacks.canCancel(); },
      onClick: (entry:any) => {
        CreateCitationContextMenuComponent.instance.callbacks.cancel();
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
    CreateCitationContextMenuComponent.instance = this;
    CreateCitationContextMenuComponent.showContextMenu(this.inputObject, this.context);
  }
}

export class CreateCitationContextMenuItem implements ContextMenuItem {
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
