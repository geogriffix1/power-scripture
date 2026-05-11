import { Component, Directive, inject, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BibleService } from '../bible.service';
import { AppComponent } from '../app.component';
import { MainShellComponent } from '../mainshell/mainshell.component';
import { JstreeModel, JstreeState } from '../model/jstree.model';
import { ThemeChainModel } from '../model/themeChain.model';
import { ThemeModel, ThemeExtendedModel } from '../model/theme.model';
import { ThemeToCitationLinkModel } from '../model/themeToCitation.model';
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
  activeCitation:JstreeModel|null = null;
  static router: Router;
  static ActiveThemeSelector: Subject<JstreeModel|null>;
  static ActiveCitationSelector: Subject<JstreeModel|null>;
  static ClipboardSelector: Subject<JstreeModel>;
  static ngZone: NgZone;
  static LoadNodeCallback: any;
  static ClipboardNode?: JstreeModel;
  static ThemeSwitchTrigger: Subject<void>;

  constructor( ngzone: NgZone, router: Router ) {
    const bibleService = inject(BibleService);
    BibleThemeTreeComponent.service = new ServiceDirective(bibleService);
    BibleThemeTreeComponent.ActiveThemeSelector = new Subject<JstreeModel|null>();
    BibleThemeTreeComponent.ActiveCitationSelector = new Subject<JstreeModel|null>();
    BibleThemeTreeComponent.ClipboardSelector = new Subject<JstreeModel>();
    BibleThemeTreeComponent.ThemeSwitchTrigger = new Subject<void>();
    BibleThemeTreeComponent.ngZone = ngzone;
    BibleThemeTreeComponent.router = router;
  }

  broadcastActiveThemeChange(theme:JstreeModel|null) {
    BibleThemeTreeComponent.ActiveThemeSelector.next(theme);
  }

  broadcastActiveCitationChange(citation:JstreeModel|null) {
    BibleThemeTreeComponent.ActiveCitationSelector.next(citation);
  }

  public static triggerEditThemeSwitch() {
    BibleThemeTreeComponent.ThemeSwitchTrigger.next();
  }

  ngOnInit(): void {
    var service = BibleThemeTreeComponent.service;
    BibleThemeTreeComponent.ClipboardSelector.subscribe((node:JstreeModel) => {
      BibleThemeTreeComponent.ClipboardNode = node;
    });

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
      if (data.action == "select_node") {
        // A new different node on the tree was selected (clicked)
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
    // .on('loaded.jstree', (e:any, data:any) => {
    //   console.log("jstree loaded event");
    //   console.log(data);
    // }).on('redraw.jstree', (e:any, data:any) => {
    //   console.log("jstree redraw event data:");  
    //   console.log(data);
    //   console.log("e:")
    //   console.log(e);
    // })
    // ;
  }

  ThemeTreeContextMenu (node:JstreeModel): any {
    let service = BibleThemeTreeComponent.service;
    let items:any = {};
    if (node.a_attr.class == "theme-tree-node-theme") {
      // theme menu
      items = {
        editThemeItem: {
          label: "Edit",
          action: () => {
              BibleThemeTreeComponent.ngZone.run(() => BibleThemeTreeComponent.router.navigate(["/edit/theme"]));
          }
        },
        copyThemeItem: {
          label: "Copy",
          action: () =>  {
            BibleThemeTreeComponent.ClipboardSelector.next(node);;
           }
        },
        pasteItem: {
          label: "Paste",
          action: () =>  {
            if (BibleThemeTreeComponent.ClipboardNode && BibleThemeTreeComponent.ClipboardNode.id.startsWith("theme")) {
              let copyThemeId = +BibleThemeTreeComponent.ClipboardNode.id.replace("theme", "");
              service.pasteTheme(copyThemeId, node);
            }
            else if (BibleThemeTreeComponent.ClipboardNode) {
              let copyCitationId = +BibleThemeTreeComponent.ClipboardNode.id.replace("citation", "");
              service.pasteCitation(copyCitationId, node);
            }
          }
        },
        createThemeItem: {
          label: "Create Subtheme",
          action: () => {
            BibleThemeTreeComponent.ngZone.run(() => BibleThemeTreeComponent.router.navigate(["/create/theme"]));
          }
        },
        createCitationItem: {
          label: "Create Citation",
          action: () => {
            BibleThemeTreeComponent.ngZone.run(() => BibleThemeTreeComponent.router.navigate(["/create/citation"]));                    
          }
        },
        deleteThemeItem: {
          label: "Delete",
          action: () =>  {
            BibleThemeTreeComponent.ngZone.run(() => BibleThemeTreeComponent.router.navigate(["/delete/theme"]));
           }
        }
      }

      if (node.parent == "#") {
        delete items.createThemeItem;
        delete items.editThemeItem;
        delete items.deleteThemeItem;
      }
    }
    else {
      // Citation menu
      items = {
        editCitationItem: {
          label: "Edit",
          action: () =>  {
            MainShellComponent.editObject = node;
            BibleThemeTreeComponent.ngZone.run(() => BibleThemeTreeComponent.router.navigate(["/edit/citation"]));
           }
      },
        copyCitationItem: {
          label: "Copy",
          action: () =>  {
            BibleThemeTreeComponent.ClipboardSelector.next(node);
          }
        },
        deleteCitationItem: {
          label: "Delete",
          action: () =>  { 
            BibleThemeTreeComponent.ngZone.run(() => BibleThemeTreeComponent.router.navigate(["/delete/citation"]));
          }
        }
      }
    }

    return items;
  }

  public static getDomNode(id: string): any {
    const themeTree = $('#theme-tree-full').jstree(true);
    let domNode = themeTree.get_node(id);

    return domNode;
  }

static refreshDomNodeFromDb(nodeId: string, callback?: (node: any) => void): void {
  const treeRoot = $('#theme-tree-full');
  const tree = treeRoot.jstree(true) as any;

  if (!tree) {
    console.warn('jsTree instance not found.');
    return;
  }

  const handler = (_event: any, data: any) => {
    if (data?.node?.id !== nodeId) {
      return;
    }

    treeRoot.off('refresh_node.jstree', handler);

    const refreshedNode = tree.get_node(nodeId);

    if (refreshedNode) {
      callback?.(refreshedNode);
    }
  };

  treeRoot.on('refresh_node.jstree', handler);

  tree.refresh_node(nodeId);
}
  public static refreshDomNode(node: JstreeModel) {
    const themeTree = $('#theme-tree-full').jstree(true);
    (themeTree as any).redraw_node(node);
  }

  public static setActiveCitation(node: JstreeModel) {
    const themeTree = $('#theme-tree-full').jstree(true);
   $('#theme-tree-full [id^=citation].jstree-clicked').removeClass('jstree-clicked').attr('aria-selected', 'false');
    themeTree.open_node(`theme${node.parent}`);
    themeTree.select_node(node.id);
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
        });
      })();
    }
  }
}

