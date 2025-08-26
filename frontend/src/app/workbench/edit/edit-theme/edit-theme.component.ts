import { Component } from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from '../../../model/jstree.model';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragSortEvent, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BibleService } from '../../../bible.service';
import { ThemeModel, ThemeExtendedModel, ThemeModelReference } from '../../../model/theme.model';
import { ThemeToCitationLinkModel } from '../../../model/themeToCitation.model';
@Component({
  selector: 'app-edit-theme',
  standalone: true,
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './edit-theme.component.html',
  styleUrl: './edit-theme.component.css'
})
export class EditThemeComponent {
  activeTheme!: ThemeExtendedModel;
  editedTheme!: ThemeExtendedModel;
  isEdited = false;
  sectionWidth!:number;
  sectionHeight!:number;
  resequencingHeight!:number;
  themeListOpen = false;
  citationListOpen = false;

  jstreeModel!:JstreeModel;

  static isSubscribed = false;
  static isActive = false;

  childthemes!: ThemeModelReference[];
  citations!: ThemeToCitationLinkModel[];

  draggingRowElement?:any;
  dragoverRowElement?:any;
  draggingType?:string;
  draggingClass?:string;

  onThemeResequencing(event:CdkDragSortEvent<any,any>) {
    console.log("theme Entered");
    console.log(event);
    var currentIndex = event.currentIndex;
    var attr = `[node=${event.item.element.nativeElement.attributes.getNamedItem("node")!.value}]`;
    $(`body > ${attr} > div`).first().text(currentIndex + 1);
  }

  onThemeDrop(event: CdkDragDrop<ThemeModelReference[]>) {

    console.log("Drop");
    console.log(event);

    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

    for (let index = 0; index < this.childthemes.length; index++) {
      this.childthemes[index].theme.sequence = index + 1;
    }

    this.isEdited = true;
  }

  onCitationResequencing(event:CdkDragSortEvent<any,any>) {
    console.log("citation Entered");
    console.log(event);
    var currentIndex = event.currentIndex;
    var attr = `[node=${event.item.element.nativeElement.attributes.getNamedItem("node")!.value}]`;
    $(`body > ${attr} > div`).first().text(currentIndex + 1);
  }

  onCitationDrop(event: CdkDragDrop<ThemeToCitationLinkModel[]>) {

    console.log("Drop citation");
    console.log(event);

    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

    for (let index = 0; index < this.citations.length; index++) {
      this.citations[index].themeToCitation.sequence = index + 1;
    }

    this.isEdited = true;
  }

