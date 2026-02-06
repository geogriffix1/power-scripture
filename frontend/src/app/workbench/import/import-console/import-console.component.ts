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
import { ThemeChainModel } from "../../../model/themeChain.model";
import { JstreeModel } from "../../../model/jstree.model";
import { BibleService } from "../../../bible.service";
import { BibleThemeTreeComponent } from "../../../bible-theme-tree/bible-theme-tree.component";

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
          if (!this.openTheme?.themes?.length) {
            this.writeLine(`[Themes]`, "info");
          }
          else {
            this.writeLine("[Themes]", "info");
            this.openTheme.themes.forEach(theme=> {
              this.writeLine(`${theme.theme.name} "${theme.theme.description}"`, "info");
            })
          }
        }

        if (showCitations) {
          if (!this.openTheme?.themeToCitationLinks?.length) {
            this.writeLine("[Citations]", "info");
          }
          else {
            this.writeLine("[Citations]", "info");
            this.openTheme.themeToCitationLinks.forEach(link=> {
              this.writeLine(`${link.themeToCitation.citation.citationLabel} "${link.themeToCitation.citation.description}"`, "info");
            });
          }
        }
      }
      else {
        this.writeLine(`Error: No open theme. Use 'base <theme path>' to set a base theme.`, "error");
      }
    }

    else if (/^open/i.test(raw)) {
      if (!this.openTheme) {
        this.writeLine(`Error: No open theme. Use 'base <theme path>' to set a base theme.`, "error");
        this.readyForInput();
        return;
      }

      let predicate = /^open\s+(.+)$/i.exec(raw)?.at(1)?.trim();
      if (predicate) {
        (async () => {
          let themes = predicate.split("/").map(s => s.trim());
          let failed = false;
          let thisTheme = structuredClone(this.openTheme);
          let themeTry = "";

          for (let theme of themes) {
            themeTry = theme;
            console.log(`trying to open "${theme}"`);
            if (thisTheme?.themes && thisTheme.themes.length > 0) {
              let nextTheme = thisTheme?.themes.find(t =>
                t.theme.name.toLowerCase() === theme.toLowerCase());
              if (nextTheme) {
                console.log("matched");
                let checkTheme = nextTheme.theme as any;
                console.log("checkTheme:");
                console.log(checkTheme);
                if (!checkTheme.extended) {
                  console.log("fetching theme details...");
                  let extendedTheme = await this.service.getTheme(checkTheme.id);
                  nextTheme.theme = extendedTheme;
                  console.log("nextTheme extended");
                  console.log(nextTheme.theme);
                }

                thisTheme = nextTheme.theme as ThemeExtendedModel;
                console.log("assigning thisTheme");
                console.log(thisTheme);
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
            this.openTheme = thisTheme;
            this.openStack.push(<ThemeExtendedModel>this.openTheme);
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
        this.writeLine(`Error: No open theme. Use 'base <theme path>' to set a base theme.`, "error");
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

    this.readyForInput();

    // this.inputText.set("");

    // queueMicrotask(() => {
    //   requestAnimationFrame(() => {
    //     this.scrollToBottom();
    //     this.focusInputNoScroll();
    //   });
    // });
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
