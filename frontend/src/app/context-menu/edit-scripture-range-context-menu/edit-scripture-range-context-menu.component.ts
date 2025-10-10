import { Component, Input, OnInit } from '@angular/core';
//mport { Router } from '@angular/router';
import { ContextMenu } from '../interfaces/context-menu';
import { ContextMenuItem } from '../interfaces/context-menu-item';
import { CiteScriptureRangeModel } from '../../model/citeScriptureRangeModel';

@Component({
  selector: 'app-edit-scripture-range-context-menu',
  standalone: true,
  imports: [],
  templateUrl: './edit-scripture-range-context-menu.component.html',
  styleUrl: './edit-scripture-range-context-menu.component.css'
})
export class EditScriptureRangeContextMenuComponent {
  menuName = "Bible Verse Range Editor Context Menu";
  menuItems = <EditSctiptureRangeContextMenuItem[]>[];
  static instance:EditScriptureRangeContextMenuComponent;
  @Input()
    callbacks!:any;
  @Input()
    selectedEntry!:any;
  @Input()
    scriptureRange!:any;
  @Input()
    context?:any;

  ngOnInit()
  {
    console.log("scripture range context menu component constructor");
    EditScriptureRangeContextMenuComponent.showContextMenu(this.scriptureRange);
  }

  constructor() {
    console.log("scripture range context menu component constructor");
    EditScriptureRangeContextMenuComponent.instance = this;
  }

  public static showContextMenu(entry: CiteScriptureRangeModel) {
    console.log("showContextMenu");
    console.log(`context:`);
    EditScriptureRangeContextMenuComponent.instance.menuItems = [];
    console.log("check 1");
    EditScriptureRangeContextMenuComponent.instance.menuItems.push({
      text: "Edit Scripture Range",
      title: "Adjust the range of scriptures",
      isActive: () => { return EditScriptureRangeContextMenuComponent.instance.callbacks.canEditScriptureRange(); },
      onClick: (entry:any) => {
        EditScriptureRangeContextMenuComponent.instance.callbacks.editScriptureRange(entry);
        this.hide();
      }
    });
    console.log("check 2");
    // EditScriptureRangeContextMenuComponent.instance.menuItems.push({
    //   text: "Scripture Markup",
    //   title: "Apply markups to selected scriptures",
    //   isActive: () => { return EditScriptureRangeContextMenuComponent.instance.callbacks.canDeselectAll(); },
    //   onClick: (entry:any) => {
    //     EditScriptureRangeContextMenuComponent.instance.callbacks.deselectAll();
    //     this.hide();
    //   }
    // });
    // EditScriptureRangeContextMenuComponent.instance.menuItems.push({
    //   text: "Remove Scripture Range",
    //   title: "Delete the range of scriptures from the citation",
    //   isActive: () => { return EditScriptureRangeContextMenuComponent.instance.callbacks.canRemoveSelected(); },
    //   onClick: (entry:any) => {
    //     EditScriptureRangeContextMenuComponent.instance.callbacks.removeSelected(scriptureRanges);
    //     this.hide();
    //   }
    // });
    // EditScriptureRangeContextMenuComponent.instance.menuItems.push({
    //   text: "Save Citation",
    //   title: "Save the full citation as edited",
    //   isActive: () => { return EditScriptureRangeContextMenuComponent.instance.callbacks.canSaveCitation(); },
    //   onClick: (entry:any) => {
    //     EditScriptureRangeContextMenuComponent.instance.callbacks.saveCitation(scriptureRanges);
    //     this.hide();
    //   }
    // });
    // EditScriptureRangeContextMenuComponent.instance.menuItems.push({
    //   text: "Export Selected",
    //   title: "Export the selected scriptures to a file",
    //   isActive: () => { return EditScriptureRangeContextMenuComponent.instance.callbacks.canExportSelected(); },
    //   onClick: (entry:any) => {
    //     EditScriptureRangeContextMenuComponent.instance.callbacks.exportSelected(scriptureRanges, context);
    //     this.hide();
    //   }
    // });

  }
    
  public static hide() {
    console.log("hiding");
    $("app-scripture-range-editor").addClass("hidden");
  }
}

export class EditSctiptureRangeContextMenuItem implements ContextMenuItem {
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
