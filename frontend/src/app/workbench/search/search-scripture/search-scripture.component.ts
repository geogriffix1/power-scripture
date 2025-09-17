import { Component, Directive, Input, HostListener, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { BibleService } from '../../../bible.service';
import { Router } from '@angular/router';
import { ScriptureModel, ScriptureSearchResultModel } from '../../../model/scripture.model';
import { CiteScriptureRangeModel } from '../../../model/citeScriptureRangeModel';
import { SearchContextMenuComponent } from '../../../context-menu/search-context-menu.component';
import { SearchScriptureReportComponent } from '../../../reports/search-scripture-report/search-scripture-report.component';
import { AppComponent } from '../../../app.component';
import { WorkbenchComponent } from '../../workbench.component';
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
  suggestions:string[] = [];
  context:any = {
    showSearchScriptureReport: Boolean
  };
  selectedEntry: any = [];
  searchCommand = "";
  searchResultsHeight!:number;
  searchResults:ScriptureSearchResultModel[] = [];
  isSubscribedKeystrokes = false;
  callbacks = {
    canSelectAll():boolean { return true; },
    selectAll():void {
      $("tbody > tr[aria-checked=false]").attr('aria-checked', 'true');
    },
    canDeselectAll():boolean { return true; },
    deselectAll():void {
      $("tbody > tr[aria-checked=true]").attr('aria-checked', 'false');
    },
    canRemoveSelected():boolean { return true; },
    removeSelected(searchResults:any[]):void {
      let selected = $("tbody > tr[aria-checked=true]");
      for (let i = 0; i < selected.length; i++) {
        let scripture = selected[i];
         for (let j = 0; j < searchResults.length; j++) {
          if (searchResults[j].id == scripture.accessKey) {
            searchResults.splice(j, 1);
            break;
          }
        }
      };
    },
    canCreateCitation():boolean { return true; },
    createCitation(searchResults:any, context:any):void {
      console.log("create citation context menu action");
      let unicodeSuperscriptNumbers = [
        "\u2070",
        "\u00B9",
        "\u00B2",
        "\u00B3",
        "\u2074",
        "\u2075",
        "\u2076",
        "\u2077",
        "\u2078",
        "\u2079",
      ];

      function superscript(n:number): string {
        let s = n.toString();
        let ss = "";
        for (let i=0; i<s.length; i++) {
          let c = s.charCodeAt(i) - "0".charCodeAt(0);
          ss += unicodeSuperscriptNumbers[c];
        }

        return ss;
      }

      let selected = $("tbody > tr[aria-checked=true]");
      let forCitations = [];
      WorkbenchComponent.scriptureRanges = [];
      if (selected.length > 0) {
        for (let i = 0; i < selected.length; i++) {
          let scripture = selected[i];
          for (let j = 0; j < searchResults.length; j++) {
            if (searchResults[j].id == scripture.accessKey) {
              forCitations.push(searchResults[j]);
              break;
            }
          }
        }
      }
      else {
        for (let j = 0; j < searchResults.length; j++) {
          forCitations.push(searchResults[j]);
        }
      }

      let book = "";
      let chapter = 0;
      let verse = 0;
      let startVerse = 0;
      let endVerse = 0;
      let verses = "";
      let scriptures: ScriptureModel[] = [];

      for (let i=0; i<forCitations.length; i++) {
        let result = forCitations[i];
        if (
          result.book == book &&
          result.chapter == chapter &&
          result.verse == endVerse + 1) {
            verses = `${verses} ${superscript(result.verse)}${result.text}`;
            scriptures.push({
              id: forCitations[i].id,
              book: forCitations[i].book,
              chapter: forCitations[i].chapter,
              verse: forCitations[i].verse,
              text: forCitations[i].text,
              bibleOrder: forCitations[i].bibleOrder
            });
            endVerse++;
        }
        else {
          if (book != "") {
            let isSingleChapterBook = book.match(/Obadiah|Philemon|2 John|3 John|Jude/);
            let firstVerse = `${book} ${chapter}:${startVerse}`;
            if (isSingleChapterBook) {
              firstVerse = `${book} ${startVerse}`;
            }

            let citation = firstVerse;
            if (endVerse > startVerse) {
              citation = `${citation}-${endVerse}`;
            }
            
            let scriptureRange:CiteScriptureRangeModel = {
              citation: citation,
              verses: verses,
              scriptures: scriptures
            };

            WorkbenchComponent.scriptureRanges.push(scriptureRange)
          }

          book = result.book;
          chapter = result.chapter;
          verse = result.verse;
          startVerse = result.verse;
          endVerse = result.verse;
          verses = result.text;
          scriptures = [];
        }
      }

      console.log("Scripture Ranges:")
      console.log(WorkbenchComponent.scriptureRanges);

      if (forCitations.length > 0) {
        let isSingleChapterBook = book.match(/Obadiah|Philemon|2 John|3 John|Jude/);
        let firstVerse = `${book} ${chapter}:${startVerse}`;
        if (isSingleChapterBook) {
          firstVerse = `${book} ${startVerse}`;
        }

        let citation = firstVerse;
        if (endVerse > startVerse) {
          citation = `${citation}-${endVerse}`;
        }
        
        let scriptureRange:CiteScriptureRangeModel = {
          citation: citation,
          verses: verses,
          scriptures: scriptures
        };

        WorkbenchComponent.scriptureRanges.push(scriptureRange)
      }

      context.searchResults = WorkbenchComponent.scriptureRanges;
      console.log("Navigating to /create/citation");
      context.router.navigate(['/create/citation']);     
    },
    canExportSelected():boolean { return true; },
    exportSelected(searchResults:any, context:any):void {
      let selected = $("tbody > tr[aria-checked=true]");
      let forExport = [];
      if (selected.length > 0) {
        for (let i = 0; i < selected.length; i++) {
          let scripture = selected[i];
          for (let j = 0; j < searchResults.length; j++) {
            if (searchResults[j].id == scripture.accessKey) {
              forExport.push(searchResults[j]);
              break;
            }
          }
        }
      }
      else {
        for (let j = 0; j < searchResults.length; j++) {
          forExport.push(searchResults[j]);
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

  ngAfterViewInit() {
    if (!SearchScriptureComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster.subscribe((rect:DOMRectReadOnly) => {
        if (SearchScriptureComponent.isActive) {
          let commandWidth = rect.width;
          $("#search-scripture-command").width(commandWidth - 60);
          let viewTop = $("as-split-area.workbench").offset()!.top;
          let viewHeight = <number>$("as-split-area.workbench").innerHeight();
          let resultsTop = $("section.scrollable-content").offset()!.top;
          console.log(`results top: ${resultsTop}`);
          this.searchResultsHeight = viewHeight - resultsTop + viewTop;
          //this.searchResultsHeight = viewHeight + viewTop;
          $("div.search-results").css("height", this.searchResultsHeight + "px");
        }
      });
    }

    SearchScriptureComponent.isSubscribed = true;
  }

  @Input()
  activeType!:number;

  automodified = false;

  onChange(event:any) {
    const newValue = (event.target as HTMLInputElement).value;
    if (!newValue) {
      $("#command-wordlist").hide();
    }
    else {
      $("div.command-message").text("").hide(100);
      console.log(`newValue: ${newValue}`);
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
    const pattern = /^(.*?)[a-z0-9]*$/i;
    let commandLine = $("input[type=text].command-line");
    let command = <string>commandLine.val();
    command = command.replace(pattern, "$1") + text + " ";
    this.automodified = true;
    $("#command-wordlist").hide();
    commandLine.val(command);
    commandLine.trigger('focus');
    this.automodified = false;
  }

  public onSelectItemClick(accessKey:any) {
    let checked = $(`tr[accessKey=${accessKey}]`).attr("aria-checked");
    $(`tr[accessKey=${accessKey}]`).attr("aria-checked", checked === "false" ? "true" : "false");
  }

   public onScroll(scroll:any) {
    let scrollTop = scroll.target.scrollTop;
  }

  // public showContextMenu(accessKey:any, event:MouseEvent) {
  //    console.log("showContextMenu event:");
  //   // console.log(event);
  //   event.preventDefault();

  //   SearchContextMenuComponent.showContextMenu(accessKey, this.searchResults);
  //   console.log("after show context menu");
  //   this.selectedEntry = accessKey;

  //   let domRow = $(`tr[accesskey=${accessKey}]`);
  //   let context = $("app-search-context-menu");
  
  //   let right = domRow.innerWidth()!;
  //   let bottom = domRow.innerHeight()!;
  //   let contextTop = bottom;
  //   domRow.append(context);

  //   let contextLeft = right - context.innerWidth()!;

  //   context.css({
  //     position: "absolute",
  //     top: contextTop + "px",
  //     left: contextLeft + "px",
  //     display: "block",
  //     zIndex: 1
  //   });

  //   $("div.context-menu.hidden").removeClass("hidden");
  // }

  public showModalContextMenu(event:MouseEvent) {
    //console.log("showModalContextMenu");
    event.preventDefault();
    SearchContextMenuComponent.showContextMenu(this.searchResults, this.context);
    let contextMenu = $("app-search-context-menu");
    contextMenu.removeClass("hidden");
  }

  deleteSelectedItems() {
    let scriptureIds = <number[]>[];
    let indexToRemove = <number[]>[];
    
    $("tbody tr[aria-checked=true]").each((i, element) => { scriptureIds.push(<number><unknown>$(element).attr('accessKey')); });

    for (let i=0; i<scriptureIds.length; i++) {
      for (let j=0; j<this.searchResults.length; j++) {
        if (scriptureIds[i] == this.searchResults[j].id) {
          indexToRemove.push(j);
        }
      }
    }

    while(indexToRemove.length > 0) {
      let index = indexToRemove.pop()!;
      this.searchResults.splice(index, 1);
    }
  }

  public runSearch(event:any) {
    console.log("runSearch");
    this.searchCommand = (<string>$("input[type=text].command-line").val()).trim();
    if (!this.searchCommand) {
      $("div.command-message").text("Please enter a search command").show(100);
    }
    else {
      $("div.command-message").text("").hide(100);
      $("#command-wordlist").hide(100);
      $("div.search-results tbody").hide(100);
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
            this.searchResults = data;
            this.processScriptureSearchResults(<RegExp>pattern);
          });
        }
        else {
          $("div.command-message").text("The search string value is an invalid regex expression.").show(100);
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
          console.log(`pattern=${pattern}`);
          this.service.processSearchLike(this.searchCommand, (data:ScriptureSearchResultModel[]) => {
            this.searchResults = data;
            this.processScriptureSearchResults(<RegExp>pattern);
          });
        }
        else {
          $("div.command-message").text("The search string value contains an invalid character").show(100);
          $("div.await").hide();
        }
      }
    }
  }

  processScriptureSearchResults(pattern:RegExp) {
    for (let i=0; i<Math.min(this.searchResults.length, 400); i++) {
      console.log(`pattern: ${pattern}`);
      console.log(`searchResults text: ${this.searchResults[i].text}`);
      let prevMatch = <RegExpExecArray>pattern.exec(this.searchResults[i].text);
      // console.log(prevMatch);
      let substrings = <any[]>[];

      if (prevMatch.index > 0) {
        substrings.push({
          text: this.searchResults[i].text.substring(0, prevMatch.index),
          match: false
        });
      }

      while(true) {
        substrings.push({
          text: prevMatch[0],
          match: true
        });

        let endMatch = prevMatch.index + prevMatch[0].length;
        if (endMatch === this.searchResults[i].text.length) {
          break;
        }

        prevMatch = <RegExpExecArray>pattern.exec(this.searchResults[i].text);
        if (prevMatch) {
          substrings.push({
            text: this.searchResults[i].text.substring(endMatch, prevMatch.index),
            match: false
          });
        }
        else {
          substrings.push({
            text: this.searchResults[i].text.substring(endMatch, this.searchResults[i].text.length),
            match: false
          });

          this.searchResults[i].substrings = substrings;

          break;
        }
      }

      console.log(substrings);
    }

    $("div.await").hide();
    $("div.search-results tbody").show(100);

    if (!this.isSubscribedKeystrokes) {
      AppComponent.keystrokeBroadcaster.subscribe(event => {
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

  wordList:string[] = <string[]>[];

  ngOnInit():void {
    //this.onResize(null);
    SearchScriptureComponent.isActive = true;
    if (!SearchScriptureComponent.isSubscribed) {
      AppComponent.mouseupBroadcaster.subscribe(event => {
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
    console.log("serviceDirective initializer");
    this.provider = provider;
  }

  provider:BibleService;

  public async processSearchContains(search:string, callback:any) {
    console.log("processing search contains");    
    console.log(`service directive search=${search}`);

    let searchResult = await this.provider.searchScripturesContains(search);
    console.log(searchResult);
    callback(searchResult);
  }

  public async processSearchLike(search:string, callback:any) {
    console.log("processing search like");
    console.log(`service directive search= ${search}`);
    let searchResult = await this.provider.searchScripturesLike(search);
    console.log(searchResult);
    callback(searchResult);
  }
}

