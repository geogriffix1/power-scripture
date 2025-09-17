import { Component, Directive, Input, HostListener, OnInit, OnDestroy, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { NgStyle } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BibleService } from '../../../bible.service';
import { ScriptureModel, ScriptureSearchResultModel } from '../../../model/scripture.model';
import { CiteScriptureRangeModel } from '../../../model/citeScriptureRangeModel';
import { CiteContextMenuComponent } from '../../../context-menu/cite-context-menu.component';
import { SearchScriptureReportComponent } from '../../../reports/search-scripture-report/search-scripture-report.component';
import { AppComponent } from '../../../app.component';
import { WorkbenchComponent } from '../../workbench.component';
import * as BibleBookList from './BibleBookList.json';
import $ from 'jquery';

@Component({
    selector: 'app-scripture-range-editor',
    imports: [NgStyle],
    templateUrl: './scripture-range-editor.component.html',
    styleUrl: './scripture-range-editor.component.css'
})
export class ScriptureRangeEditorComponent {
  @ViewChild('book', { static: true }) bookField!: ElementRef;
  @ViewChild('chapter', { static: true }) chapterField!: ElementRef;
  @ViewChild('verse', { static: true }) verseField!: ElementRef;
  @ViewChild('endVerse', { static: true }) endVerseField!: ElementRef;


