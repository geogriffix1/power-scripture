import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ContextMenu } from './interfaces/context-menu';
import { ContextMenuItem } from './interfaces/context-menu-item';
@Component({
  selector: 'app-cite-context-menu',
  standalone: true,
  imports: [],
  templateUrl: './cite-context-menu.component.html',
  styleUrl: './cite-context-menu.component.css'
})
export class CiteContextMenuComponent {
  menuName = "Bible Verse Citation Context Menu";
  menuItems = <CiteContextMenuItem[]>[];
  static instance:CiteContextMenuComponent;
  @Input()
    callbacks!:any;
  @Input()
    selectedEntry!:any;
  @Input()
    scriptureRanges!:any[];
  @Input()
    router!:Router;
  @Input()
    context?:any;

  ngOnInit()
  {
    console.log("cite context menu component constructor");
    console.log(`is router null? ${!this.router}`);
    CiteContextMenuComponent.showContextMenu(this.scriptureRanges, this.context, this.router);
  }

  constructor() {
    console.log("cite context menu component constructor");
    CiteContextMenuComponent.instance = this;
  }

  public static showContextMenu(scriptureRanges:any[], context:any, router:Router) {
    console.log("showContextMenu");
    console.log(`context:`);
    console.log(context);
    console.log(`router is null? ${!router}`)
    CiteContextMenuComponent.instance.menuItems = [];
    CiteContextMenuComponent.instance.menuItems.push({
      text: "Select All",
      title: "Select all citations entered",
      isActive: () => { return CiteContextMenuComponent.instance.callbacks.canSelectAll(); },
      onClick: (entry:any) => {
        CiteContextMenuComponent.instance.callbacks.selectAll();
        this.hide();
      }
    });
    CiteContextMenuComponent.instance.menuItems.push({
      text: "Deselect All",
      title: "Deselect all citations",
      isActive: () => { return CiteContextMenuComponent.instance.callbacks.canDeselectAll(); },
      onClick: (entry:any) => {
        CiteContextMenuComponent.instance.callbacks.deselectAll();
        this.hide();
      }
    });
    CiteContextMenuComponent.instance.menuItems.push({
      text: "Remove Selected",
      title: "Remove all selected citations from the list",
      isActive: () => { return CiteContextMenuComponent.instance.callbacks.canRemoveSelected(); },
      onClick: (entry:any) => {
        CiteContextMenuComponent.instance.callbacks.removeSelected(scriptureRanges);
        this.hide();
      }
    });
    CiteContextMenuComponent.instance.menuItems.push({
      text: "Save Selected Citations",
      title: "Store selected citations as a Bible Citation in a theme",
      isActive: () => { return CiteContextMenuComponent.instance.callbacks.canSaveCitation(); },
      onClick: (entry:any) => {
        CiteContextMenuComponent.instance.callbacks.saveCitation(scriptureRanges, router);
        this.hide();
      }
    });
    CiteContextMenuComponent.instance.menuItems.push({
      text: "Export Selected",
      title: "Export the selected scriptures to a file",
      isActive: () => { return CiteContextMenuComponent.instance.callbacks.canExportSelected(); },
      onClick: (entry:any) => {
        CiteContextMenuComponent.instance.callbacks.exportSelected(scriptureRanges, context);
        this.hide();
      }
    });
  }
    
  public static hide() {
    console.log("hiding");
    $("app-cite-context-menu").addClass("hidden");
  }
}

export class CiteContextMenuItem implements ContextMenuItem {
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
