import { ScriptureModel } from "./scripture.model";

export interface CiteScriptureRangeModel {
    citation: string,
    verses: string,
    isOpen?: boolean,
    scriptures: ScriptureModel[],
    citationId?: number
}

export class NullCiteScriptureRange implements CiteScriptureRangeModel {
    citation = "";
    verses = ""
    scriptures = []
}
