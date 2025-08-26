import { ScriptureModel } from './scripture.model';
import { CitationVerseMarkupModel } from './citationVerseMarkup.model';

export interface CitationVerseModel {
    id: number,
    citationId: number,
    scriptureId: string,
    parent: number
}

export interface CitationVerseExtendedModel extends CitationVerseModel {
    scripture: ScriptureModel,
    markups: CitationVerseMarkupModel[];
}