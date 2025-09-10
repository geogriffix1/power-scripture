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
    var currentIndex = event.currentIndex;
    var attr = `[node=${event.item.element.nativeElement.attributes.getNamedItem("node")!.value}]`;
    $(`body > ${attr} > div`).first().text(currentIndex + 1);
  }

  onThemeDrop(event: CdkDragDrop<ThemeModelReference[]>) {
    let service = new BibleService;

    console.log("Drop Theme");
    console.log(event);

    // angular system function
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    (async () => {
      this.childthemes = event.container.data.map(theme => theme);

      for (let index = 0; index < this.childthemes.length; index++) {
        console.log(`node: ${index+1} ${this.childthemes[index].theme.name} ${this.childthemes[index].theme.sequence}`);
        if (this.childthemes[index].theme.sequence != index + 1) {
          await service.setThemeSequence(this.childthemes[index].theme.id, index + 1);
          this.childthemes[index].theme.sequence = index + 1;
        }
        
        let targetTheme = BibleThemeTreeComponent.getDomNode(`theme${this.childthemes[index].theme.id}`);
        BibleThemeTreeComponent.moveDomNode(targetTheme.parent, targetTheme, index);
      }
    })();
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

    // angular system function
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

    for (let index = 0; index < this.citations.length; index++) {
      this.citations[index].themeToCitation.sequence = index + 1;
    }
  }

  EditTheme() {
    $(".command-message").text("");
    this.editedTheme.name = (<string>$("#name").val() ?? "").trim();
    this.editedTheme.description = (<string>$("#description").val() ?? "").trim();

    console.log(`name change: ${this.activeTheme.name} to ${this.editedTheme.name}`);
    console.log(`description change: ${this.activeTheme.description} to ${this.editedTheme.description}`);
    this.isEdited = this.editedTheme.name != this.activeTheme.name;
    this.isEdited ||= this.editedTheme.description != this.activeTheme.description;

    console.log(`Edit theme isEdited: ${this.isEdited}`);
    if (this.isEdited) {
      if (!this.editedTheme.name) {
        $(".command-message").text("Name is required");
        return;
      }

      (async (obj:EditThemeComponent) => {
        let service = new BibleService;
        var parentTheme:ThemeExtendedModel;
        if (obj.editedTheme.name != obj.activeTheme.name) {
          parentTheme = await service.getTheme(obj.editedTheme.id);
          parentTheme.themes.map(child => {
            if (child.theme.name == obj.editedTheme.name) {
              $(".command-message").text("Error: There is already a theme with that name here");
              return;
            }
          });
        }

        try {
          let response = await service.editTheme(obj.editedTheme);
          console.log("response from editTheme:");
          console.log(response);
          if (response.message == "Success") {
            console.log("successful");
            let node = <JstreeModel>BibleThemeTreeComponent.getDomNode(`theme${obj.activeTheme.id}`);
            node.text = obj.editedTheme.name;
            node.li_attr.title = obj.editedTheme.description;
            node.data.path = obj.editedTheme.path;

            obj.activeTheme = <ThemeExtendedModel> {
              id: obj.editedTheme.id,
              name: obj.editedTheme.name,
              description: obj.editedTheme.description,
              parent: obj.editedTheme.parent,
              sequence: obj.editedTheme.sequence,
              path: obj.editedTheme.path,
              expanded: obj.editedTheme.expanded,
              themes: obj.editedTheme.themes,
              themeToCitationLinks: obj.editedTheme.themeToCitationLinks
            };

            console.log("calling theme tree component");
            console.log(obj.activeTheme);
            BibleThemeTreeComponent.refreshDomNode(`theme${obj.activeTheme.id}`);
          }
          else {
            console.log(response.message);
            throw "Failed";
          }
        }
        catch {
          $(".command-message").text("Theme Edit failed")
        }
  
      })(this);
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

  async getDbTheme(id:number) : Promise<ThemeExtendedModel> {
    const service = new BibleService;
    return await service.getTheme(id);
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
      // subscribe to resizing events and to changes of active theme and active citation first time through
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
            // Whenever the active theme changes while this component is active
            if (EditThemeComponent.isActive) {
              if (WorkbenchComponent.activeTheme) {
                let service = new BibleService;
                let id = <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", "");
                service.getTheme(id)
                  .then(theme => {
                    obj.activeTheme = theme;
                    $("#name").val(obj.activeTheme.name).show(500);
                    $("#description").val(obj.activeTheme.description).show(500);
                    $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
                    console.log(`Active Theme set to: ${obj.activeTheme.path}`);
                    console.log(obj.activeTheme);
                    let themes:ThemeModelReference[] = [];
                    let themeToCitationLinks:ThemeToCitationLinkModel[] = [];
                    obj.activeTheme.themes.sort((a, b) => a.theme.sequence - b.theme.sequence).forEach(theme => themes.push(theme)); 
                    obj.activeTheme.themeToCitationLinks.sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence).forEach(link => themeToCitationLinks.push(link));

                    obj.childthemes = obj.activeTheme.themes;
                    obj.citations = obj.activeTheme.themeToCitationLinks;
                    obj.isEdited = false;

                    obj.editedTheme = <ThemeExtendedModel> {
                      id: obj.activeTheme.id,
                      name: obj.activeTheme.name,
                      description: obj.activeTheme.description,
                      parent: obj.activeTheme.parent,
                      sequence: obj.activeTheme.sequence,
                      path: obj.activeTheme.path,
                      expanded: obj.activeTheme.expanded,
                      themes: themes,
                      themeToCitationLinks: themeToCitationLinks
                    };
                  });
              }
            }
            else { console.log("EditThemeComponent is not active"); }
          });
      })(this);

      EditThemeComponent.isSubscribed = true;
    }

    // SETUP - if there is an active theme, the active theme is initialized
    (async (obj:EditThemeComponent) => {
      let service = new BibleService;
      if (WorkbenchComponent.activeTheme) {
        let id = <number><unknown>WorkbenchComponent.activeTheme.id.replace("theme", "");
        service.getTheme(id)
          .then(theme => {
            obj.activeTheme = theme;
            $("#name").val(obj.activeTheme.name).show(500);
            $("#description").val(obj.activeTheme.description).show(500);
            $("div.theme.selected").removeClass("missing").text(obj.activeTheme.path).show(500);
            console.log(`Active Theme set to: ${obj.activeTheme.path}`);
            console.log(obj.activeTheme);
            let themes:ThemeModelReference[] = [];
            let themeToCitationLinks:ThemeToCitationLinkModel[] = [];
            obj.activeTheme.themes
              .sort((a, b) => a.theme.sequence - b.theme.sequence)
              .forEach(theme => themes.push(theme)); 
            obj.activeTheme.themeToCitationLinks
              .sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence)
              .forEach(link => themeToCitationLinks.push(link));

            obj.childthemes = themes;
            obj.citations = themeToCitationLinks;
            obj.isEdited = false;

            obj.editedTheme = <ThemeExtendedModel> {
              id: obj.activeTheme.id,
              name: obj.activeTheme.name,
              description: obj.activeTheme.description,
              parent: obj.activeTheme.parent,
              sequence: obj.activeTheme.sequence,
              path: obj.activeTheme.path,
              expanded: obj.activeTheme.expanded,
              themes: themes,
              themeToCitationLinks: themeToCitationLinks
            };
          });
      }
    })(this);
  }

  ngOnDestroy() {
    console.log("ngOnDestroy");
    EditThemeComponent.isActive = false;
  }
}
