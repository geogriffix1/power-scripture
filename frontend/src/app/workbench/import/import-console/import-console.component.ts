import {
  OnInit,
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal
} from "@angular/core";
import { Subject } from "rxjs";
import { WorkbenchComponent } from "../../workbench.component";
import { ThemeExtendedModel } from "../../../model/theme.model";
import { CitationExtendedModel } from "../../../model/citation.model";
import { CitationVerseExtendedModel, CitationVerseRange } from "../../../model/citationVerse.model";
import { ScriptureModel } from "../../../model/scripture.model";
import { ThemeChainModel } from "../../../model/themeChain.model";
import { JstreeModel } from "../../../model/jstree.model";
import { parseCitationToRanges, rangesToResolverQuery } from "../citation-range-parser";
import { ThemeToCitationModel, ThemeToCitationLinkModel } from "../../../model/themeToCitation.model";
import { BibleBooksService } from "../../../bible-books.service";
import { BibleService } from "../../../bible.service";
import { BibleThemeTreeComponent } from "../../../bible-theme-tree/bible-theme-tree.component";
import { ScriptExecutionService } from "../../../script-execution.service";
import { getLocaleNumberSymbol } from "@angular/common";

type LineLevel = "info" | "error";

interface ConsoleLine {
  id: number;
  level: LineLevel;
  text: string;
}

@Component({
  selector: "app-import-console",
  standalone: true,
  templateUrl: "./import-console.component.html",
  styleUrls: ["./import-console.component.scss"]
})
export class ImportConsoleComponent implements AfterViewInit, OnDestroy {
  @ViewChild("consoleRoot") private consoleRoot?: ElementRef<HTMLDivElement>;
  @ViewChild("scrollArea") private scrollArea?: ElementRef<HTMLDivElement>;
  @ViewChild("inputEl") private inputEl?: ElementRef<HTMLTextAreaElement>;

  private nextId = 1;
  private childThemes = new Map<number, ThemeExtendedModel[]>();
  private childCitations = new Map<number, CitationExtendedModel[]>();

  outputLines = signal<ConsoleLine[]>([
    { id: 0, level: "info", text: "Import Console ready. Type 'help' or '?'." }
  ]);

  inputText = signal<string>("");

  private roRoot?: ResizeObserver;
  private roHost?: ResizeObserver;
  private roSection?: ResizeObserver;

  static isActive = false;
  static isSubscribed = false;

  private clipboard: JstreeModel|null = null;

  private baseTheme: ThemeExtendedModel|null = null;
  private openTheme: ThemeExtendedModel|null = null;
  private baseThemeId = -1;
  private activeTheme: JstreeModel|null = null;
  private openStack: ThemeExtendedModel[] = [];
  private service = new BibleService();
  private operationPromise: Promise<CitationExtendedModel[]>[] = [];

  readonly noOpenThemeError = `Error: No open theme. Use 'base <theme-path>' to set an open base theme.`;
  readonly noBaseThemeError = `Error: No base theme. Use 'base <theme-path>' to set a base theme.`;

  constructor(
    private books: BibleBooksService,
    private scriptService: ScriptExecutionService
  ) {}

  ngOnInit() {
    ImportConsoleComponent.isActive = true;
    if (WorkbenchComponent.clipboardNode) {
      this.clipboard = WorkbenchComponent.clipboardNode;
    }

    if (!ImportConsoleComponent.isSubscribed) {
      BibleThemeTreeComponent.ClipboardSelector.subscribe((node: JstreeModel | null) => {
        if (node)  {
          this.clipboard = node;
          let service = new BibleService();

          let theme = -1;
          if (node.id.startsWith("citation")) {
            theme = node.parent ? +node.parent.replace("theme", "") : -1;
          }
          else {
            theme = +node.id.replace("theme", "");
          }

          (async () => {
            console.log("getting theme chain...");
            await service.getThemeChain(theme, (chain: ThemeChainModel) => {
              console.log("theme chain:");
              console.log(chain);
              let path = "/" + chain.chain.map(theme => theme.name).join("/");

              this.copyTextToClipboard(path);
            });
          })();
        }
      });

      ImportConsoleComponent.isSubscribed = true;
    } 
  }

