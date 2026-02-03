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

  private basePath = "";
  private baseThemeId = -1;
  private activeTheme: JstreeModel|null = null;

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
          console.log("base theme:");
          console.log(baseTheme);
        })();
      }
    }

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