  EditTheme() {
    $(".command-message").text("");
    this.editedTheme.name = <string>$("#name").val();
    this.editedTheme.description = <string>$("#description").val();

    console.log(`name change: ${this.activeTheme.name} to ${this.editedTheme.name}`);
    console.log(`description change: ${this.activeTheme.description} to ${this.editedTheme.description}`);
    this.isEdited = this.editedTheme.name != this.activeTheme.name;
    this.isEdited ||= this.editedTheme.description != this.activeTheme.description;

    console.log(`Edit theme isEdited: ${this.isEdited}`);

    var themesAreResequenced = false;
    var citationsAreResequenced = false;

    for (let i = 0; i < this.activeTheme.themes.length; i++) {
      if (this.activeTheme.themes[i].theme.sequence != this.editedTheme.themes[i].theme.sequence) {
        themesAreResequenced = true;
        console.log("Child themes have been resequenced.");
        break;
      }
    }

    for (let i = 0; i < this.activeTheme.themeToCitationLinks.length; i++) {
      if (this.activeTheme.themeToCitationLinks[i].themeToCitation.sequence != this.editedTheme.themeToCitationLinks[i].themeToCitation.sequence) {
        citationsAreResequenced = true;
        console.log("Citations have been resequenced");
        break;
      }
    }

    let node = $(`#theme${this.editedTheme.id}`).jstree('get_node');
    console.log("node:");
    console.log(node);

    if (this.isEdited) {
      let service = new BibleService;
    
      (async (obj:EditThemeComponent) => {
        let response = await service.editTheme(obj.editedTheme)
        $(".command-message").text(response);
        console.log(`about to fetch the node theme${obj.editedTheme.id}`);
        let node = $(`#theme${obj.editedTheme.id}`).jstree('get_node');
        node[0].innerHTML.replace(/(<i.*?<a.*?\/i>)(.*?)(<\/a>)/, `$1${obj.editedTheme.name}$3`);
        var title = node[0].attributes.getNamedItem('title');
        title.textContent = obj.editedTheme.description;


      })(this);
      if (!themesAreResequenced && !citationsAreResequenced) {
        $(".command-message").text("Edit Saved.");
        return;
      }   
    }
    else if (!themesAreResequenced && !citationsAreResequenced) {
      $(".command-message").text("No edits have been made.");
      return;
    }

    let service = new BibleService;

    // TODO: Resequence themes and Citations in the database
    let parentTheme = this.editedTheme.id;
    let themeSequenceList:number[] = [];
    let citationSequenceList:number[] = [];

    if (themesAreResequenced) {
      this.editedTheme
        .themes
        .sort((a, b) => a.theme.sequence - b.theme.sequence)
        .forEach(theme => themeSequenceList.push(theme.theme.id));
    }

    if (citationsAreResequenced) {
      this.editedTheme
        .themeToCitationLinks
        .sort((a, b)  => a.themeToCitation.sequence - b.themeToCitation.sequence)
        .forEach(citation => citationSequenceList.push(citation.themeToCitation.sequence));
    }

    // if (themesAreResequenced || citationsAreResequenced) {
    //   $('#theme-tree-full').jstree('load', [`theme${this.editedTheme.id}`]);
    //   let node = $(`#theme-tree-full`).jstree('get_node');
    //   console.log("node with resequenced children:");
    //   console.log(node);
    //   //node[0].state.loaded = false;
    // }

    if (themesAreResequenced) {
      console.log("resequencing themes");
      service.resequenceThemes(parentTheme, themeSequenceList, (themeResponse:any) => {
        console.log("resequencing themes callback");
        if (citationsAreResequenced) {
          service.resequenceCitations(parentTheme, citationSequenceList, (citationResponse:any) => {
            $('#theme-tree-full').jstree(true)._load_node(`theme${this.editedTheme.id}`);
          });
        }
        else {
          console.log('theme resequence response:');
          service.getTheme(this.editedTheme.id)
          .then(theme => {
            let domThemes = $(`#theme${this.editedTheme.id} li`);

            let position = 0;
            theme.themes.forEach(subTheme => {
              let slot = domThemes[position++];
              let slotHtml = slot.outerHTML;
              console.log("slot:");
              console.log(slotHtml);
              let domNode = $(`#theme${subTheme.theme.id}`);
              let html = domNode[0].outerHTML;
              console.log(html);

              // slot.attr('title', <string>domNode.attr('title'));
              // slot.attr('id', <string>domNode.attr('id'));
              // slot.attr('sequence', <string>domNode.attr('sequence'));
            
              // domNode.attr("sequence", position);
              // domNode.attr("id", slot.id)
//              console.log("domNode:");
//              console.log(domNode);
            });
          //node = $(`#theme${this.editedTheme.id}`);
          //console.log(node);
        //   var childnodesHolder = [];
        //   var childrenHolder = [];
        //   node[0].childNodes[2].childNodes.forEach((child:any) => {
        //      childnodesHolder.push(child);
        //   });
        //   node[0].childNodes[2].childNodes.forEach((child:any) => {
        //     childnodesHolder.push(child.ChildNode);
        //  });
        // console.log(node);
        //   $(`#theme-tree-full`).jstree('refresh_node', `theme${this.editedTheme.id}`);
          });
        }
      });
    }
    else if (citationsAreResequenced) {
      service.resequenceCitations(parentTheme, citationSequenceList, (response:any) => {
        console.log(response);
        $('#theme-tree-full').jstree('load_node', [`theme${this.editedTheme.id}`, BibleThemeTreeComponent.LoadNodeCallback]);
      });
    }
  }

  OpenCloseThemeList() {
    if (this.themeListOpen) {
      console.log("closing themelist");
      $(".childThemes .spin-arrow-icon").animate({rotate: "0deg"}, 500);
      $(".themes-container").slideUp(500);
    }
    else {
      console.log("opening themelist");
      $(".childThemes .spin-arrow-icon").animate({rotate: "90deg"}, 500);
      $(".themes-container").slideDown(500);
    }

    this.themeListOpen = !this.themeListOpen;
  }

  OpenCloseCitationList() {
    if (this.citationListOpen) {
      $(".childCitations .spin-arrow-icon").animate({rotate: "0deg"}, 500);
      $(".citations-container").slideUp(500);
    }
    else {
      $(".childCitations .spin-arrow-icon").animate({rotate: "90deg"}, 500);
      $(".citations-container").slideDown(500);
    }

    this.citationListOpen = !this.citationListOpen;
  }

  workbenchDomRect(rect:DOMRectReadOnly) {
    this.sectionWidth = rect.width;
    this.sectionHeight = rect.height;
  }

