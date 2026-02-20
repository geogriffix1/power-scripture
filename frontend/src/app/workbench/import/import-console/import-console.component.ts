import {
  OnInit,
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal
} from "@angular/core";
import { WorkbenchComponent } from "../../workbench.component";
import { ThemeExtendedModel } from "../../../model/theme.model";
import { CitationExtendedModel } from "../../../model/citation.model";
import { CitationVerseExtendedModel, CitationVerseRange } from "../../../model/citationVerse.model";
import { ThemeChainModel } from "../../../model/themeChain.model";
import { JstreeModel } from "../../../model/jstree.model";
import { parseCitationToRanges } from "../citation-range-parser";
import { BibleBooksService, BookInfo } from "../../../bible-books.service";
import { BibleService } from "../../../bible.service";
import { BibleThemeTreeComponent } from "../../../bible-theme-tree/bible-theme-tree.component";
import { ScriptExecutionService } from "../../../script-execution.service";
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
//import { BookCodeToName } from "../bookCodeToName";

type LineLevel = "info" | "error";

interface ConsoleLine {
  id: number;
  level: LineLevel;
  text: string;
  memo?: string;
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
  private nextThemeId = -1;
  private childThemes = new Map<number, ThemeExtendedModel[]>();
  private childCitations = new Map<number, CitationExtendedModel[]>();

  outputLines = signal<ConsoleLine[]>([
    { id: 0, level: "info", text: "Import Console ready. Type 'help' or '?'." }
  ]);

  inputText = signal<string>("");
  inputMemo = signal<string>("");
  pendingSave = false;

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
  private operationPromise: Promise<CitationExtendedModel[]>[] = [];

  readonly noOpenThemeError = `Error: No open theme. Use 'base <theme-path>' to set an open base theme.`;
  readonly noBaseThemeError = `Error: No base theme. Use 'base <theme-path>' to set a base theme.`;

