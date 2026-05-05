import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MainShellComponent } from '../mainshell/mainshell.component';
import { BibleThemeTreeComponent } from '../bible-theme-tree/bible-theme-tree.component';
import { CiteScriptureRangeModel } from '../model/citeScriptureRangeModel';
import { CitationExtendedModel } from '../model/citation.model';
import { CitationVerseExtendedModel } from '../model/citationVerse.model';
import { ScriptureModel } from '../model/scripture.model';
import { JstreeModel } from '../model/jstree.model';

@Component({
    selector: 'app-workbench',
    templateUrl: './workbench.component.html',
    imports: [RouterOutlet],
    styleUrl: './workbench.component.css'
})

export class WorkbenchComponent {

  static activeCitation:JstreeModel|null = null;
  static activeTheme:JstreeModel|null = null;
  static clipboardNode:JstreeModel;
  static scriptureRanges: CiteScriptureRangeModel[];
  static activeScriptureRange: string;
  static activeCitationVerse: CitationVerseExtendedModel;
  //static WorkbenchResizeBroadcaster:Subject<DOMRectReadOnly>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeTool = signal<string | null>(null);
  helpWindow: any = null;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    )
    .subscribe(() => {
      const activeRoute = this.getDeepestChild(this.route);
      const tool = activeRoute.snapshot.data['activeTool'] ?? null;
      this.activeTool.set(tool);
     });
  }

  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }

    return route;
  }

 // static getWorkbenchSize() {
  //   let section = $("section.bible-workbench");
  //   let position = section.position();

  //   let rect = new DOMRect(position?.left ?? 0, position?.top ?? 0, section.innerWidth(), section.innerHeight());
  //   return rect;
  // }

  public setActiveTool(tool: string): void {
    this.activeTool.set(tool);
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
    this.router.navigate(['/search']);
  }

  onCreateClick() {
    this.router.navigate(['create']);
  }

  onImportClick() {
    this.router.navigate(['/import']);
  }

  onEditClick() {
    console.log("edit clicked!");
    MainShellComponent.editObject = undefined;
    this.router.navigate(['/edit']);
  }

  onDeleteClick() {
    MainShellComponent.editObject = undefined;
    this.router.navigate(['/delete']);
  }

  onHelpClick(): void {
    //const url = `${window.location.origin}/help`;

    if (this.helpWindow && !this.helpWindow.closed) {
      this.helpWindow.focus();
      return;
    }

    this.helpWindow = window.open(
      "/help",
      'powerScriptureHelp',
      'width=1100,height=800,left=100,top=100'
    );

    this.helpWindow?.focus();
  }

  ngAfterViewInit() {
    // WorkbenchComponent.WorkbenchResizeBroadcaster = new Subject<DOMRectReadOnly>;
    // this.resizeObserver.observe($("section.bible-workbench")[0]);

    BibleThemeTreeComponent.ActiveCitationSelector.subscribe((citation:JstreeModel|null) => {
      WorkbenchComponent.activeCitation = citation;
    });

    BibleThemeTreeComponent.ActiveThemeSelector.subscribe((theme:JstreeModel|null) => {
      WorkbenchComponent.activeTheme = theme;
    });

    BibleThemeTreeComponent.ClipboardSelector.subscribe((node:JstreeModel) => {
      WorkbenchComponent.clipboardNode = node;
      console.log("workbench clipboard change:");
      console.log(node);
    })
  }

  ngOnDestroy() {
    BibleThemeTreeComponent.ActiveCitationSelector.unsubscribe();
    BibleThemeTreeComponent.ActiveThemeSelector.unsubscribe();
    BibleThemeTreeComponent.ClipboardSelector.unsubscribe();
  }
}