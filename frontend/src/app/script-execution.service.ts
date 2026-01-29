// script-execution.service.ts
import { Injectable } from "@angular/core";
import { BibleBooksService } from "./bible-books.service";
//import { ScriptureResolverService } from "./scripture-resolver.service";
//import { CitationParser } from "./citation-parser";
import { parseCitationToRanges, rangesToResolverQuery } from "./workbench/import/citation-range-parser";
import { BibleService } from "./bible.service"; // contains createCitation(...)
import { ThemeExtendedModel } from "./model/theme.model";

/* ===========================
   Pending ops (append only)
   =========================== */

type PendingOp =
  | { kind: "CreateTheme"; parentId: number; name: string; description?: string | null; tempId: number }
  | { kind: "CreateCitation"; themeId: number; scriptureIds: number[] };

type SaveMarker = number;

/* ===========================
   Execution result
   =========================== */

export interface ScriptResult {
  output: string[];
  errors: string[];
}

/* ===========================
   Service
   =========================== */

@Injectable({ providedIn: "root" })
export class ScriptExecutionService {
  private tempId = -1;

  constructor(
    private books: BibleBooksService,
    //private resolver: ScriptureResolverService,
    private bibleService: BibleService
  ) {}

  /* ==========================================================
     PUBLIC ENTRY POINT
     ========================================================== */

  /**
   * Execute a script.
   * @param scriptText script contents
   * @param themes persisted themes from backend
   * @param isFileScript true = validate whole script before any save
   */
  async executeScript(
    scriptText: string,
    themes: ThemeExtendedModel[],
    isFileScript: boolean
  ): Promise<ScriptResult> {
    const output: string[] = [];
    const errors: string[] = [];

    // Build theme lookup
    const themeChildren = this.buildThemeChildren(themes);

    // Compiler state
    const stack: number[] = [];
    const createdChildren = new Map<number, Set<string>>();
    const pending: PendingOp[] = [];
    const saveMarkers: SaveMarker[] = [];

    const lines = scriptText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#"));

    // ---------- PASS 1: parse + validate ----------
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;

      try {
        if (/^help$|^\?$/.test(line)) {
          await this.books.ensureLoaded();
          output.push(this.books.getHelpListSorted().join(", "));
          continue;
        }

        if (/^clear$/i.test(line)) {
          output.length = 0;
          continue;
        }

        if (/^save$/i.test(line)) {
          saveMarkers.push(pending.length);
          continue;
        }

        if (/^reset$/i.test(line)) {
          pending.length = 0;
          saveMarkers.length = 0;
          continue;
        }

        const base = line.match(/^base\s+(.+)$/i);
        if (base) {
          const path = base[1].trim();
          const id = this.resolvePath(path, themeChildren);
          stack.length = 0;
          stack.push(id);
          continue;
        }

        if (/^close$/i.test(line)) {
          if (stack.length > 1) stack.pop();
          continue;
        }

        const open = line.match(/^open\s+(.+)$/i);
        if (open) {
          const name = open[1].trim();
          const parent = this.requireTheme(stack);
          const child = this.resolveChild(name, parent, themeChildren, createdChildren);
          stack.push(child);
          continue;
        }

        const ct = line.match(/^create-theme\s+(.+)$/i);
        if (ct) {
          const parent = this.requireTheme(stack);
          const name = ct[1].trim();
          this.assertUniqueThemeName(parent, name, themeChildren, createdChildren);

          const id = this.tempId--;
          pending.push({ kind: "CreateTheme", parentId: parent, name, tempId: id });

          if (!createdChildren.has(parent)) createdChildren.set(parent, new Set());
          createdChildren.get(parent)!.add(name.toLowerCase());
          continue;
        }

        const cite = line.match(/^cite\s+(.+)$/i);
        if (cite) {
          const themeId = this.requireTheme(stack);
          const ranges = await parseCitationToRanges(cite[1], this.books);
          const query = rangesToResolverQuery(ranges, this.books);

          const scriptures = await this.bibleService.getScripturesByCitationString(query);
          const ids = scriptures.map(scripture => scripture.id);
          const unique = <number[]>Array.from(new Set(ids));

          pending.push({ kind: "CreateCitation", themeId, scriptureIds: unique });
          continue;
        }

        throw new Error(`Unknown command: "${line}"`);
      } catch (e: any) {
        errors.push(`Line ${lineNo}: ${e.message}`);
      }
    }

    if (errors.length) return { output, errors };

    // ---------- PASS 2: execute saves ----------
    if (!isFileScript) {
      // interactive: save immediately when encountered
      await this.executePending(pending);
    } else {
      // file script: saves happen AFTER validation
      let last = 0;
      for (const marker of saveMarkers) {
        const slice = pending.slice(last, marker);
        await this.executePending(slice);
        last = marker;
      }
      if (last < pending.length) {
        await this.executePending(pending.slice(last));
      }
    }

    return { output, errors };
  }

  /* ==========================================================
     EXECUTION
     ========================================================== */

  private async executePending(pending: PendingOp[]): Promise<void> {
    const tempMap = new Map<number, number>();

    for (const op of pending) {
      if (op.kind === "CreateTheme") {
        // createTheme not shown earlier, but assumed similar to createCitation
        const created = await this.bibleService.createTheme(
          op.parentId,
          op.name,
          op.description ?? ""
        );
        tempMap.set(op.tempId, created.id);
      }

      if (op.kind === "CreateCitation") {
        const themeId = op.themeId < 0 ? tempMap.get(op.themeId)! : op.themeId;
        await this.bibleService.createCitation("", themeId, op.scriptureIds);
      }
    }
  }

  /* ==========================================================
     HELPERS
     ========================================================== */

  private buildThemeChildren(themes: ThemeExtendedModel[]): Map<number, Map<string, number>> {
    const map = new Map<number, Map<string, number>>();
    for (const t of themes) {
      if (!map.has(t.parent)) map.set(t.parent, new Map());
      map.get(t.parent)!.set(t.name.toLowerCase(), t.id);
    }
    return map;
  }

  private resolvePath(path: string, map: Map<number, Map<string, number>>): number {
    const parts = path.replace(/^\/+/, "").split("/");
    let cur = 0;
    for (const p of parts) {
      const next = map.get(cur)?.get(p.toLowerCase());
      if (!next) throw new Error(`Theme path not found: ${p}`);
      cur = next;
    }
    return cur;
  }

  private resolveChild(
    name: string,
    parent: number,
    map: Map<number, Map<string, number>>,
    created: Map<number, Set<string>>
  ): number {
    const key = name.toLowerCase();
    const c = created.get(parent);
    if (c?.has(key)) return parent; // temp themes already on stack

    const id = map.get(parent)?.get(key);
    if (!id) throw new Error(`Theme "${name}" not found.`);
    return id;
  }

  private assertUniqueThemeName(
    parent: number,
    name: string,
    map: Map<number, Map<string, number>>,
    created: Map<number, Set<string>>
  ) {
    const key = name.toLowerCase();
    if (map.get(parent)?.has(key) || created.get(parent)?.has(key)) {
      throw new Error(`Theme "${name}" already exists under this parent.`);
    }
  }

  private requireTheme(stack: number[]): number {
    if (!stack.length) throw new Error(`No active theme. Use "base" first.`);
    return stack[stack.length - 1];
  }
}
