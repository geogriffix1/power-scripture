export interface ScriptureModel {
    id: number,
    book: string,
    chapter: number,
    verse: number,
    text: string,
    bibleOrder: number
}

export interface ScriptureSearchResultModel extends ScriptureModel {
    substrings: any[]
}