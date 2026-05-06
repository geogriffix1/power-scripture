import { Component, Directive, Input, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { BibleService } from '../../../bible.service';
import { Router } from '@angular/router';
import { ScriptureModel, ScriptureSearchResultModel } from '../../../model/scripture.model';
import { CiteScriptureRangeModel } from '../../../model/citeScriptureRangeModel';
import { SearchContextMenuComponent } from '../../../context-menu/search-context-menu.component';
import { SearchScriptureReportComponent } from '../../../reports/search-scripture-report/search-scripture-report.component';
import { MainShellComponent } from '../../../mainshell/mainshell.component';
import { WorkbenchComponent } from '../../workbench.component';
import { BibleThemeTreeComponent } from '../../../bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from '../../../model/jstree.model';
import * as wordList from './BibleWordlist.json';
import $ from 'jquery';

@Component({
    selector: 'app-search-scripture',
    imports: [
        SearchContextMenuComponent,
        SearchScriptureReportComponent
    ],
    templateUrl: './search-scripture.component.html',
    styleUrl: './search-scripture.component.css'
})
export class SearchScriptureComponent implements OnInit{
  static isActive:boolean = false;
  static isSubscribed:boolean = false;
  service:ServiceDirective;
  bibleService: BibleService = inject(BibleService);
  suggestions:string[] = [];
  context:any = {
    showSearchScriptureReport: Boolean
  };
  selectedEntry: any = [];
  searchCommand = "";
  searchResultsHeight!:number;
  searchResults = signal<ScriptureSearchResultModel[]>([]);
  isSubscribedKeystrokes = false;
  searchOverflow = 401; // Number of search results indicating overflow condition

  callbacks = {
    bibleService: new BibleService(),
    canSelectAll():boolean { return true; },
    selectAll():void {
      $(".search-result-selector").attr('aria-selected', 'true');
    },
    canDeselectAll():boolean { return true; },
    deselectAll():void {
      $(".command-message").removeClass('warning').text('').hide(100);
      $(".search-result-selector").attr('aria-selected', 'false');
    },
    canRemoveSelected():boolean { return true; },
    removeSelected(searchResults:WritableSignal<ScriptureSearchResultModel[]>):void {
      $(".command-message").removeClass('warning').text('').hide(100);
      let toRemove = Array.from($("div.search-result-selector[aria-selected=true]"))
        .map(result => +result.id.replace("result-", ""));
      searchResults.set(
        searchResults()
          .filter(result => !toRemove.some(id => result.id == id))
          .map(res => { res.selected = false; return res; }));
    },

    canCreateCitation():boolean { return true; },
    createCitation(searchResults:WritableSignal<ScriptureSearchResultModel[]>, context:any):void {
      console.log("create citation context menu action");
      $(".command-message").removeClass('warning').text('').hide(100);
      let activeTheme = WorkbenchComponent.activeTheme;
      if (!activeTheme) {
        $("div.command-message").text("Please select the Parent Theme from the Bible Theme Tree").show(500);
        return;
      }

      let selected = $(".search-result-selector[aria-selected=true]");
      let forCitations = [];
      WorkbenchComponent.scriptureRanges = [];

      let toAdd = Array.from($("div.search-result-selector[aria-selected=true]"))
        .map(result => +result.id.replace("result-", ""));

      if (toAdd.length == 0) {
        $(".command-message").text('Select verses to add to the citation').show(500);
        return;
      }

      forCitations = searchResults().filter(result => toAdd.some(id => id == result.id));

      let scriptures: number[] = forCitations.map((result) => result.id);
      
      let activeThemeId = +activeTheme.id.replace("theme", "");
      this.bibleService.getTheme(activeThemeId)
        .then(parentTheme => {
          var sequence: number;
          if (parentTheme.themeToCitationLinks.length == 0) {
            sequence = 1;
          }
          else {
            sequence = Math.max(...parentTheme.themeToCitationLinks.map(link => link.themeToCitation.sequence)) + 1;
          }   

          this.bibleService.createCitation("", activeThemeId, sequence, scriptures)
            .then(result => {
                BibleThemeTreeComponent.refreshDomNodeFromDb(`theme${parentTheme.id}`);
                let theme = BibleThemeTreeComponent.getDomNode(`theme${parentTheme.id}`) as JstreeModel;
                BibleThemeTreeComponent.openDomThemeNode(theme);
                let citationNode = BibleThemeTreeComponent.getDomNode(`citation${result.themeToCitation.id}`) as JstreeModel;
                BibleThemeTreeComponent.ActiveCitationSelector.next(citationNode);
            });
        });
    },
    canExportSelected():boolean { return true; },
    exportSelected(searchResults:WritableSignal<any>, context:any):void {
      $(".command-message").removeClass('warning').text('').hide(100);
      let selected = $("tbody > tr[aria-checked=true]");
      let forExport = [];
      if (selected.length > 0) {
        for (let i = 0; i < selected.length; i++) {
          let scripture = selected[i];
          for (let j = 0; j < searchResults().length; j++) {
            if (searchResults()[j].id == scripture.accessKey) {
              forExport.push(searchResults()[j]);
              break;
            }
          }
        }
      }
      else {
        for (let j = 0; j < searchResults().length; j++) {
          forExport.push(searchResults()[j]);
        }
      }

      context.searchResults = forExport;
      context.showSearchScriptureReport = true;
    }
  };

  constructor(public router:Router) {
    const bibleService = inject(BibleService);
    this.service = new ServiceDirective(bibleService);
    this.context = { router: router };
  }

  @Input()
  activeType!:number;

  automodified = false;

  onChange(event:any) {
    const newValue = (event.target as HTMLInputElement).value;
    if (!newValue) {
      $("#command-wordlist").hide(100);
    }
    else {
      $(".command-message").removeClass('warning').text('').hide(100);
      const pattern = /.*?([a-z0-9]+)$/i;
      let change = newValue.replace(pattern, "$1");
      this.suggestions = wordList.wordList.filter(word => word.startsWith(change.toLowerCase()));
      if (this.suggestions.length > 0 && !this.automodified) {
        $("#command-wordlist").show(100);
      }
      else {
        $("#command-wordlist").hide(100);
      }
    }
  }

  onHoverLi(event:any) {
    $(event.target).addClass("hover");
  }

  onNormalLi(event:any) {
    $(event.target).removeClass("hover");
  }
  public onClickSuggestion(text:string):void {
    $(".command-message").removeClass('warning').text('').hide(100);
    const pattern = /^(.*?)[a-z0-9]*$/i;
    let searchString = $("input[type=text].search-string");
    let command = <string>searchString.val();
    command = command.replace(pattern, "$1") + text + " ";
    this.automodified = true;
    $("#command-wordlist").hide();
    searchString.val(command);
    searchString.trigger('focus');
    this.automodified = false;
    this.searchResults.set([]);
  }

  public toggleSelected(item:any) {
    $(".command-message").removeClass('warning').text('').hide(100);
    this.searchResults.update(items =>
      items.map(i =>
        i === item ? { ...i, selected: !i.selected } : i
      )
    );
  }

  public showModalContextMenu(event:MouseEvent) {
    event.preventDefault();
    $(".command-message").removeClass('warning').text('').hide(100);
    SearchContextMenuComponent.showContextMenu(this.searchResults, this.context);
    let contextMenu = $("app-search-context-menu");
    contextMenu.removeClass("hidden");
  }

  deleteSelectedItems() {
    let scriptureIds = <number[]>[];
    let indexToRemove = <number[]>[];
    
    $("tbody tr[aria-checked=true]").each((i, element) => { scriptureIds.push(<number><unknown>$(element).attr('accessKey')); });

    for (let i=0; i<scriptureIds.length; i++) {
      for (let j=0; j<this.searchResults().length; j++) {
        if (scriptureIds[i] == this.searchResults()[j].id) {
          indexToRemove.push(j);
        }
      }
    }

    while(indexToRemove.length > 0) {
      let index = indexToRemove.pop()!;
      this.searchResults.set(this.searchResults().splice(index, 1));
    }
  }

  public runSearch(event:any) {
    $(".command-message").removeClass('warning').text('').hide(100);
    this.searchCommand = (<string>$("input[type=text].search-string").val()).trim();
    if (!this.searchCommand) {
      $("div.command-message").text("Please enter a search string").show(500);
    }
    else {
      $("div.command-message").text("").hide(500);
      $("#command-wordlist").hide(100);
      $("div.search-results tbody").hide(500);
      $("div.settings.settings-active").removeClass("settings-active");

      let pattern:RegExp|null = null;
      if (this.activeType === 1) {
        $("div.await").show();
        try {
          pattern = new RegExp(this.searchCommand, "ig");
        }
        catch (e){
          console.log(`regex exception: ${(<Error>e).message}`);
         }

        if (pattern) {
          this.service.processSearchContains(this.searchCommand.replace("\\", "\\\\"), (data:ScriptureSearchResultModel[]) => {
            if (data.length == this.searchOverflow) {
              data.pop();
              $("div.command-message").addClass("warning").text(`Your search returned more than ${this.searchOverflow - 1} results. Please refine your search to see more specific results.`).show(500);
            }

            this.searchResults.set(data);
            this.processScriptureSearchResults(<RegExp>pattern);
          });
        }
        else {
          $("div.command-message").removeClass("warning").text("The search string value is an invalid regex expression.").show(100);
          $("div.await").hide();
        }
      }

      if (this.activeType === 2) {
        // Search with wildcards:
        //  % means any string of zero or more characters, regex .*
        //  _ means any single character, regex .
        $("div.await").show();
        try {
          pattern = new RegExp(
            this.searchCommand
              .replaceAll(".", "\\.")
              .replaceAll("?", "\\?")
              .replaceAll("(", "\\(")
              .replaceAll("%", ".*?")
              .replaceAll("_", "."),
            "ig"
          );
        }
        catch (e) {
          console.log(`regex exception: ${(<Error>e).message}`);
        }
      
        if (pattern) {
          this.service.processSearchLike(this.searchCommand, (data:ScriptureSearchResultModel[]) => {
            if (data.length == this.searchOverflow) {
              data.pop();
              $("div.command-message").addClass("warning").text(`Your search returned more than ${this.searchOverflow - 1} results. Please refine your search to see more specific results.`).show(500);
            }

            this.searchResults.set(data);
            this.processScriptureSearchResults(<RegExp>pattern);
          });
        }
        else {
          $("div.command-message").removeClass("warning").text("The search string value contains an invalid character").show(100);
          $("div.await").hide();
        }
      }
    }
  }

  processScriptureSearchResults(pattern:RegExp) {
    for (let i=0; i<Math.min(this.searchResults().length, 400); i++) {
      let prevMatch = <RegExpExecArray>pattern.exec(this.searchResults()[i].text);
      let substrings = <any[]>[];

      if (prevMatch.index > 0) {
        substrings.push({
          text: this.searchResults()[i].text.substring(0, prevMatch.index),
          match: false
        });
      }

      while(true) {
        substrings.push({
          text: prevMatch[0],
          match: true
        });

        let endMatch = prevMatch.index + prevMatch[0].length;
        if (endMatch === this.searchResults()[i].text.length) {
          break;
        }

        prevMatch = <RegExpExecArray>pattern.exec(this.searchResults()[i].text);
        if (prevMatch) {
          substrings.push({
            text: this.searchResults()[i].text.substring(endMatch, prevMatch.index),
            match: false
          });
        }
        else {
          substrings.push({
            text: this.searchResults()[i].text.substring(endMatch, this.searchResults()[i].text.length),
            match: false
          });

          this.searchResults()[i].substrings = substrings;
          this.searchResults()[i].citationLabel = this.getCitationLabel(this.searchResults()[i]);
          this.searchResults()[i].selected = false;

          break;
        }
      }
    }

    $("div.await").hide();
    $("div.search-results tbody").show(100);

    if (!this.isSubscribedKeystrokes) {
      MainShellComponent.keystrokeBroadcaster.subscribe(event => {
        this.isSubscribedKeystrokes = true;

        if (event.target.localName === "body") {
          if (event.key === "Delete") {
            console.log("Delete selected items");
            this.deleteSelectedItems();
          }
          else if (event.key === "z" && event.ctrlKey) {
            console.log("Undo");
          }
          else if (event.key === "y" && event.ctrlKey) {
            console.log("Redo");
          }
        }
      });
    }
  }

  getCitationLabel(result: ScriptureSearchResultModel) {
    let isSingleChapterBook = result.book.match(/Obadiah|Philemon|2 John|3 John|Jude/);
    if (isSingleChapterBook) {
      return `${result.book} ${result.verse}`;
    }
    
    return `${result.book} ${result.chapter}:${result.verse}`;
  }

  wordList:string[] = <string[]>[];

  ngOnInit():void {
    SearchScriptureComponent.isActive = true;
    if (!SearchScriptureComponent.isSubscribed) {
      MainShellComponent.mouseupBroadcaster.subscribe(event => {
        if (SearchScriptureComponent.isActive) {
          let context = $("app-search-context-menu");
          context.addClass("hidden");
        }
      });
    }
  }

  ngOnDestroy():void {
    SearchScriptureComponent.isActive = false;
  }
}

@Directive()
export class ServiceDirective {
  constructor (provider:BibleService) {
    this.provider = provider;
  }

  provider:BibleService;

  public async processSearchContains(search:string, callback:any) {
    let searchResult = await this.provider.searchScripturesContains(search);
    callback(searchResult);
  }

  public async processSearchLike(search:string, callback:any) {
    let searchResult = await this.provider.searchScripturesLike(search);
    callback(searchResult);
  }
}

