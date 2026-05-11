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
    EditScriptureRangeContextMenuComponent.showContextMenu(this.scriptureRange);
  }

  constructor() {
    EditScriptureRangeContextMenuComponent.instance = this;
  }

  public static showContextMenu(entry: CiteScriptureRangeModel) {
    EditScriptureRangeContextMenuComponent.instance.menuItems = [];
    EditScriptureRangeContextMenuComponent.instance.menuItems.push({
      text: "Edit Scripture Range",
      title: "Adjust the range of scriptures",
      isActive: () => { return EditScriptureRangeContextMenuComponent.instance.callbacks.canEditScriptureRange(); },
      onClick: (entry:any) => {
        EditScriptureRangeContextMenuComponent.instance.callbacks.editScriptureRange(entry);
        this.hide();
      }
    });
  }
    
  public static hide() {
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
