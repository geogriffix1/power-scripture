import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal
} from "@angular/core";

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
}
