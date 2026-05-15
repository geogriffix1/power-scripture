import { Component, Input, Signal, effect, ElementRef, ViewChild } from '@angular/core';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from '../../../model/jstree.model';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragSortEvent, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BibleService } from '../../../bible.service';
import { ThemeExtendedModel, ThemeModelReference } from '../../../model/theme.model';
import { ThemeToCitationLinkModel } from '../../../model/themeToCitation.model';
import { MarkdownService } from '../../../markdown.service';

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
    activeThemeNode!: Signal<JstreeModel|null>;
  @ViewChild("scrollableContent", { static: false })
    scrollableContent!: ElementRef<HTMLElement>
  previousThemeModel: JstreeModel | null = null;
  activeTheme!: ThemeExtendedModel;
  editedTheme: ThemeExtendedModel | null = null;

  isEdited = false;
  sectionWidth!:number;
  sectionHeight!:number;
  resequencingHeight!:number;
  themeListOpen = false;
  citationListOpen = false;
  remarksOpen = false;
  remarksLoaded = false;
  remarksSaving = false;
  remarksEditing = false;
  remarksText = "";
  remarksEditText = "";
  renderedRemarks = "";
  remarksMessage = "";
  isTopLevelTheme = false;

  jstreeModel!:JstreeModel;

  static isSubscribed = false;
  static isActive = false;
  
  childthemes!: ThemeModelReference[];
  citations!: ThemeToCitationLinkModel[];

  draggingRowElement?:any;
  dragoverRowElement?:any;
  draggingType?:string;
  draggingClass?:string;

  constructor(
    private service: BibleService,
    private markdownService: MarkdownService
  ) {
    console.log('EditThemeComponent ctor');
      effect(()=>{      
      if (this.activeThemeNode()) {
        this.isTopLevelTheme = !this.activeThemeNode()?.parent?.startsWith("theme");
        let id = <number><unknown>this.activeThemeNode()?.id?.replace("theme", "");
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
            this.remarksOpen = false;
            this.remarksLoaded = false;
            this.remarksSaving = false;
            this.remarksEditing = false;
            this.remarksText = "";
            this.remarksEditText = "";
            this.renderedRemarks = "";
            this.remarksMessage = "";
            $(".childRemarks .spin-arrow-icon").css("rotate", "0deg");
            $(".remarks-container").hide();

            this.editedTheme = <ThemeExtendedModel> {
              id: this.activeTheme.id,
              name: this.activeTheme.name,
              description: this.activeTheme.description,
              parent: this.activeTheme.parent,
              sequence: this.activeTheme.sequence,
              remarks: this.activeTheme.remarks,
              path: this.activeTheme.path,
              extended: this.activeTheme.extended,
              themes: themes,
              themeToCitationLinks: themeToCitationLinks
            };
          });
      }
      else {
        this.isTopLevelTheme = false;
        $("#name").val("").show(500);
        $("#description").val("").show(500);
        this.remarksOpen = false;
        this.remarksLoaded = false;
        this.remarksSaving = false;
        this.remarksEditing = false;
        this.remarksText = "";
        this.remarksEditText = "";
        this.renderedRemarks = "";
        this.remarksMessage = "";
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
    if (this.isTopLevelTheme) {
      return;
    }

    this.editedTheme!.name = (<string>$("#name").val() ?? "").trim();
    this.editedTheme!.description = (<string>$("#description").val() ?? "").trim();

    this.isEdited = this.editedTheme!.name != this.activeTheme.name;
    this.isEdited ||= this.editedTheme!.description != this.activeTheme.description;

    if (this.isEdited) {
      if (!this.editedTheme!.name) {
        $(".command-message").text("Name is required");
        return;
      }

      (async (obj:EditThemeComponent) => {
        let service = new BibleService;
        var parentTheme:ThemeExtendedModel;
        if (obj.editedTheme!.name != obj.activeTheme.name) {
          parentTheme = await service.getTheme(obj.editedTheme!.id);
          parentTheme.themes.map(child => {
            if (child.theme.name == obj.editedTheme!.name) {
              $(".command-message").text("Error: There is already a theme with that name here");
              return;
            }
          });
        }

        try {
          let response = await service.editTheme(obj.editedTheme!);
          if (response.message == "Success") {
            let node = <JstreeModel>BibleThemeTreeComponent.getDomNode(`theme${obj.activeTheme.id}`);
            node.text = obj.editedTheme!.name;
            node.li_attr.title = obj.editedTheme!.description;
            node.data.path = obj.editedTheme!.path;

            obj.activeTheme = <ThemeExtendedModel> {
              id: obj.editedTheme!.id,
              name: obj.editedTheme!.name,
              description: obj.editedTheme!.description,
              parent: obj.editedTheme!.parent,
              sequence: obj.editedTheme!.sequence,
              remarks: obj.editedTheme!.remarks,
              path: obj.editedTheme!.path,
              extended: obj.editedTheme!.extended,
              themes: obj.editedTheme!.themes,
              themeToCitationLinks: obj.editedTheme!.themeToCitationLinks
            };

            BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${obj.activeTheme.id}`);
          }
          else {
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

  OpenCloseRemarks() {
    if (this.remarksEditing || !this.activeTheme?.remarks) {
      return;
    }

    if (this.remarksOpen) {
      $(".childRemarks .spin-arrow-icon").animate({rotate: "0deg"}, 500);
      $(".remarks-container").slideUp(500);
    }
    else {
      $(".childRemarks .spin-arrow-icon").animate({rotate: "90deg"}, 500);
      $(".remarks-container").slideDown(500);
      this.loadRemarks();
    }

    this.remarksOpen = !this.remarksOpen;
  }

  CreateRemarks(event: MouseEvent) {
    event.stopPropagation();

    if (!this.activeTheme || this.activeTheme.remarks) {
      return;
    }

    this.remarksOpen = true;
    this.remarksLoaded = true;
    this.remarksEditing = true;
    this.remarksText = "";
    this.remarksEditText = "";
    this.renderedRemarks = "";
    this.remarksMessage = "";
    $(".remarks-container").slideDown(500);
  }

  onRemarksInput(event: Event) {
    this.remarksEditText = (event.target as HTMLTextAreaElement).value;
    this.remarksMessage = "";
  }

  async loadRemarks() {
    if (!this.activeTheme || this.remarksLoaded) {
      return;
    }

    if (!this.activeTheme.remarks) {
      this.remarksText = "";
      this.remarksEditText = "";
      this.renderedRemarks = "";
      this.remarksLoaded = true;
      return;
    }

    try {
      this.remarksText = await this.service.getThemeRemarks(this.activeTheme.id);
      this.remarksEditText = this.remarksText;
      this.renderedRemarks = this.markdownService.render(this.remarksText);
      this.remarksLoaded = true;
    }
    catch {
      this.remarksMessage = "Remarks could not be loaded";
    }
  }

  async EditRemarks(event: MouseEvent) {
    event.stopPropagation();

    await this.loadRemarks();
    this.remarksEditText = this.remarksText;
    this.remarksEditing = true;
    this.remarksMessage = "";
  }

  CancelRemarksEdit(event: MouseEvent) {
    event.stopPropagation();

    this.remarksEditText = this.remarksText;
    this.remarksEditing = false;
    this.remarksMessage = "";

    if (!this.activeTheme?.remarks) {
      this.remarksOpen = false;
      this.remarksLoaded = false;
      $(".remarks-container").slideUp(500);
    }
  }

  async SaveRemarks(event: MouseEvent) {
    event.stopPropagation();

    if (!this.activeTheme || this.remarksSaving) {
      return;
    }

    this.remarksSaving = true;
    this.remarksMessage = "";

    try {
      const result = await this.service.saveThemeRemarks(this.activeTheme.id, this.remarksEditText);
      if (result.message == "Success" || result.success || result.saved) {
        this.remarksText = this.remarksEditText;
        this.renderedRemarks = this.markdownService.render(this.remarksText);
        this.activeTheme.remarks = true;
        if (this.editedTheme) {
          this.editedTheme.remarks = true;
        }
        const node = <JstreeModel>BibleThemeTreeComponent.getDomNode(`theme${this.activeTheme.id}`);
        if (node?.data) {
          node.data.remarks = true;
        }
        this.remarksOpen = true;
        this.remarksLoaded = true;
        this.remarksEditing = false;
        this.remarksMessage = "Remarks saved";
      }
      else {
        throw "Failed";
      }
    }
    catch {
      this.remarksMessage = "Remarks save failed";
    }
    finally {
      this.remarksSaving = false;
    }
  }

  async DeleteRemarks(event: MouseEvent) {
    event.stopPropagation();

    if (!this.activeTheme) {
      return;
    }

    try {
      const result = await this.service.deleteThemeRemarks(this.activeTheme.id);
      if (result.message == "Success" || result.success || result.deleted) {
        this.remarksText = "";
        this.remarksEditText = "";
        this.renderedRemarks = "";
        this.activeTheme.remarks = false;
        if (this.editedTheme) {
          this.editedTheme.remarks = false;
        }
        const node = <JstreeModel>BibleThemeTreeComponent.getDomNode(`theme${this.activeTheme.id}`);
        if (node?.data) {
          node.data.remarks = false;
        }
        this.remarksOpen = false;
        this.remarksLoaded = true;
        this.remarksEditing = false;
        this.remarksMessage = "Remarks deleted";
        $(".remarks-container").slideUp(500);
      }
      else {
        throw "Failed";
      }
    }
    catch {
      this.remarksMessage = "Remarks delete failed";
    }
  }

  async getDbTheme(id:number) : Promise<ThemeExtendedModel> {
    const service = new BibleService;
    return await service.getTheme(id);
  }
}
