import { Component, Directive, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService } from '../bible.service';
import { AppComponent } from '../app.component';
import { JstreeModel} from '../model/jstree.model';
import { ThemeChainModel } from '../model/themeChain.model';
import { Subject } from 'rxjs';
import $ from 'jquery';
import 'jstree';

@Component({
  selector: 'app-bible-theme-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bible-theme-tree.component.html',
  styleUrl: './bible-theme-tree.component.css'
})
export class BibleThemeTreeComponent implements OnInit {
  static service: ServiceDirective;
  activeTheme!:JstreeModel;
  activeCitation!:JstreeModel;
  static ActiveThemeSelector: Subject<JstreeModel>;
  static ActiveCitationSelector: Subject<JstreeModel>;
  static ngZone: NgZone;
  static LoadNodeCallback: any;
  constructor(ngzone: NgZone) {
    const bibleService = inject(BibleService);
    BibleThemeTreeComponent.service = new ServiceDirective(bibleService);
    BibleThemeTreeComponent.ActiveThemeSelector = new Subject<JstreeModel>();
    BibleThemeTreeComponent.ActiveCitationSelector = new Subject<JstreeModel>();
    BibleThemeTreeComponent.ngZone = ngzone;
  }

  broadcastActiveThemeChange(theme:JstreeModel) {
    BibleThemeTreeComponent.ActiveThemeSelector.next(theme);
    console.log("broadcast active theme change");
  }

  broadcastActiveCitationChange(citation:JstreeModel ) {
    BibleThemeTreeComponent.ActiveCitationSelector.next(citation);
    console.log("broadcast active citation change");
  }

  ngOnInit(): void {
    var service = BibleThemeTreeComponent.service;
    $('#theme-tree-full').jstree({
      core: {
        multiple: false,
        data: function (node:any, cb:any) {
          BibleThemeTreeComponent.LoadNodeCallback = cb;
          console.log(`in load_node, node id: ${node.id}`);
          if(node.id === "#") {
            service.process({id: 'theme0'}, cb).then();
          }
          else {
            console.log(node);
            console.log("calling service process");
            service.process(node, cb).then();
          }  
        }
      },
      plugins: ['contextmenu'],
      contextmenu: {
        items: this.ThemeTreeContextMenu
      }
    }).on('changed.jstree', (e:any, data:any) => {
      console.log("jstree change event");
      console.log(data);
      //console.log(e);
      if (data.node != null) {
        let model = JstreeModel.getJstreeModel(data.node);
        if (model.id.startsWith("theme")) {
          this.broadcastActiveThemeChange(model);
          this.activeTheme = model;
          if (this.activeCitation) {
            let a = $(`#${this.activeCitation.id} > a.theme-tree-node-citation`);
            a.attr('aria-selected', 'true').addClass('jstree-clicked');
          }
        }
        else if (model.id.startsWith("citation")) {
          this.broadcastActiveCitationChange(model);
          this.activeCitation = model;
          if (this.activeTheme) {
            let a = $(`#${this.activeTheme.id} > a.theme-tree-node-theme`);
            a.attr('aria-selected', 'true').addClass('jstree-clicked');
          }
        }
      }
    }).on('loaded.jstree', (e:any, data:any) => {
      console.log("jstree loaded event");
      console.log(data);
    }).on('redraw.jstree', (e:any, data:any) => {
      console.log("jstree redraw event data:");  
      console.log(data);
      console.log("e:")
      console.log(e);
    })
    ;
  }

  ThemeTreeContextMenu (node:JstreeModel): any {
    let service = BibleThemeTreeComponent.service;
    console.log("In AppComponent.ThemeTreeContextMenu");
    let items:any = {};
    if (node.a_attr.class == "theme-tree-node-theme") {
      items = {
        editThemeItem: {
          label: "Edit",
          action: () => {
            AppComponent.editObject = node;
            BibleThemeTreeComponent.ngZone.run(
              () => {
                AppComponent.router.navigate(["/"]);
                AppComponent.router.navigate(["edit/theme"]);
              });
          }
        },
        copyThemeItem: {
          label: "Copy",
          action: () =>  { }
        },
        pasteItem: {
          label: "Paste",
          action: () =>  { }
        },
        createThemeItem: {
          label: "Create Subtheme",
          action: () => {
            console.log("createSubtheme action in AppComponent");
            BibleThemeTreeComponent.ngZone.run(() => AppComponent.router.navigate(["create/theme"]));
          }
        },
        createCitationItem: {
          label: "Create Citation",
          action: () => {
            console.log("createSubtheme action in AppComponent");
            BibleThemeTreeComponent.ngZone.run(() => AppComponent.router.navigate(["create/citation"]));                    
          }
        },
        reorderMembersItem: {
          label: "Resequence Members",
          action: () =>  { }
        },
        deleteItem: {
          label: "Delete",
          action: () =>  {
            console.log(`Delete theme ${node.id}`);
            let parent = node.parent;
            console.log("parent:");
            console.log(parent);
            service.deleteTheme(node, (success:boolean, message:string) => {
              console.log("delete theme callback")
              if (success) {

                console.log("deleteTheme success.");
                $('#theme-tree-full').jstree().delete_node(node.id);
                $('#theme-tree-full').jstree('refresh');
              }
              else {
                console.log("deleteTheme failed");
              }

              console.log(message);
            }).then();
           }
        }
      }

      if (node.parent == "#") {
        delete items.editThemeItem;
        delete items.deleteItem;
      }
    }
    else {
      items = {
        editCitationItem: {
          label: "Edit",
          action: () =>  {
            AppComponent.editObject = node;
            BibleThemeTreeComponent.ngZone.run(() => AppComponent.router.navigate(["edit/citation"]));
           }
      },
        copyCitationItem: {
          label: "Copy",
          action: () =>  { }
        },
        deleteCitationItem: {
          label: "Delete",
          action: () =>  { }
        }
      }
    }

    return items;
  }

}

@Directive()
export class ServiceDirective {
  constructor (provider:BibleService) {
    console.log("serviceDirective initializer");
    this.provider = provider;
  }

  provider:BibleService;

  public async process(node:any, callback:any) {
    console.log("processing");
    
    let themeId = <number><unknown>node.id.replace(/theme(\d+)/, '$1');
    console.log(`service directive value=${node.Id}, themeId=${themeId}`);

    console.log(node);
    let children = await this.provider.getChildren(themeId);
    console.log(`children of  ${node?.text ?? "theme0"}`);
    console.log(children);
    callback(children);
  }

  public async getThemeChain(id: number, callback:any) {
    console.log(`getThemeChain for ${id}`);
    await this.provider.getThemeChain(id, (chain:ThemeChainModel) => {
      callback(chain);
    });
  }

  public async deleteTheme(node:JstreeModel, callback:any) {
    console.log("Delete Theme");
    if (node.parent == "#") {
      callback(false, "Root themes cannot be deleted");
      return;
    }

    if (!node.id.startsWith("theme")) {
      callback(false, "Node is not a theme");
      return;
    }

    let id = <number><unknown>node.id.replace(/theme(\d+)/, '$1');
    let parent = <number><unknown>node.parent.replace(/theme(\d+)/, '$1');
    console.log(id);
    await this.provider.deleteTheme(id, (success:boolean, message:string) => {
      if (success) {
        
        callback(success, message);
      }
    });
  }
}