  constructor(
    private books: BibleBooksService,
    private service: BibleService,
    private http: HttpClient
    //private scriptService: ScriptExecutionService
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

          let theme = -1;
          if (node.id.startsWith("citation")) {
            theme = node.parent ? +node.parent.replace("theme", "") : -1;
          }
          else {
            theme = +node.id.replace("theme", "");
          }

          (async () => {
            await this.service.getThemeChain(theme, (chain: ThemeChainModel) => {
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
        //console.log(`[${label}] height=${h}px (changed from ${last}px)`);
        last = h;
      }
    });
    ro.observe(el);
    return ro;
  }

  onInput(ev: Event): void {
    const value = (ev.target as HTMLTextAreaElement).value;
    this.inputText.set(value);
    this.inputMemo.set(this.pendingSave ? " (save pending)" : "");
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

  async bookCodeLookup(input:string): Promise<string> {
    let match = /^(create\s+(?:citation?|citati?|cita?|ci?))(\s*"([^"]+)(?:"|$))?(\s*(.+?)(?=\s*$))?/i.exec(input);
    if (!match?.length) {
      return Promise.resolve(input);
    }

    let createC = match.at(1);
    let desc = match.at(3)?.trim() ?? "";
    let cite = match.at(5)?.trim() ?? "";

    if (!cite) {
      return Promise.resolve(input);
    }

    await this.books.ensureLoaded();
    let allBooks = this.books.getAllBooks()

    let ranges = cite.split(",").map(range => range.trim());
    let outRange = <string[]>[];
    ranges.forEach(range => {
      let match = /((?:[^\s]{3})[^\s\d]*)\s*(.*)/i.exec(range);

      if (match && match.at(1) && match.at(1)!.length == 3) {
        let bookInfo = allBooks.find(bookInfo => bookInfo.code == match.at(1)!.toLowerCase());
        if (!bookInfo) {
          outRange.push(range);
        }
        else {
          let chapterVerse = (match.at(2) === undefined ? "" : match.at(2)!)
          outRange.push(`${bookInfo!.book} ${chapterVerse}`);
        }
      }
      else {
        outRange.push(range);
      }
    });

    if (desc) {
      return `${createC} "${desc}" ${outRange.join(",")}`;
    }
  
    return Promise.resolve(`${createC} ${outRange.join(",")}`);
  }

  async preparse(input:string): Promise<string> {
    if (/^(create\s+?:citation?|citati?|cita?|ci?)(\s*"([^"]+)(?:"|$))?(\s*(.+?)(?=\s*$))?/.test(input)) {
      input = await this.bookCodeLookup(input);
    }

    return Promise.resolve(input);
  }

  submit(): void {
    (async () => {
      let raw = this.inputText().trim();
      if (!raw) return;

      if (this.inputMemo() && /^save|reset/i.test(raw)) {
        this.inputMemo.set("");
      }

      raw = await this.preparse(raw);
      this.writeLine(`❯ ${raw}`, "info", this.inputMemo());

      if (/^clear$/i.test(raw)) {
        this.outputLines.set([]);
        this.inputText.set("");
        this.inputMemo.set("");
        queueMicrotask(() => {
          requestAnimationFrame(() => {
            this.scrollToBottom();
            this.focusInputNoScroll();
          });
        });
        return;
      }

      if (/^base/i.test(raw)) {
        if (this.pendingSave) {
          this.writeLine(`Changes are pending. Enter "save" or "reset" before continuing`, "error");
          return;
        }

        let predicate = /^base\s+(.+)$/i.exec(raw)?.at(1)?.trim();
        if (predicate) {
          let baseTheme = await this.service.getThemeByPath(predicate);

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
        }
      }
      
      else if (/^show/i.test(raw)) {
        if (this.openTheme) {
          this.writeLine(`${this.openTheme.path} "${this.openTheme.description}"`, "info");
          let predicate = /^show\s+(.+)$/i.exec(raw)?.at(1)?.trim();
          let showThemes = false;
          let showCitations = false;
          if (predicate) {
            let themeOrCitation = /^(themes?$|them?$|th?$|citations?$|citatio?$|citat?$|cit?$|c$)/i.exec(predicate)?.at(1);
            showThemes = <boolean>(themeOrCitation && themeOrCitation.toLowerCase().startsWith("t"));
            showCitations = <boolean>(themeOrCitation && themeOrCitation.toLowerCase().startsWith("c"));
          }
          else {
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
        if (!this.openTheme) {
          this.writeLine(this.noOpenThemeError, "error");
          this.readyForInput();     
          return;
        }

        let predicate = /^create\s+(?:theme?|the?|t)(\s+([^"]+)(?:"|$)(.*))?/i.exec(raw);
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

        if (!themeName) {
          this.writeLine(`Error: theme name is required. Usage: create theme <name>[ "<description>]`, "error");
          this.readyForInput();
          return;
        }

        if (this.openTheme.themes &&
          this.openTheme.themes.some(theme => (theme.theme.name.toLowerCase() == themeName.toLowerCase()))) {
          this.writeLine(`Error: duplicate theme name: ${themeName}`, "error");
          this.readyForInput();
          return;
        }

        let childThemes = this.childThemes.get(this.openTheme.id) ?? [];
        let sequence = childThemes.length > 0 ? Math.max(...childThemes.map(t => t.sequence)) + 1 : 1;

        let newTheme = {
          id: this.nextThemeId--,
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
        this.pendingSave = true;
        this.writeLine(`theme ${newTheme.name} entered ("save" to complete)`, "info");
      }

      else if (/^create\s+(?:citation?|citati?|cita?|ci?)(\s*"([^"]+)(?:"|$))?(\s*(.+?)(?=\s*$))?/.test(raw)) {

        if (!this.openTheme) {
          this.writeLine(this.noOpenThemeError, "error");
          this.readyForInput();     
          return;
        }

        let predicate = /^create\s+(?:citation?|citati?|cita?|ci?)(\s*"([^"]+)(?:"|$))?(\s*(.+?)(?=\s*$))?/i.exec(raw);
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

        try {
          const ranges = await parseCitationToRanges(cite, this.books);
          const label = ranges.map(range => range.label).join(",");
          
          const citations = this.childCitations.get(this.openTheme!.id) ?? [];
          citations.push({
            id: -1,
            description: desc,
            extended: false,
            verses:[],
            citationLabel: label 
          } as CitationExtendedModel);

          this.childCitations.set(this.openTheme!.id, citations);
          this.writeLine(`Citation entered ("save" to complete)`, "info");
          this.pendingSave = true;
        }
        catch (e) {
          this.writeLine((e as Error).message, "error");
        }
      }

      else if (/^create/i.test(raw)) {
        if (!this.openTheme) {
          this.writeLine(this.noBaseThemeError, "error");
          this.readyForInput();
          return;
        }

        this.writeLine("Error: invalid syntax. Usage: create [theme or citation] <parameters>", "error");
        this.readyForInput();
        return;
      }

      else if (/^reset/i.test(raw)) {
        // This undoes all proposed changes to the database
        if (!this.pendingSave) {
          this.writeLine("No pending changes.", "info");
          this.readyForInput();
        }

        // note: we can actually assume an open theme at this point
        if (!this.openTheme) {
          this.writeLine(this.noBaseThemeError, "error");
          this.readyForInput();
          return;
        }

        let isClosed = this.openTheme!.id < 0;

        // Close all pending themes that are currently open
        while (this.openTheme!.id < 0) {
          this.openStack.pop();
          this.openTheme = <ThemeExtendedModel>this.openStack.at(-1);
        }

        if (isClosed) {
        this.writeLine(`open theme: ${this.openTheme?.name} "${this.openTheme?.description ?? ''}"`, "info");
        }

        // remove all child themes from the childthemes folder that have not been saved
        for (const [parentId, childThemes] of this.childThemes) {
          if (parentId < 0) {
            this.childThemes.delete(parentId);
          }
          else {
            const originalChildThemes = childThemes.filter(theme => theme.id > 0);
            this.childThemes.set(parentId, originalChildThemes);
          }
        }

        for (const [parentId, childCitations] of this.childCitations) {
          if (parentId < 0) {
            this.childCitations.delete(parentId);
          }
          else {
            const originalCitations = childCitations.filter(citation => citation.id > 0);
            this.childCitations.set(parentId, originalCitations);
          }
        }

        this.pendingSave = false;
        this.writeLine("Updates have been reset to previous save point", "info");
      }


      else if (/^save/i.test(raw)) {
        // This saves all proposed changes to the database
        if (!this.pendingSave) {
          this.writeLine("No pending changes.", "info");
          this.readyForInput();
        }

        // note: we can actually assume an open theme at this point
        if (!this.openTheme) {
          this.writeLine(this.noBaseThemeError, "error");
          this.readyForInput();
          return;
        }

        // Creates a list of theme ids of themes we've opened this base session
        let savedThemeIds = [...this.childThemes.keys()]
          .filter(themeId => themeId > 0);
        
        let unsaved: ThemeExtendedModel[] = [];

        // Creates a list of unsaved themes that have saved parent themes
        savedThemeIds.forEach(parentId => {
          unsaved = [
            ...unsaved,
            ...this.childThemes.get(parentId)!
              .filter(theme => theme.id < 0) ?? []];
        });

        while(unsaved.length) {
          // Physically save a layer of unsaved themes which have saved parents
          const saved = await this.createThemeLayer(unsaved)!;

          // Saved themes are the same as unsaved themes except they have
          // an id that was assigned by the database.
          for (let i = 0; i < saved.length; i++) {
            // get all siblings of the parent theme, because this temp sibling is now permanent
            let siblingThemes = this.childThemes.get(unsaved[i].parent)!;
            let thisIndex = siblingThemes.findIndex(t => t.id == unsaved[i].id);

            // set thisTheme to the saved version of the theme
            let thisTheme = saved[i];
            let thisThemeChildren = this.childThemes.get(unsaved[i].id) ?? [];
            let thisThemeCitations = this.childCitations.get(unsaved[i].id) ?? [];

            // if there are child themes, they are still temporary. Add them to the saved theme.
            if (thisThemeChildren.length) {
              thisTheme.themes = [];
              thisThemeChildren.forEach(child => {
                child.parent = thisTheme.id;
                thisTheme.themes.push({ theme: child });
              });

              this.childThemes.delete(unsaved[i].id);
              this.childThemes.set(thisTheme.id, thisThemeChildren);
            }
            else {
              this.childThemes.delete(unsaved[i].id);
              this.childThemes.set(saved[i].id, []);
            }

            if (this.openTheme?.id && this.openTheme.id == unsaved[i].id) {
              this.openTheme = thisTheme;
            }

            siblingThemes[thisIndex] = thisTheme;

            this.childThemes.set(thisTheme.parent, siblingThemes);
          
            if (thisThemeCitations.length) {
              this.childCitations.set(saved[i].id, [...this.childCitations.get(unsaved[i].id)!]);
              this.childCitations.delete(unsaved[i].id);
            }
          }
          
          unsaved = [];
          savedThemeIds = [...this.childThemes.keys()]
            .filter(themeId => themeId > 0);
      
          savedThemeIds.forEach(parentId => {
            unsaved = [
              ...unsaved,
              ...this.childThemes.get(parentId)!
                .filter(theme => theme.id < 0) ?? []];
          });
        }

        let themeIds = [...this.childCitations.keys()];
        const unsavedCitations: {
          themeId: number;
          citations: CitationExtendedModel[];
        }[] = [];

        themeIds.forEach(themeId => {
          let unsaved = (this.childCitations.get(themeId) ?? [])
            .filter(cite => cite.id < 0);
          if (unsaved && unsaved.length) {
            unsavedCitations.push({ themeId:<number> themeId, citations:<CitationExtendedModel[]>[...unsaved]});
          }
        });

        let tasks = <any>[];
        unsavedCitations.forEach(cite => {
          for (var citation of <CitationExtendedModel[]>cite.citations) {
            tasks.push(this.service.createCitationFromScriptureLabel(citation.description, cite.themeId, citation.citationLabel ?? ""));
          }
        });

        Promise.all(tasks).then();

        this.pendingSave = false;
        this.writeLine("Updates have been saved", "info");
      }
      else if (/^(\?|help)/i.test(raw)) {
        let match = /^(\?|help)\s+(.*)/i.exec(raw);
        let page = match?.at(2) === undefined ? "" : match.at(2)?.trim();
        if (!page || page == "help" || page == "?") {
          this.loadHelpFile("general");
        }
        else if (page == "clear") {
          this.loadHelpFile("clear");
        }
        else if (page == "base") {
          console.log("base");
        }
        else if (page == "show") {
          console.log("show");
        }
        else if (page == "open") {
          console.log(open);
        }
        else if (page == "close") {
          console.log("close");
        }
        else if (page == "create theme") {
          console.log("create theme");
        }
        else if (page == "create citation") {
          console.log("create citation");
        }
        else if (page == "save") {
          console.log("save");
        }
        else if (page == "reset") {
          console.log("reset");
        }
        else if (page == "books") {
          await this.books.ensureLoaded();
          this.writeLine(`${"CODE".padStart(6).padEnd(12)}${"BOOK".padEnd(14)}${"CHAPTER COUNT"}`, "info");
          this.books.getAllBooks()
            .forEach(book => {
              this.writeLine(`${book.code.padStart(5).padEnd(10)}${book.book.padEnd(20)}${book.chapterCount.toString().padStart(3)}`, "info");
            });
        }
        else if (page == "book") {
          console.log("book");
        }
        else {
          this.writeLine(`Help not found for ${page}`, "error");
        }
      }
      else {
        this.writeLine("Invalid command entered", "error");
      }

      this.readyForInput();

    })();
  }

  async loadHelpFile(name: string) {
    const text = await firstValueFrom(
      this.http.get(`/assets/help files/${name}.txt`, {
        responseType: 'text'
      })
    );

    this.writeLine(text, "info");
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

  private writeLine(text: string, level: LineLevel, memo?: string): void {
    this.outputLines.update(lines => [...lines, { id: this.nextId++, level, text, memo }]);
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
      let verseArray = data as CitationVerseExtendedModel[][];

      for (let i = 0; i < verseArray.length; i++) {
        let citation = citations[i];

        // each array of verses are the verses of a child citation
        var ranges = this.convertVersesToRanges(verseArray[i]);
        citation!.citationLabel = ranges.map(range => range.label).join(",") ?? "";
        this.childCitations.set(parentTheme.id, [...this.childCitations.get(parentTheme.id) ?? [], citation!]);
      };
    });

    return Promise.resolve(this.childCitations.get(parentTheme.id)!);
  }

  private async createThemeLayer(themes: ThemeExtendedModel[]): Promise<ThemeExtendedModel[]> {
    let tasks = <any>[];

    themes.forEach(theme => 
      tasks.push(this.service.createTheme(theme.parent, theme.name, theme.description)));

    let returnValue = <ThemeExtendedModel[]>[];
    await Promise.all(tasks).then(data => {
      returnValue = <ThemeExtendedModel[]>data;
    });

    return Promise.resolve(returnValue);
  }

  private setThemeChildren(parentTheme: ThemeExtendedModel): void {
    var childThemes = this.childThemes.get(parentTheme.id);
    var childCitations = this.childCitations.get(parentTheme.id);

    if (!childThemes) {
      childThemes = parentTheme.themes ? parentTheme.themes.map(t => t.theme) as ThemeExtendedModel[] : [];
      this.childThemes.set(parentTheme.id, childThemes);
    }

    if (!childCitations) {
      this.getThemeCitations(parentTheme);
    }
  }

  private convertVersesToRanges(verses: CitationVerseExtendedModel[]) : CitationVerseRange[] {
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

    range.label = this.getLabel(range);

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

  private wrapText(text: string): string[] {
    const words = text.trim().split(/\s+/);
    const lines: string[] = [];
    let line = "";

    for (const w of words) {
      if (!line) {
        line = w;
        continue;
      }
      if ((line.length + 1 + w.length) <= 100) {
        line += " " + w;
      } else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }
}