  ngAfterViewInit(): void {
    const root = this.consoleRoot?.nativeElement;

    this.roRoot = this.observeHeight("consoleRoot", root);
    this.roHost = this.observeHeight("import-console host", root?.closest("app-import-console"));
    this.roSection = this.observeHeight("section.scrollable", root?.closest("section.scrollable"));

    requestAnimationFrame(() => {
      this.scrollToBottom();
      this.focusInputNoScroll();
    });
  }

  ngOnDestroy(): void {
    this.roRoot?.disconnect();
    this.roHost?.disconnect();
    this.roSection?.disconnect();
    BibleThemeTreeComponent.ClipboardSelector.unsubscribe();
    ImportConsoleComponent.isSubscribed = false;
    ImportConsoleComponent.isActive = false;
  }

  private observeHeight(label: string, el: Element | null | undefined): ResizeObserver | undefined {
    if (!el) return;
    let last = -1;
    const ro = new ResizeObserver(entries => {
      const h = Math.round(entries[0].contentRect.height);
      if (h !== last) {
        console.log(`[${label}] height=${h}px (changed from ${last}px)`);
        last = h;
      }
    });
    ro.observe(el);
    return ro;
  }

  onInput(ev: Event): void {
    const value = (ev.target as HTMLTextAreaElement).value;
    this.inputText.set(value);
  }

  onKeyDown(ev: KeyboardEvent): void {
    if (ev.key === "Enter") {
      ev.preventDefault();
      this.submit();
      return;
    }
  }

  onConsoleClick(): void {
    this.focusInputNoScroll();
  }

