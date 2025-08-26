import { CitationVerseModel } from './citationVerse.model';

export interface CitationModel {
    id: number,
    citationLabel: string,
    description: string,
    bibleOrder: number
}

export interface CitationExtendedModel extends CitationModel {
    verses: CitationVerseModel[]
}