  ngOnInit() {
    console.log("initializing edit theme component");
    EditThemeComponent.isActive = true;

    let rect = WorkbenchComponent.getWorkbenchSize();

    this.workbenchDomRect(rect);
    this.sectionWidth = rect.width;
    $("app-edit-theme").width(rect.width);
    $("#description").width(rect.width - 60);
  }

  ngAfterViewInit() {
    console.log("ngAfterViewInit");
    if (!EditThemeComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          this.workbenchDomRect(rect);
          if(EditThemeComponent.isActive) {
            this.workbenchDomRect(rect);
            this.sectionWidth - rect.width - 4;
            $("app-edit-theme").width(rect.width);
            $("#description").width(rect.width - 60);
            let viewTop = $("as-split-area.workbench").offset()!.top;
            let viewHeight = <number>$("as-split-area.workbench").innerHeight();
            let resultsTop = $("section.scrollable-content").offset()!.top;
            this.resequencingHeight = viewHeight - resultsTop + viewTop;
            $("div.resequencing").css("height", this.resequencingHeight + "px");
          }
        });

      (async (obj:EditThemeComponent) => {
        BibleThemeTreeComponent.ActiveThemeSelector
          .subscribe((node:any) => {
            if (!this.activeTheme && WorkbenchComponent.activeTheme) {
              let service = new BibleService;
              let id = <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", "");
              service.getTheme(id)
                .then(theme => {
                  obj.activeTheme = <ThemeExtendedModel>theme;
                  $("#name").val(theme.name);
                  $("#description").val(theme.description);
                  $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
                  console.log(`Active Theme set to: ${obj.activeTheme.path}`);
                  $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
                  console.log(obj.activeTheme);
                  let themes:ThemeModelReference[] = [];
                  let themeToCitationLinks:ThemeToCitationLinkModel[] = [];
                  obj.activeTheme.themes.sort((a, b) => a.theme.sequence - b.theme.sequence).forEach(theme => themes.push(theme)); 
                  obj.activeTheme.themeToCitationLinks.sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence).forEach(link => themeToCitationLinks.push(link));
                  obj.editedTheme = {
                    id: obj.activeTheme.id,
                    parent: obj.activeTheme.parent,
                    name: obj.activeTheme.name,
                    sequence: obj.activeTheme.sequence,
                    description: obj.activeTheme.description,
                    expanded: obj.activeTheme.expanded,
                    themes: themes,
                    themeToCitationLinks: themeToCitationLinks,
                    childCount: themes.length + themeToCitationLinks.length,
                    path: obj.activeTheme.path
                  };

                  obj.childthemes = obj.editedTheme.themes;
                  obj.citations = obj.editedTheme.themeToCitationLinks;
                  obj.isEdited = false;
                });
            }
            else {
              $(".workbench-theme div.selected.theme").addClass("missing");
            }
        })
      })(this);

      EditThemeComponent.isSubscribed = true;
    }

    if (WorkbenchComponent.activeTheme) {
      console.log(`Active Theme: ${WorkbenchComponent.activeTheme.text}`);
    }
    else {
      console.log("no WorkbenchComponent.activeTheme");
    }
    (async (obj:EditThemeComponent) => {
      let service = new BibleService;
      if (WorkbenchComponent.activeTheme) {
        let id = <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", "");
        service.getTheme(id)
          .then(theme => {
            obj.activeTheme = <ThemeExtendedModel>theme;
            $("#name").val(theme.name);
            $("#description").val(theme.description);
            $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
            console.log(`Active Theme set to: ${obj.activeTheme.path}`);
            console.log(obj.activeTheme);
            let themes:ThemeModelReference[] = [];
            let themeToCitationLinks:ThemeToCitationLinkModel[] = [];
            obj.activeTheme.themes.sort((a, b) => a.theme.sequence - b.theme.sequence).forEach(theme => themes.push(theme)); 
            obj.activeTheme.themeToCitationLinks.sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence).forEach(link => themeToCitationLinks.push(link));
            obj.editedTheme = {
              id: obj.activeTheme.id,
              parent: obj.activeTheme.parent,
              name: obj.activeTheme.name,
              sequence: obj.activeTheme.sequence,
              description: obj.activeTheme.description,
              expanded: obj.activeTheme.expanded,
              themes: themes,
              themeToCitationLinks: themeToCitationLinks,
              childCount: themes.length + themeToCitationLinks.length,
              path: obj.activeTheme.path
            };

            obj.childthemes = obj.editedTheme.themes;
            obj.citations = obj.editedTheme.themeToCitationLinks;
            obj.isEdited = false;
    });
}
      else {
        $(".workbench-theme div.selected.theme").addClass("missing");
      }
    })(this);
  }

  ngOnDestroy() {
    console.log("ngOnDestroy");
    EditThemeComponent.isActive = false;
  }
}
