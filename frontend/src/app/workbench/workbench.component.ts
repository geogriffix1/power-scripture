import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from '../app.component';
import { BibleThemeTreeComponent } from '../bible-theme-tree/bible-theme-tree.component';
import { CiteScriptureRangeModel } from '../model/citeScriptureRangeModel';
import { CitationExtendedModel } from '../model/citation.model';
import { CitationVerseExtendedModel } from '../model/citationVerse.model';
import { ScriptureModel } from '../model/scripture.model';
import { JstreeModel } from '../model/jstree.model';

@Component({
    selector: 'app-workbench',
    imports: [RouterOutlet],
    templateUrl: './workbench.component.html',
    styleUrl: './workbench.component.css'
})

export class WorkbenchComponent {

  static activeCitation:JstreeModel;
  static activeTheme:JstreeModel;
  static scriptureRanges: CiteScriptureRangeModel[];
  static activeScriptureRange: string;
  static activeCitationVerse: CitationVerseExtendedModel;
  static WorkbenchResizeBroadcaster:Subject<DOMRectReadOnly>;
  static getWorkbenchSize() {
    let section = $("section.bible-workbench");
    let position = section.position();

    let rect = new DOMRect(position?.left ?? 0, position?.top ?? 0, section.innerWidth(), section.innerHeight());
    return rect;
  }

  static setScriptureRanges(citation: CitationExtendedModel) {
    const unicodeSuperscriptNumbers = [
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

    WorkbenchComponent.scriptureRanges = [];
    console.log("WorkbenchComponent.citation");
    console.log(citation);
    console.log("WorkbenchComponent.citation.verses:");
    console.log(citation.verses);
    const forCitations = <CitationVerseExtendedModel[]>citation?.verses ?? [];
    forCitations.sort((a,b) => a.scripture.bibleOrder - b.scripture.bibleOrder);

    let book = "";
    let chapter = 0;
    let verse = 0;
    let startVerse = 0;
    let endVerse = 0;
    let verses = "";
    let scriptures: ScriptureModel[] = [];

    for (let i=0; i<forCitations.length; i++) {
      let citationId = forCitations[i].citationId;
      let result = forCitations[i].scripture;
      if (
        result.book == book &&
        result.chapter == chapter &&
        result.verse == endVerse + 1) {
          verses = `${verses} ${superscript(result.verse)}${result.text}`;
          scriptures.push(result);
          endVerse++;
      }
      else {
        if (book) {
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
            isOpen: false,
            scriptures: scriptures,
            citationId: citationId
          };

          WorkbenchComponent.scriptureRanges.push(scriptureRange)
        }

        book = result.book;
        chapter = result.chapter;
        verse = result.verse;
        startVerse = result.verse;
        endVerse = result.verse;
        verses = result.text;
        scriptures = [result];
      }
    }

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
  }

  onSearchClick() {
    this.router.navigate(['search']);
  }

  onCreateClick() {
    this.router.navigate(['create']);
  }

  onEditClick() {
    console.log("edit clicked!");
    AppComponent.editObject = undefined;
    this.router.navigate(['edit']);
  }

  onDeleteClick() {
    console.log("onDeleteClick");
    AppComponent.editObject = undefined;
    this.router.navigate(['delete']);
  }


  resizeObserver = new ResizeObserver(elements => {
    let element = elements[0];
      WorkbenchComponent.WorkbenchResizeBroadcaster.next(element.contentRect);
  });

  ngAfterViewInit() {
    WorkbenchComponent.WorkbenchResizeBroadcaster = new Subject<DOMRectReadOnly>;
    this.resizeObserver.observe($("section.bible-workbench")[0]);

    BibleThemeTreeComponent.ActiveCitationSelector.subscribe((citation:JstreeModel) => {
      WorkbenchComponent.activeCitation = citation;
      console.log("In WorkbenchComponent, activeCitation:");
      console.log(WorkbenchComponent.activeCitation);
    });

    BibleThemeTreeComponent.ActiveThemeSelector.subscribe((theme:JstreeModel) => {
      WorkbenchComponent.activeTheme = theme;
    });
  }

  ngOnDestroy() {
    BibleThemeTreeComponent.ActiveCitationSelector.unsubscribe();
    BibleThemeTreeComponent.ActiveThemeSelector.unsubscribe();
  }

  constructor(private router:Router) {}
}