@Directive()
export class ServiceDirective {
  constructor (provider:BibleService) {
    this.provider = provider;
  }

  provider:BibleService;

  public async process(node:any, callback:any) {    
    let themeId = <number><unknown>node.id.replace(/theme(\d+)/, '$1');
    let children = await this.provider.getChildren(themeId);
    callback(children);
  }

  public async getThemeChain(id: number, callback:any) {
    await this.provider.getThemeChain(id, (chain:ThemeChainModel) => {
      callback(chain.chain.map(t => t.name).join("/"));
    });
  }

  public async getCitationLabel(id:number) {
    return await this.provider.getCitationLabel(id);
  }

  public async pasteTheme(copyId: number, pasteNode: JstreeModel) {
    let pasteId = +pasteNode.id.replace("theme", "");
    return await this.provider.pasteTheme(copyId, pasteId, (result: any) => {
      BibleThemeTreeComponent.refreshDomNodeFromDb(pasteNode.id);
    });
  }

  public async pasteCitation(copyId: number, pasteNode: JstreeModel) {
    let pasteId = +pasteNode.id.replace("theme", "");
    return await this.provider.pasteCitation(copyId, pasteId, (result: any) => {
      BibleThemeTreeComponent.refreshDomNodeFromDb(pasteNode.id);
    });
  }
}