  submit(): void {
    const raw = this.inputText().trim();
    if (!raw) return;

    this.writeLine(`❯ ${raw}`, "info");

    if (/^clear$/i.test(raw)) {
      this.outputLines.set([]);
      this.inputText.set("");
      queueMicrotask(() => {
        requestAnimationFrame(() => {
          this.scrollToBottom();
          this.focusInputNoScroll();
        });
      });
      return;
    }

    if (/^base/i.test(raw)) {
      let predicate = /^base\s+(.+)$/i.exec(raw)?.at(1)?.trim();
      if (predicate) {
        (async () => {
          let service = new BibleService();
          let baseTheme = await service.getThemeByPath(predicate);

          if (baseTheme.id > 0) {
            this.baseTheme = baseTheme;
            this.openTheme = structuredClone(baseTheme);
            this.openStack = [this.openTheme];
            this.writeLine(`${this.openTheme.path}`, "info");

            this.setThemeChildren(this.openTheme);
          }
          else {
            this.writeLine(`Error: Theme not found for path '${predicate}'`, "error");
          }
        })();
      }
    }
    
    else if (/^show/i.test(raw)) {
      if (this.openTheme) {
        this.writeLine(`${this.openTheme.path} "${this.openTheme.description}"`, "info");
        let predicate = /^show\s+(.+)$/i.exec(raw)?.at(1)?.trim();
        let showThemes = false;
        let showCitations = false;
        if (predicate) {
          console.log(`predicate: "${predicate}"`);
          let themeOrCitation = /^(themes?$|them?$|th?$|citations?$|citatio?$|citat?$|cit?$|c$)/i.exec(predicate)?.at(1);
          console.log(`type: ${themeOrCitation}`);
          showThemes = <boolean>(themeOrCitation && themeOrCitation.toLowerCase().startsWith("t"));
          showCitations = <boolean>(themeOrCitation && themeOrCitation.toLowerCase().startsWith("c"));
        }
        else {
          console.log("no predicate");
          showThemes = true;
          showCitations = true;
        }

        if (showThemes) {
          if (!this.childThemes.get(this.openTheme.id)?.length) {
            this.writeLine(`[Themes]`, "info");
          }
          else {
            this.writeLine("[Themes]", "info");
            this.childThemes.get(this.openTheme.id)?.forEach(theme=> {
              this.writeLine(`${theme.name} "${theme.description}"`, "info");
            })
          }
        }

        if (showCitations) {
          console.log(`number of citations: ${this.childCitations.get(this.openTheme.id)?.length}`);
          if (!this.childCitations.get(this.openTheme.id)?.length) {
            this.writeLine("[Citations]", "info");
          }
          else {
            this.writeLine("[Citations]", "info");
            let citations = this.childCitations.get(this.openTheme.id);
            citations?.forEach(citation => {
              let description = `"${citation.description ?? ""}"`;
              this.writeLine(description == `""` ? "(no description)" : description, "info");
              this.writeLine(citation.citationLabel ?? "(no verses cited)", "info");
            });
          }
        }
      }
      else {
        this.writeLine(this.noOpenThemeError, "error");
      }
    }

    else if (/^open/i.test(raw)) {
      if (!this.openTheme) {
        this.writeLine(this.noBaseThemeError, "error");
        this.readyForInput();
        return;
      }

      let predicate = /^open\s+(.+)$/i.exec(raw)?.at(1)?.trim();
      if (predicate) {
        (async () => {

          // remove leading and trailing slashes, then split on slash to get theme subpath segments
          if (predicate!.startsWith("/")) {
            predicate = predicate!.substring(1);
          }

          if (predicate!.endsWith("/")) {
            predicate = predicate!.at(-1)?.trim();
          }

          let themes = predicate!.split("/").map(s => s.trim());
          let failed = false;
          let thisTheme = structuredClone(this.openTheme);
          let themeTry = "";

          // user may have asked for a subpath such as a/b/c - themes = ["a", "b", "c"]
          for (let theme of themes) {
            themeTry = theme;
            let childThemes = this.childThemes.get(thisTheme!.id);
            if (childThemes && childThemes.length > 0) {
              let nextTheme = childThemes.find(t =>
                t.name.toLowerCase() === theme.toLowerCase());

              // nextTheme should be a subtheme of thisTheme, check to see if it has already been extended with description and child theme/citation info.  If not, get it from the service.
              if (nextTheme) {
                let checkTheme = nextTheme as any;
                if (!checkTheme.extended) {
                  let extendedTheme = await this.service.getTheme(checkTheme.id);
                  nextTheme = extendedTheme;
                  this.setThemeChildren(nextTheme);
                }

                thisTheme = nextTheme as ThemeExtendedModel;
              }
              else {
                failed = true;
                break;
              }
            }
            else {
              failed = true;
              break;
            }
          }

          if (failed) {
            this.writeLine(`Error: theme "${themeTry}" not found`, "error");
          }
          else {
            this.openTheme = structuredClone(thisTheme);
            this.openStack.push(<ThemeExtendedModel>this.openTheme);
            this.setThemeChildren(this.openTheme as ThemeExtendedModel);
            this.writeLine(`theme opened: ${this.openTheme?.name} "${this.openTheme?.description ?? ''}"`, "info");
          }
        })();
      }
      else {
        this.writeLine(`Error: no theme specified. Usage: open <subtheme path>`, "error");
      }
    }

    else if (/^close/i.test(raw)) {
      if (!this.openTheme) {
        this.writeLine(this.noOpenThemeError, "error");
        this.readyForInput();
        return;
      }

      if (this.openTheme.id === this.baseTheme?.id) {
        this.writeLine(`Error: cannot close base theme.  Use 'base <theme path>' to set new base theme.`, "error");
        this.readyForInput();
        return;
      }

      this.openStack.pop();
      this.openTheme = <ThemeExtendedModel>this.openStack.at(-1);
      this.writeLine(`open theme: ${this.openTheme?.name} "${this.openTheme?.description ?? ''}"`, "info");
    }

    else if (/^create\s+(?:theme?|the?|t)/.test(raw)) {
      console.log("create theme command detected");
      if (!this.openTheme) {
        this.writeLine(this.noOpenThemeError, "error");
        this.readyForInput();     
        return;
      }

      let predicate = /^create\s+(?:theme?|the?|t)(\s+([^"]+)(?:"|$)(.*))?/i.exec(raw);
      console.log(predicate);
      if (!predicate?.length) {
        this.writeLine(`Error: invalid syntax. Usage: create theme <name>[ "<description>]`, "error");
        this.readyForInput();
        return;
      }

      let themeName = predicate.at(2)?.trim();
      let desc = predicate.at(3)?.trim();
      if (desc && desc.length > 0 && desc.at(-1) == '"') {
        desc = desc.substring(0, desc.length - 1).trim();
      }

      console.log(`theme: ${themeName}`);
      console.log(`desc: ${desc}`);

      if (!themeName) {
        this.writeLine(`Error: theme name is required. Usage: create theme <name>[ "<description>]`, "error");
        this.readyForInput();
        return;
      }

      let childThemes = this.childThemes.get(this.openTheme.id) ?? [];
      let sequence = childThemes.length > 0 ? Math.max(...childThemes.map(t => t.sequence)) + 1 : 1;
      let fakeId = Math.min(0, ...childThemes.map(t => t.id)) - 1;

      let newTheme = {
        id: fakeId,
        parent: this.openTheme.id,
        name: themeName,
        path: this.openTheme.path + "/" + themeName,
        node: undefined,
        description: desc ?? "",
        sequence: sequence,
        childCount: 0,
        extended: true,
        themes: [],
        themeToCitationLinks: []
      } as ThemeExtendedModel;

      this.childThemes.set(this.openTheme.id, [...(this.childThemes.get(this.openTheme.id) ?? []), newTheme]);
      this.writeLine(`theme ${newTheme.name} entered ("save" to complete)`, "info");
      console.log("child themes:");
      console.log(this.childThemes);
    }

    else if (/^create\s+(?:citation?|citati?|cita?|ci?)(\s*"([^"]+)(?:"|$))?(\s*(.+?)(?=\s*$))?/.test(raw)) {
      console.log("create citation command detected");

      if (!this.openTheme) {
        this.writeLine(this.noOpenThemeError, "error");
        this.readyForInput();     
        return;
      }

      let predicate = /^create\s+(?:citation?|citati?|cita?|ci?)(\s*"([^"]+)(?:"|$))?(\s*(.+?)(?=\s*$))?/i.exec(raw);
      console.log(predicate);
      if (!predicate?.length) {
        this.writeLine(`Error: invalid syntax. Usage: create citation ["<description>"] [scriptures]`, "error");
        this.readyForInput();
        return;
      }

      let desc = predicate.at(2)?.trim() ?? "";
      let cite = predicate.at(4)?.trim() ?? "";
      if (desc && desc.length > 0 && desc.at(-1) == '"') {
        desc = desc.substring(0, desc.length - 1).trim();
      }

      console.log(`cite: ${cite}`);
      console.log(`desc: ${desc}`);

      (async () => {
        try {
          const ranges = await parseCitationToRanges(cite, this.books);
          console.log("new ranges:");
          console.log(ranges);
          const label = ranges.map(range => range.label).join(",");
          console.log(`label: ${label}`);
          
          const citations = this.childCitations.get(this.openTheme!.id) ?? [];
          console.log("citations:");
          console.log(citations);
          citations.push({
            id: -1,
            description: desc,
            extended: false,
            verses:[],
            citationLabel: label 
          } as CitationExtendedModel);

          this.childCitations.set(this.openTheme!.id, citations);
        }
        catch (e) {
          this.writeLine((e as Error).message, "error");
        }
      })();
    }

    else if (/^create/.test(raw)) {
      this.writeLine("Error: invalid syntax. Usage: create [theme or citation] <parameters>", "error");
      this.readyForInput();
      return;
    }

    this.readyForInput();
  }

  private readyForInput() {
    this.inputText.set("");

    queueMicrotask(() => {
      requestAnimationFrame(() => {
        this.scrollToBottom();
        this.focusInputNoScroll();
      });
    });

  }

  private writeLine(text: string, level: LineLevel): void {
    this.outputLines.update(lines => [...lines, { id: this.nextId++, level, text }]);
    requestAnimationFrame(() => this.scrollToBottom());
  }

  private scrollToBottom(): void {
    const el = this.scrollArea?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  private focusInputNoScroll(): void {
    const el = this.inputEl?.nativeElement;
    if (!el) return;
    try {
      (el as any).focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }

  private getThemeCitations(parentTheme: ThemeExtendedModel) : Promise<CitationExtendedModel[]> {
    if (this.childCitations.get(parentTheme.id)) {
      return Promise.resolve(this.childCitations.get(parentTheme.id)!);
    } 

    if (parentTheme.id in this.operationPromise) {
      return this.operationPromise[parentTheme.id];
    }

    this.operationPromise[parentTheme.id] = this.lazyLoadCitationsByTheme(parentTheme)
      .then(value => {
        delete this.operationPromise[parentTheme.id];
        return value;
      });

    return this.operationPromise[parentTheme.id];
  }

  private async lazyLoadCitationsByTheme(parentTheme: ThemeExtendedModel) : Promise<CitationExtendedModel[]> {
    let links = parentTheme.themeToCitationLinks;
    let tasks = <any>[];
    let citations = <CitationExtendedModel[]>[];

    links.forEach(link => {
      let citation = {
        id: link.themeToCitation?.citation.id,
        description: link.themeToCitation?.citation.description,
        extended: false,
        verses: []
      } as CitationExtendedModel;

      citations.push(citation);

      // Queue up a database query for the verses in this citation
      tasks.push(this.service.getVersesByCitation(link.themeToCitation.citation.id));
    });

    await Promise.all(tasks).then(data => {
      console.log("in promise. data:");
      console.log(data);
      let verseArray = data as CitationVerseExtendedModel[][];

      for (let i = 0; i < verseArray.length; i++) {
        let citation = citations[i];

        // each array of verses are the verses of a child citation
        console.log("convert verses to ranges");
        var ranges = this.convertVersesToRanges(verseArray[i]);
        citation!.citationLabel = ranges.map(range => range.label).join(",") ?? "";
        console.log("setting childCitations to");
        console.log([...this.childCitations.get(parentTheme.id) ?? [], citation!]);
        this.childCitations.set(parentTheme.id, [...this.childCitations.get(parentTheme.id) ?? [], citation!]);
      };
    });

    return Promise.resolve(this.childCitations.get(parentTheme.id)!);
  }

  private setThemeChildren(parentTheme: ThemeExtendedModel): void {
    console.log(`setThemeChildren(${parentTheme.id})`);
    var childThemes = this.childThemes.get(parentTheme.id);
    var childCitations = this.childCitations.get(parentTheme.id);

    if (!childThemes) {
      childThemes = parentTheme.themes ? parentTheme.themes.map(t => t.theme) as ThemeExtendedModel[] : [];
      this.childThemes.set(parentTheme.id, childThemes);

      console.log("in setThemeChildren");
      console.log(this.childThemes.get(parentTheme.id));
    }

    if (!childCitations) {
      console.log("setting child citations.");
      this.getThemeCitations(parentTheme);
    }
  }

  private convertVersesToRanges(verses: CitationVerseExtendedModel[]) : CitationVerseRange[] {
    console.log("convertVersesToRanges");
    let citationId = 0;
    let book = "";
    let chapter = 0;
    let verse = verses.at(0)?.scripture.verse;
    let startVerse = verses.at(0)?.scripture.verse;
    let endVerse: number | undefined = 0;

    let ranges = [];

    for (let i=0; i < verses.length; i++) {
      if (citationId && (
        book != verses[i].scripture.book ||
        chapter != verses[i].scripture.chapter ||
        verse != verses[i].scripture.verse - 1)) {
          endVerse = verse;
          const range = {
            citationId: citationId,
            book: book,
            chapter: chapter,
            startVerse: startVerse,
            endVerse: endVerse,
            label: "",
          } as CitationVerseRange;

          range.label = this.getLabel(range);
          console.log("range:");
          console.log(range);
          ranges.push(range);

          startVerse = verses[i].scripture.verse;
      }

      citationId = verses[i].citationId;
      book = verses[i].scripture.book;
      chapter = verses[i].scripture.chapter;
      verse = verses[i].scripture.verse;
    }

    const range = {
      citationId: citationId,
      book: book,
      chapter: chapter,
      startVerse: startVerse,
      endVerse: verse,
      label: ""
    } as CitationVerseRange;

    console.log("range:");
    console.log(range);
    range.label = this.getLabel(range);
    ranges.push(range);

    return ranges;
  }

  private getLabel(range: CitationVerseRange) : string {
    const singleChapter = /Obadiah|Philemon|2 John|3 John|Jude/;
    let label = "";
    if (singleChapter.test(range.book)) {
      label = `${range.book} ${range.startVerse}`
    }
    else {
      label = `${range.book} ${range.chapter}:${range.startVerse}`;
    }

    if (range.startVerse != range.endVerse) {
      label = `${label}-${range.endVerse}`;
    }

    return label;
  }

  private async copyTextToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // Fallback for older browsers: use a temporary textarea and execCommand
      const ta = document.createElement('textarea');
      ta.value = text;
      // Prevent scrolling to bottom
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(ta);
      return successful;
    }
    catch (e) {
      console.error('copyTextToClipboard failed', e);
      return false;
    }
  } 
}
