import { Component, Directive, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService } from '../bible.service';
import { AppComponent } from '../app.component';
import { JstreeModel, JstreeState } from '../model/jstree.model';
import { ThemeChainModel } from '../model/themeChain.model';
import { ThemeModel, ThemeExtendedModel } from '../model/theme.model';
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
    console.log(theme);
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
        check_callback : true,
        data: function (node:any, cb:any) {
          BibleThemeTreeComponent.LoadNodeCallback = cb;
          if(node.id === "#") {
            service.process({id: 'theme0'}, cb).then();
          }
          else {
            service.process(node, cb).then();
          }  
        }
      },
      plugins: ['contextmenu'],
      contextmenu: {
        items: this.ThemeTreeContextMenu
      }
    })
    .on('changed.jstree', (e:any, data:any) => {
      console.log(data);
      console.log(e);
      if (data.action == "select_node") {
        // A new different node on the tree was selected (clicked)
        console.log("jstree select event");
        let node = JstreeModel.getJstreeModel(data.node);
        if (node.id.startsWith("theme")) {
          // theme was selected - change the active theme but allow the active citation to remain active
          this.activeTheme = node;
          this.broadcastActiveThemeChange(node);
          if (this.activeCitation) {
            const a = $(`#${this.activeCitation.id} > a.theme-tree-node-citation`);
            a.attr('aria-selected', 'true').addClass('jstree-clicked');
          }
        }
        else if (node.id.startsWith("citation")) {
          // citation was selected - change the active citation but allow the active theme to remain active
          this.activeCitation = node;
          this.broadcastActiveCitationChange(node);
          if (this.activeTheme) {
            const a = $(`#${this.activeTheme.id} > a.theme-tree-node-theme`);
            a.attr('aria-selected', 'true').addClass('jstree-clicked');
          }
        }
      }
    })
    .on('loaded.jstree', (e:any, data:any) => {
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
      // theme menu
      items = {
        editThemeItem: {
          label: "Edit",
          action: () => {
            BibleThemeTreeComponent.ngZone.run(() => AppComponent.router.navigate(["edit/theme"]));
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
        deleteThemeItem: {
          label: "Delete",
          action: () =>  {
            console.log(`Delete theme ${node.id}`);
            BibleThemeTreeComponent.ngZone.run(() => AppComponent.router.navigate(["delete/theme"]));
           }
        }
      }

      if (node.parent == "#") {
        delete items.editThemeItem;
        delete items.deleteItem;
      }
    }
    else {
      // Citation menu
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

  public static getDomNode(id: string): any {
    const themeTree = $('#theme-tree-full').jstree(true);
    let domNode = themeTree.get_node(id);
    console.log(`getDomNode id=${id}`);
    console.log(domNode);

    return domNode;
  }

  public static refreshDomNode(nodeId: string) {
    console.log("refreshDomNode");
    const themeTree = $('#theme-tree-full').jstree(true);
    themeTree.refresh_node(nodeId);
  }

  public static openDomThemeNode(node: JstreeModel) {
    const themeTree = $('#theme-tree-full').jstree(true);
    themeTree.open_node(node.id);
  }

  public static deleteDomNode(id: string) {
    let themeTree = $('#theme-tree-full').jstree(true);
    themeTree.delete_node(id);
  }

  public static moveDomNode(parent:any, child:any, toIndex:number) {
    let themeTree = $('#theme-tree-full').jstree(true);
    themeTree.move_node(child, parent, toIndex);
  }

  public static appendTheme(theme: ThemeModel) {
    let model: JstreeModel = new JstreeModel(`theme${theme.id}`, theme.name, theme.description, "theme", theme.sequence, theme.path, new JstreeState(false, false, false));
    let tree = $("#theme-tree-full").jstree(true);
    // Position theme just before the first citation of the parent theme
    let position = 0;
    let children = tree.get_node(`#theme${theme.parent}`).children;
    let siblings:string[] = [];
    if (children === true) {
      tree.open_node(`#theme${theme.parent}`, () => {
        siblings = tree.get_node(`#theme${theme.parent}`).children;
      })
    }
    else if (Array.isArray(children)) {
      siblings = children;
    }

    if (siblings) {
      siblings.map((id) => {
        if (id.startsWith("theme")) {
          position++;
        }
      });
    }

    $('#theme-tree-full').jstree('create_node', `#theme${theme.parent}`, model, position, (theme:any) => {
      console.log("theme created");
      console.log(theme);
    });
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
    console.log(`service directive value=${node.id}, themeId=${themeId}`);

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

  public refreshNode (node:JstreeModel) {
    let id:number = <number><unknown>node.id.replace(/theme|citation/, "");
    if (node.id.startsWith("theme")) {
      this.provider.getTheme(id).then(theme => {
        let node = JstreeModel.getJstreeModelFromExtendedTheme(theme);
        console.log("refreshed theme node");
        console.log(node);
      });
    }
  }

  // public async deleteTheme(node:JstreeModel, callback:any) {
  //   console.log("Delete Theme");
  //   if (node.parent == "#") {
  //     callback(false, "Root themes cannot be deleted");
  //     return;
  //   }

  //   if (!node.id.startsWith("theme")) {
  //     callback(false, "Node is not a theme");
  //     return;
  //   }

  //   let id = <number><unknown>node.id.replace(/theme(\d+)/, '$1');
  //   let parent = <number><unknown>node.parent.replace(/theme(\d+)/, '$1');
  //   console.log(id);
  //   await this.provider.deleteTheme(id, (success:boolean, message:string) => {
  //     if (success) {
  //       callback(success, message);
  //     }
  //   });
  // }
}