  unicodeSuperscriptNumbers = [
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

  static isActive = false;
  static isSubscribed = false;
  isChapterDisabled:boolean = true;
  isVerseDisabled:boolean = true;
  isEndVerseDisabled:boolean = true;

  bookList:any[] = BibleBookList.books;
  context:any = {
    showCiteScriptureReport: Boolean
  };

  createCitation = false;

  chapterMasterList:number[] = [];
  chapterList:number[] = [];
  verseMasterList:number[] = [];
  verseList:number[] = [];
  endVerseMasterList:number[] = [];
  endVerseList:number[] = [];

  scriptureRanges:CiteScriptureRangeModel[] = [];
  selectedEntry: any = [];
  sectionWidth!:number;
  sectionHeight!:number;
  widthBook!:string;
  widthChapter!:string;
  widthDescription!:number;

  activeBook!:any;
  activeChapter!:any;
  activeVerse!:any;
  activeEndVerse!:any;
  workingBook:string = "";
  workingText:string = "";
  afterRenderAction:string = "";

  bookFieldKeyupSubscription!:Subscription;
  chapterFieldKeyupSubscription!:Subscription;
  verseFieldKeyupSubscription!:Subscription;
  endVerseFieldKeyupSubscription!:Subscription;

  constructor(public router:Router, public activatedRoute: ActivatedRoute) {
    this.context = { };
    this.createCitation = (this.activatedRoute.snapshot.routeConfig?.path ?? "") == "create/citation";
  }

  CreateCitation() {
    $("div.command-message").text("").hide(100);    
    console.log("Create Citation Clicked");
    console.log(this.scriptureRanges);
    if (!this.scriptureRanges || this.scriptureRanges.length == 0) {
      $("div.command-message").text("Citation not created - No scriptures have been selected").show(100);
      return;
    }

    if (!WorkbenchComponent.activeTheme) {
      $("div.command-message").text("Citation not created - Must select a parent Theme").show(100);
      return;
    }

    let description = <string>$("#description").val();
    console.log(description);
    console.log(`activeThemeId: ${WorkbenchComponent.activeTheme.id}`);
    let parentThemeId = <number><unknown>WorkbenchComponent.activeTheme.id.replace(/theme(\d+)/, "$1");
    console.log(`parentThemeId: ${parentThemeId}`)
    let service = new BibleService;
    let scriptures:number[] = [];
    for (let i = 0; i < this.scriptureRanges.length; i++) {
      for (let j = 0; j < this.scriptureRanges[i].scriptures.length; j++) {
        let scripture = this.scriptureRanges[i].scriptures[j];
        console.log(`${scripture.id} - ${scripture.book} ${scripture.chapter}:${scripture.verse}`)
        scriptures.push(scripture.id);
      }
    }
    service.createCitation(description, parentThemeId, scriptures);
    $('#theme-tree-full').jstree('refresh');

    console.log("activeTheme:");
    console.log(WorkbenchComponent.activeTheme);
  }

  callbacks = {
    canSelectAll() { return true; },
    selectAll() {
      $("tbody > tr[aria-checked=false]").attr('aria-checked', 'true');
    },
    canDeselectAll() { return true; },
    deselectAll() {
      $("tbody > tr[aria-checked=true]").attr('aria-checked', 'false');
    },
    canRemoveSelected() { return true; },
    removeSelected(citations:any[]) {
      let toRemove = <number[]>[];
      let selected = $("tbody > tr[aria-checked=true]");
      for (let i = 0; i < selected.length; i++) {
        let key = +selected[i].id.replace("range_", "");
        toRemove.push(key);
      }

      while(toRemove.length > 0) {
        let key = toRemove.pop();
        citations.splice(key!, 1);
      }
    },
    canSaveCitation() { return true; },
    saveCitation(citations:CiteScriptureRangeModel[], router:Router) {
      WorkbenchComponent.scriptureRanges = [];
      for (let i = 0; i < citations.length; i++) {
        WorkbenchComponent.scriptureRanges.push(citations[i]);
      }

      citations = [];
      console.log("save citation");
      console.log(`is router null? ${!router}`);
      router.navigate(['/create/citation']);
    },
    canExportSelected(citations:any) { return true; },
    exportSelected(citations:any, context:any) {
      console.log("export selected");
      let selected = $("tbody > tr[aria-checked=true]");
      if (selected.length == 0) {
        console.log(`all ${citations.length} citations selected`);
        context.citations = citations;
      }
      else {
        context.citations = [];
        console.log()
        for (let i=0; i < selected.length; i++) {
          let key = +selected[i].id.replace("range_", "");
          console.log(`selecting citations[${key}]`);
          context.citations.push(citations[key]);
        }
      }

      context.showCiteScriptureReport = true;
    }
  };

  workbenchDomRect(rect:DOMRectReadOnly) {
    this.sectionWidth = rect.width;
    this.sectionHeight = rect.height;
    this.widthBook = `${Math.floor((rect.width - 24) / 2.5)}px`;
    this.widthChapter = `${Math.floor((rect.width - 24) / 5.0)}px`;
    this.widthDescription = 90; //rect.width - 20;
  }

  onHoverLi(event:any) {
    $(event.target).addClass("hover");
  }

  onNormalLi(event:any) {
    $(event.target).removeClass("hover");
  }

  onHoverImg(event:any) {
    $(event.target).addClass("hover")
  }

  onNormalImg(event:any) {
    $(event.target).removeClass("hover");
  }

  onClickCitation(event:any) {
    let row = $(event.target.parentElement);
    let ariaChecked = row.attr('aria-checked') ?? "false";
    let ariaCheckedBool = ariaChecked === "false";
    row.attr('aria-checked', ariaCheckedBool.toString());
    console.log(row);
  }

  runAdd() {
    console.log("runAdd()");
    if ($("#endVerse.legal").length > 0) {
      $("div.command-message").text('').hide(100);
      (async () => {
        console.log(`book: (innerText=${this.bookField.nativeElement.value})`);
        console.log(this.bookField.nativeElement);
        let cite = `${this.bookField.nativeElement.value} ` + 
          `${this.chapterField.nativeElement.value}:` +
          `${this.verseField.nativeElement.value}`;
        
        if (this.endVerseField.nativeElement.innerText != this.verseField.nativeElement.value) {
          cite = `${cite}-${this.endVerseField.nativeElement.value}`;
        }

        let bibleService = new BibleService;
        let scriptures = await bibleService.citeScriptures(cite);
        let pattern = /Obadiah|Philemon|2 John|3 John|Jude/
        let isSingleChapterBook = scriptures[0].book.match(pattern);
        let citation = `${scriptures[0].book} ${scriptures[0].chapter}:${scriptures[0].verse}`;
        if (isSingleChapterBook) {
          citation = `${scriptures[0].book} ${scriptures[0].verse}`;
        }

        let scriptureText = scriptures[0].text;

        if (scriptures.length > 1) {
          citation = `${citation}-${scriptures[scriptures.length - 1].verse}`;
          for (let i = 1; i < scriptures.length; i++) {
            let verseNumber = scriptures[i].verse;
            let prefix = this.superscript(verseNumber);
            scriptureText = `${scriptureText} ${prefix}${scriptures[i].text}`;
          }
        }

        let scriptureRange:CiteScriptureRangeModel = {
          citation: citation,
          verses: scriptureText,
          scriptures: scriptures
       };

       this.scriptureRanges.push(scriptureRange);
       $(".command input[type=text]").val('').removeClass('legal');
       this.isChapterDisabled = true;
       this.isVerseDisabled = true;
       this.isEndVerseDisabled = true;
      })();
    }
    else {
      $("div.command-message").text("Please complete the verse range.").show(100);
      console.log("not legal");
    }
  }

  superscript(n:number): string {
    let s = n.toString();
    let ss = "";
    for (let i=0; i<s.length; i++) {
      let c = s.charCodeAt(i) - "0".charCodeAt(0);
      ss += this.unicodeSuperscriptNumbers[c];
    }

    return ss;
  }

  public showModalContextMenu(event:MouseEvent) {
    console.log("showModalContextMenu");
    event.preventDefault();
    CiteContextMenuComponent.showContextMenu(this.scriptureRanges, this.context, this.router);
    let context = $("app-cite-context-menu");
    context.removeClass("hidden");
  }

  onFocusBook() {
    if (!$("#book").val()) {
      $("div.command-message").text('').hide(100);
      this.activeBook = null;
      this.bookList = BibleBookList.books;
      $("#chapterlist,#verselist,#endverselist").hide(100);
      $("#booklist").show(100);
      this.isChapterDisabled = true;
      this.isVerseDisabled = true;
      this.isEndVerseDisabled = true;
      this.workingBook = "";
    }
    else {
      let workingBook = <string><unknown>$("#book").val();
      let tempList:any[] = [];
      BibleBookList.books.map(book => {
        if (book.book.replaceAll(" ", "").toLowerCase().startsWith(workingBook.replaceAll(" ", "").toLowerCase())) {
          tempList.push(book);
        }
      });

      this.bookList = tempList;
      console.log("show booklist");
      $("#chapterlist,#verselist,#endverselist").hide(100);
      $("#booklist").show(100);
   }
  }

  onClickBook(book:string):void {
    $("div.command-message").text('').hide(100);
    $("#book").val(book).addClass("legal");
    $("#booklist").hide(100);
    this.activeBook = this.bookList.find(bk => bk.book == book);
    this.loadChapterList();
    this.isChapterDisabled = false;
    this.isVerseDisabled = true;
    this.isEndVerseDisabled = true;
    $("#verse,#endverse").val('');
    setTimeout(() => {
      this.chapterField.nativeElement.focus();
    }, 0);
  }

  loadChapterList() {
    let tempList:number[] = [];
    this.chapterMasterList = [];
    for (let i = 1; i <= this.activeBook!.chapterCount; i++) {
      tempList.push(i);
      this.chapterMasterList.push(i);
    } 

    this.chapterList = tempList;
  }

  onChangeBook(book:string) {
    let checkbook = book.replaceAll(" ", "").toLowerCase();
    let newBookList:any[] = [];
    let isLegal = false;
    let isMatch = false;
    let matchbook:any = null;

    for (let i = 0; i < BibleBookList.books.length; i++) {
      let selectBook:string = BibleBookList.books[i].book;
      let againstBook:string = selectBook.replaceAll(" ", "").toLowerCase();
      if (againstBook === checkbook) {
        if (!newBookList.find(book => book.book === selectBook)) {
          newBookList.push(BibleBookList.books[i]);
        }

        isLegal = true;
        isMatch = true;
        matchbook = BibleBookList.books[i];
      }
      else if(againstBook.startsWith(checkbook)) {
        if (!newBookList.find(book => book.book === selectBook)) {
          newBookList.push(BibleBookList.books[i]);
        }

        isLegal = true;
      }
    }

    this.bookList = newBookList;
    return {isLegal: isLegal, isMatch: isMatch, matchbook: matchbook};
  }

  onFocusChapter() {
    $("div.command-message").text('').hide(100);
    $("#booklist,#verselist,#endverselist").hide(100);
    $("#book").val(this.activeBook.book).addClass("legal");

    if (this.chapterMasterList.length == 1) {
      this.onClickChapter(1);
    }
    else {
      $("#chapterlist").show(100);
      if ($("#verse").val()) {
        this.workingText = <string>$("#verse").val();
      }
      else {
        this.workingText = "";
      }
    }
  }

  onClickChapter(chapter:number) {
    $("div.command-message").text('').hide(100);
    console.log(`onClickChapter chapter: ${chapter}`);
    this.activeChapter = chapter;
    $("#chapter").val(chapter);
    (async () => {
      let provider = new BibleService;
      let max = await provider.getScripturesChapterMaxVerse(this.activeBook.book, chapter);
      console.log(`max: ${max}`);

      let tempList:number[] = [];
      this.verseMasterList = [];
      for (let i = 1; i <= max; i++) {
        this.verseMasterList.push(i);
        tempList.push(i);
      }

      this.verseList = tempList;
      this.isVerseDisabled = false;
      this.isEndVerseDisabled = true;
      setTimeout(() => {
        this.verseField.nativeElement.focus();
      }, 0);
   })();
  }
  
  onFocusVerse() {
    $("div.command-message").text('').hide(100);
    $("#booklist,#chapterlist,#endverselist").hide(100);
    $("#chapter").val(this.activeChapter).removeClass("illegal").addClass("legal");
    $("#verselist").show(100);
    if ($("#verse").val()) {
      this.workingText = <string>$("#verse").val();
    }
    else {
      this.workingText = "";
      this.verseList = this.verseMasterList;
    }
  }

  onClickVerse(verse:number) {
    $("div.command-message").text('').hide(100);
    console.log(`onClickVerse verse: ${verse}`);
    $("#verse").val(verse);
    let tempList:number[] = [];
    for (let i = verse; i <= this.verseList.length; i++) {
      tempList.push(i);
    }
    this.activeVerse = verse;
    this.endVerseList = tempList;
    this.isEndVerseDisabled = false;

    console.log("show endverselist");
    $("#booklist,#chapterlist,#verselist").hide(100);
    $("#endverselist").show(100);
    setTimeout(() => {
      this.endVerseField.nativeElement.focus();      
      this.endVerseField.nativeElement.select();
    }, 0);
    //$("#endVerse").trigger('focus');
}

  onFocusEndVerse() {
    $("div.command-message").text('').hide(100);
    $("#booklist,#chapterlist,#verselist").hide(100);
    $("#verse").val(this.activeVerse).addClass('legal');
    $("#endverselist").show(100);
    if ($("#endVerse").val()) {
      this.workingText = <string>$("#endVerse").val();
    }
    else {
      $("#endVerse").val(<string>$("#verse").val());
      this.workingText = <string>$("#verse").val();
    }
    
    $("#endVerse").addClass('legal');
  }

  onClickEndVerse(endVerse:number) {
    $("div.command-message").text('').hide(100);
    $("#booklist,#chapterlist,#verselist,#endverselist").hide();
    $("#endVerse").val(endVerse).addClass("legal");
    this.activeEndVerse = endVerse;
    this.runAdd();
  }

  onChangeChapter(chapter:string) {
    let newChapterList:any[] = [];
    let isLegal = false;
    let isMatch = false;
    let matchchapter:any = null;

    for (let i = 0; i < this.chapterMasterList.length; i++) {
      let selectChapter:string = '' + this.chapterMasterList[i];
      let againstChapter:string = selectChapter.replaceAll(" ", "").toLowerCase();
      if (againstChapter === chapter) {
        if (!newChapterList.find(chapter => ('' + chapter) == selectChapter)) {
          newChapterList.push(this.chapterMasterList[i]);
        }

        isLegal = true;
        isMatch = true;
        matchchapter = this.chapterMasterList[i];
      }
      else if(againstChapter.startsWith(chapter)) {
        if (!newChapterList.find(chapter => chapter === selectChapter)) {
          newChapterList.push(this.chapterMasterList[i]);
        }

        isLegal = true;
      }
    }

    this.chapterList = newChapterList;
    return {isLegal: isLegal, isMatch: isMatch, matchchapter: matchchapter};
  }

  onChangeVerse(verse:string) {
    let newVerseList:any[] = [];
    let isLegal = false;
    let isMatch = false;
    let matchverse:any = null;

    for (let i = 0; i < this.verseMasterList.length; i++) {
      let selectVerse:string = '' + this.verseMasterList[i];
      let againstVerse:string = selectVerse.replaceAll(" ", "").toLowerCase();
      if (againstVerse === verse) {
        if (!newVerseList.find(verse => ('' + verse) == selectVerse)) {
          newVerseList.push(this.verseMasterList[i]);
        }

        isLegal = true;
        isMatch = true;
        matchverse = this.verseMasterList[i];
      }
      else if(againstVerse.startsWith(verse)) {
        if (!newVerseList.find(verse => verse === selectVerse)) {
          newVerseList.push(this.verseMasterList[i]);
        }

        isLegal = true;
      }
    }

    this.verseList = newVerseList;
    return {isLegal: isLegal, isMatch: isMatch, matchverse: matchverse};
  }
  onChangeEndVerse(endVerse:string) {
    let newEndVerseList:any[] = [];
    let isLegal = false;
    let isMatch = false;
    let matchendverse:any = null;
    let startVerse:number = +this.activeVerse;

    for (let i = 0; i < this.verseMasterList.length - startVerse; i++) {
      let selectVerse:string = '' + this.verseMasterList[i];
      let againstVerse:string = selectVerse.replaceAll(" ", "").toLowerCase();
      if (againstVerse === endVerse) {
        if (!newEndVerseList.find(verse => ('' + verse) == selectVerse)) {
          newEndVerseList.push(this.verseMasterList[i]);
        }

        isLegal = true;
        isMatch = true;
        matchendverse = this.verseMasterList[i];
      }
      else if(againstVerse.startsWith(endVerse)) {
        if (!newEndVerseList.find(verse => verse === selectVerse)) {
          newEndVerseList.push(this.verseMasterList[i]);
        }

        isLegal = true;
      }
    }

    this.endVerseList = newEndVerseList;
    return {isLegal: isLegal, isMatch: isMatch, matchendverse: matchendverse};
  }

  ngOnInit() {
    ScriptureRangeEditorComponent.isActive = true;
    console.log("ScriptureRangeEditorComponent onInit");
    this.scriptureRanges = <CiteScriptureRangeModel[]>[];
    console.log("CiteScriptureComponent - end onInit");
    let rect = WorkbenchComponent.getWorkbenchSize();
    this.workbenchDomRect(rect);

    if (!ScriptureRangeEditorComponent.isSubscribed) {
      AppComponent.mouseupBroadcaster.subscribe(event => {
        if (ScriptureRangeEditorComponent.isActive) {
          console.log("mouse event:");
          let targetId:string = event.target?.id ?? ""
          console.log(`target id: "${targetId}"`);
          if (
            targetId != "book" &&
            targetId != "chapter" &&
            targetId != "verse" &&
            targetId != "endVerse" &&
            targetId != "booklist" &&
            targetId != "chapterlist" &&
            targetId != "verselist" &&
            targetId != "endverselist") {
              $("#booklist,#chapterlist,#verselist,#endverselist").hide(100);
          }

          CiteContextMenuComponent.hide();
        }
      });
    }

    this.scriptureRanges = WorkbenchComponent.scriptureRanges ?? [];
    console.log("routes:");
    console.log(this.router);
  }

  ngAfterViewInit() {
    if (!ScriptureRangeEditorComponent.isSubscribed) {
      WorkbenchComponent.WorkbenchResizeBroadcaster
        .subscribe((rect:DOMRectReadOnly) => {
          if (ScriptureRangeEditorComponent.isActive) {
            this.workbenchDomRect(rect);
            //let commandWidth = 80//rect.width - 20;
            $(".command-label.book,.command.book").css('width', `${this.widthBook}`);
            $("#booklist").css('width', this.widthBook);
            $("#chapterlist,#verselist,#endverselist").css('width', this.widthChapter);
            $(".command-label.chapter,.command-label.verse,.command-label.end-verse").css('width', `${this.widthChapter}`);
            $(".command.chapter,.command.verse,.command.end-verse").css('width', `${this.widthChapter}`);
            
            let viewHeight = <number>$("as-split-area.workbench").innerHeight();
            $("as-split-area.workbench").css("overflow-y", "unset");
            let resultsTop = $("section.scrollable-content").offset()!.top;
            let searchResultsHeight = viewHeight - resultsTop;
            $("div.search-results").css("height", searchResultsHeight + "px");
          }
      });

      ScriptureRangeEditorComponent.isSubscribed = true;
    }

    this.bookFieldKeyupSubscription = fromEvent(this.bookField.nativeElement, 'keyup')
      .subscribe(ev => {
        $("div.command-message").text('').hide(100);
        let event = <KeyboardEvent>ev;
        let element = $("#book");
        let text:string = <string><unknown>element.val();
        let changeTextResult = this.onChangeBook(text);
        if (this.workingBook !== text) {
          this.isChapterDisabled = true;
          this.isVerseDisabled = true;
          this.isEndVerseDisabled = true;
          $("#chapter,#verse,#endVerse").val('');

          if (changeTextResult.isMatch) {
            this.activeBook = changeTextResult.matchbook;
            this.loadChapterList();
            $("#book").addClass("legal").removeClass("illegal");
            this.isChapterDisabled = false;
          }
          else if(changeTextResult.isLegal) {
            $("#book").removeClass("legal").removeClass("illegal");
            this.isChapterDisabled = true;
          }
          else {
            $("#book").removeClass("legal").addClass("illegal");
            this.isChapterDisabled = true;
          }

          this.workingBook = text;
        }
        else if (event.key === "Enter") {
          if (this.bookList.length === 1) {
            this.activeBook = this.bookList[0];
            this.loadChapterList();
            $("#book").addClass("legal").removeClass("illegal").val(this.activeBook.book);
            this.isChapterDisabled = false;
            setTimeout(() => {
              this.chapterField.nativeElement.focus();
            }, 0);
            //$("#chapter").trigger('focus');
          }
          else if (changeTextResult.isMatch) {
            this.isChapterDisabled = false;
            setTimeout(() => {
              this.chapterField.nativeElement.focus();
            },0);
            //$("#chapter").trigger('focus');
          }
        }
      });

    this.chapterFieldKeyupSubscription = fromEvent(this.chapterField.nativeElement, 'keyup')
      .subscribe(ev => {
        $("div.command-message").text('').hide(100);
        console.log("chapter keyup event");
        let event = <KeyboardEvent>ev;
        let element = $("#chapter");
        let elementList = this.chapterList;

        let text = <string>element.val();
        //console.log(`chapter text: ${text}`);
        let changeTextResult = this.onChangeChapter(text);
        if (this.workingText !== text) {
          //console.log('calling onChangeText');
          this.isVerseDisabled = true;
          this.isEndVerseDisabled = true;
          $("#verse,#endVerse").val('');
          //console.log(changeTextResult);
          if (changeTextResult.isMatch) {
            this.activeChapter = changeTextResult.matchchapter;
            (async () => {
              let provider = new BibleService;
              let max = await provider.getScripturesChapterMaxVerse(this.activeBook.book, this.activeChapter);
              console.log(`max: ${max}`);
        
              let tempList:number[] = [];
              for (let i = 1; i <= max; i++) {
                tempList.push(i);
              }

              this.verseMasterList = tempList;
              $("#chapter").addClass("legal").removeClass("illegal").val(this.activeChapter);
              this.isVerseDisabled =  false;
              this.workingText = text;
            })();
          }
          else if(changeTextResult.isLegal) {
            $("#chapter").removeClass("legal").removeClass("illegal");
            this.isVerseDisabled = true;
            this.workingText = text;
          }
          else {
            $("#chapter").removeClass("legal").addClass("illegal");
            this.isVerseDisabled = true;
            this.workingText = text;
          }
        }
        else if (event.key === "Enter") {
          if (elementList.length === 1 || changeTextResult.isMatch) {
            if (elementList.length === 1) {
              this.activeChapter = elementList[0];
            }
            else {
              this.activeChapter = changeTextResult.matchchapter;
            }
            (async () => {
              let provider = new BibleService;
              let max = await provider.getScripturesChapterMaxVerse(this.activeBook.book, this.activeChapter);
              console.log(`max: ${max}`);
        
              let tempList:number[] = [];
              for (let i = 1; i <= max; i++) {
                tempList.push(i);
              }

              this.verseMasterList = tempList;

              $("#chapter").addClass("legal").removeClass("illegal").val(this.activeChapter);
              this.isVerseDisabled = false;
              setTimeout(() => {
                this.verseField.nativeElement.focus();
              },0);
              //$("#verse").trigger('focus');
            })();
          }
        }
      });

    this.verseFieldKeyupSubscription = fromEvent(this.verseField.nativeElement, 'keyup')
      .subscribe(ev => {
        $("div.command-message").text('').hide(100);
        console.log("verse keyup event");
        let event = <KeyboardEvent>ev;
        let element = $("#verse");
        let elementList = this.verseList;

        let text = <string>element.val();
        //console.log(`chapter text: ${text}`);
        let changeTextResult = this.onChangeVerse(text);
        if (this.workingText !== text) {
          //console.log('calling onChangeText');
          this.isEndVerseDisabled = true;
          $("#endVerse").val('');
          //console.log(changeTextResult);
          if (changeTextResult.isMatch) {
            this.activeVerse = changeTextResult.matchverse;
            let tempList:number[] = [];
            for (let i = this.activeVerse; i <= this.verseMasterList.length; i++) {
              tempList.push(i);
            }

            this.endVerseList = tempList;
            $("#verse").addClass("legal").removeClass("illegal").val(this.activeVerse);
            this.isEndVerseDisabled = false;
            this.workingText = text;
          }
          else if(changeTextResult.isLegal) {
            $("#verse").removeClass("legal").removeClass("illegal");
            this.isEndVerseDisabled = true;
            this.workingText = text;
          }
          else {
            $("#verse").removeClass("legal").addClass("illegal");
            this.isEndVerseDisabled = true;
            this.workingText = text;
          }
        }
        else if (event.key === "Enter") {
          console.log("enter!")
          if (elementList.length === 1 || changeTextResult.isMatch) {
            if (elementList.length === 1) {
              console.log("only element in list")
              this.activeVerse = elementList[0];
            }
            else {
              console.log("matching element in list");
              this.activeVerse = changeTextResult.matchverse;
            }

            let tempList:number[] = [];
            for (let i = this.activeVerse; i <= this.verseMasterList.length; i++) {
              tempList.push(i);
            }

            $("#verse").addClass("legal").removeClass("illegal").val(this.activeVerse);
            this.endVerseList = tempList;
            this.isEndVerseDisabled = false;
            setTimeout(() => {
              console.log("triggering focus and select")
              this.endVerseField.nativeElement.focus();
              this.endVerseField.nativeElement.select();
            }, 0);
            //$("#endVerse").trigger('focus');
          }
        }
      });

    this.endVerseFieldKeyupSubscription = fromEvent(this.endVerseField.nativeElement, 'keyup')
      .subscribe(ev => {
        $("div.command-message").text('').hide(100);
        console.log("end-verse field keyup entry");
        let event = <KeyboardEvent>ev;
        let element = $("#endVerse");
        let elementList = this.endVerseList;

        let text = <string>element.val();
        let changeTextResult = this.onChangeEndVerse(text);
        if (this.workingText !== text) {
          if (changeTextResult.isMatch) {
            this.activeEndVerse = changeTextResult.matchendverse;
            $("#endVerse").addClass("legal").removeClass("illegal").val(this.activeEndVerse);
            this.workingText = text;
          }
          else if(changeTextResult.isLegal) {
            $("#endVerse").removeClass("legal").removeClass("illegal");
            this.workingText = text;
          }
          else {
            $("#endVerse").removeClass("legal").addClass("illegal");
            this.workingText = text;
          }
        }
        else if (event.key === "Enter") {
          if (elementList.length === 1 || changeTextResult.isMatch) {
            if (elementList.length === 1) {
              this.activeEndVerse = elementList[0];
            }
            else {
              this.activeEndVerse = changeTextResult.matchendverse;
            }
            this.endVerseField.nativeElement.blur();
            $("#endVerse").addClass("legal").removeClass("illegal").val(this.activeEndVerse);
            $("#endverselist").hide();
            this.runAdd();
          }
        }
      });
  }
  
  ngOnDestroy() {
    console.log("unsubscribing")
    ScriptureRangeEditorComponent.isActive = false;
    if (this.bookFieldKeyupSubscription) {
      this.bookFieldKeyupSubscription.unsubscribe();
      this.chapterFieldKeyupSubscription.unsubscribe();
      this.verseFieldKeyupSubscription.unsubscribe();
      this.endVerseFieldKeyupSubscription.unsubscribe();
    }
  }
}

