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
  static ClipboardSelector: Subject<JstreeModel>;
  static ngZone: NgZone;
  static LoadNodeCallback: any;
  constructor(ngzone: NgZone) {
    const bibleService = inject(BibleService);
    BibleThemeTreeComponent.service = new ServiceDirective(bibleService);
    BibleThemeTreeComponent.ActiveThemeSelector = new Subject<JstreeModel>();
    BibleThemeTreeComponent.ActiveCitationSelector = new Subject<JstreeModel>();
    BibleThemeTreeComponent.ClipboardSelector = new Subject<JstreeModel>();
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
        worker: false,
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
          action: () =>  {
            console.log("copying theme item");
            BibleThemeTreeComponent.ClipboardSelector.next(node);;
            console.log("done copying theme item");
           }
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
          action: () =>  {
            console.log("copying citation item");
            BibleThemeTreeComponent.ClipboardSelector.next(node);;
            console.log("done copying citation item");
          }
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

  public static refreshDomNodeFromDb(nodeId: string) {
    console.log("refreshDomNode");
    const themeTree = $('#theme-tree-full').jstree(true);
    if ((themeTree as any).get_node(nodeId)) {
      (themeTree as any).refresh_node(nodeId);
      console.log(themeTree);
    }
  }

  public static refreshDomNode(node: JstreeModel) {
    console.log("refreshDomNode");
    const themeTree = $('#theme-tree-full').jstree(true);
    (themeTree as any).redraw_node(node);
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

  public static updateCitationNode(citation: JstreeModel) {
    if (citation && citation.li_attr && citation.li_attr.citationId) {
      const citationLabel = citation.text;
      const citationId = citation.li_attr.citationId;
      const tree = $("#theme-tree-full").jstree(true);
      const duplicates: JstreeModel[] = tree
        .get_json("#", { flat: true })
        .filter((node:JstreeModel) =>
          node.id.startsWith("citation") && node.li_attr.citationId == citationId
        );

      (async () => {
        const tree = $('#theme-tree-full').jstree(true) as any;
        if(!tree){ console.error('jsTree instance not found at selector #theme-tree-full'); return; }

        duplicates.forEach(oldNode => {
          const nodeId = oldNode.id;
          const node = tree.get_node(nodeId);
          node.text = citationLabel;
          node.li_attr.title = citation.li_attr?.title ?? '';
          node.a_attr.title = citation.li_attr?.title ?? '';

          tree.redraw_node(node);
          console.log('verified model a_attr.title:', tree.get_node(nodeId).a_attr.title);
        });
      })();
    }
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
      callback(chain.chain.map(t => t.name).join("/"));
    });
  }

  public async getCitationLabel(id:number) {
    return await this.provider.getCitationLabel(id);
  }
}
