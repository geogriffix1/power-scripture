import { Component, Input, Signal, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { WorkbenchComponent } from '../../workbench.component';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from '../../../model/jstree.model';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragSortEvent, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BibleService } from '../../../bible.service';
import { ThemeModel, ThemeExtendedModel, ThemeModelReference } from '../../../model/theme.model';
import { ThemeToCitationLinkModel } from '../../../model/themeToCitation.model';

@Component({
    selector: 'app-edit-theme',
    imports: [
        CdkDropListGroup,
        CdkDropList,
        CdkDrag
    ],
    templateUrl: './edit-theme.component.html',
    styleUrl: './edit-theme.component.css'
})

export class EditThemeComponent {
  @Input({required: true})
    activeThemeNode!: Signal<JstreeModel>;
  @ViewChild("scrollableContent", { static: false })
    scrollableContent!: ElementRef<HTMLElement>
  previousThemeModel: JstreeModel | null = null;
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

  constructor(private service: BibleService) {
      effect(()=>{
      console.log("edit-theme: in effect");
      console.log()
      
      if (this.activeThemeNode()) {
        let id = <number><unknown>this.activeThemeNode().id.replace("theme", "");
        service.getTheme(id)
          .then(theme => {
            this.activeTheme = theme;
            $("#name").val(this.activeTheme.name).show(500);
            $("#description").val(this.activeTheme.description).show(500);
            $("div.theme.selected").removeClass("missing").text(this.activeTheme.path).show(500);
            let themes:ThemeModelReference[] = [];
            let themeToCitationLinks:ThemeToCitationLinkModel[] = [];
            this.activeTheme.themes
              .sort((a, b) => a.theme.sequence - b.theme.sequence)
              .forEach(theme => themes.push(theme)); 
            this.activeTheme.themeToCitationLinks
              .sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence)
              .forEach(link => themeToCitationLinks.push(link));

            this.childthemes = themes;
            this.citations = themeToCitationLinks;
            this.isEdited = false;

            this.editedTheme = <ThemeExtendedModel> {
              id: this.activeTheme.id,
              name: this.activeTheme.name,
              description: this.activeTheme.description,
              parent: this.activeTheme.parent,
              sequence: this.activeTheme.sequence,
              path: this.activeTheme.path,
              expanded: this.activeTheme.expanded,
              themes: themes,
              themeToCitationLinks: themeToCitationLinks
            };
          });
      }
      else {
        $("#name").val("").show(500);
        $("#description").val("").show(500);
        $("div.theme.selected")
          .removeClass("missing")
          .addClass("missing")
          .html("Please select the <b>Theme</b> from the <b>Bible Theme Tree</b>")
          .show(500);
      }
    });
  }

  onThemeResequencing(event:CdkDragSortEvent<any,any>) {
    var currentIndex = event.currentIndex;
    var attr = `[node=${event.item.element.nativeElement.attributes.getNamedItem("node")!.value}]`;
    $(`body > ${attr} > div`).first().text(currentIndex + 1);
  }

  onThemeDrop(event: CdkDragDrop<ThemeModelReference[]>) {
    this.service = new BibleService;

    // angular system function
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

    (async () => {
      for (let index = 0; index < this.childthemes.length; index++) {
        if (this.childthemes[index].theme.sequence != index + 1) {
          await this.service.setThemeSequence(this.childthemes[index].theme.id, index + 1);
          this.childthemes[index].theme.sequence = index + 1;
        }
        
        let targetTheme = BibleThemeTreeComponent.getDomNode(`theme${this.childthemes[index].theme.id}`);
        BibleThemeTreeComponent.moveDomNode(targetTheme.parent, targetTheme, index);
      }
    })();
 }

  onCitationResequencing(event:CdkDragSortEvent<any,any>) {
    var currentIndex = event.currentIndex;
    var attr = `[node=${event.item.element.nativeElement.attributes.getNamedItem("node")!.value}]`;
    $(`body > ${attr} > div`).first().text(currentIndex + 1);
  }

  onCitationDrop(event: CdkDragDrop<ThemeToCitationLinkModel[]>) {

    // angular system function
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

    (async () => {
      for (let index = 0; index < this.citations.length; index++) {
        if (this.citations[index].themeToCitation.sequence != index + 1) {
          await this.service.setThemeToCitationSequence(this.citations[index].themeToCitation.id, index + 1);
          this.citations[index].themeToCitation.sequence = index + 1;
        }

        let targetCitation = BibleThemeTreeComponent.getDomNode(`citation${this.citations[index].themeToCitation.id}`);
        BibleThemeTreeComponent.moveDomNode(targetCitation.parent, targetCitation.id, this.childthemes.length + index);
      }
    })();
  }

  EditTheme() {
    $(".command-message").text("");
    this.editedTheme.name = (<string>$("#name").val() ?? "").trim();
    this.editedTheme.description = (<string>$("#description").val() ?? "").trim();

    this.isEdited = this.editedTheme.name != this.activeTheme.name;
    this.isEdited ||= this.editedTheme.description != this.activeTheme.description;

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
          if (response.message == "Success") {
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

            BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${obj.activeTheme.id}`);
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

    this.updateScrollingHeight();

    if (WorkbenchComponent.activeTheme) {
      this.activeThemeNode = signal(WorkbenchComponent.activeTheme);
    }
  }

  ngAfterViewInit() {
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

            this.updateScrollingHeight();
          }
        });


      EditThemeComponent.isSubscribed = true;
    }
  }

  updateScrollingHeight() {
    const scrollingEl = this.scrollableContent.nativeElement;
    const areaEl = scrollingEl.closest('as-split-area') as HTMLElement;

    if (areaEl) {
      const areaRect = areaEl.getBoundingClientRect();
      const scrollRect = scrollingEl.getBoundingClientRect();
      const newHeight = areaRect.height - (scrollRect.top - areaRect.top);
      scrollingEl.style.height = `${newHeight}px`;
    }
  }

  ngOnDestroy() {
    EditThemeComponent.isActive = false;
  }
}
