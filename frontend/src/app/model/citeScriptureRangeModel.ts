import { ScriptureModel } from "./scripture.model";

export interface CiteScriptureRangeModel {
    citation: string,
    verses: string,
    isOpen?: boolean,
    scriptures: ScriptureModel[]
}
