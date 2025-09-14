import { ScriptureModel } from './scripture.model';
import { CitationMarkupModel } from './CitationMarkup.model';

export interface CitationVerseModel {
    id: number,
    citationId: number,
    scriptureId: string,
    parent: number
}

export interface CitationVerseExtendedModel extends CitationVerseModel {
    scripture: ScriptureModel,
    markups: CitationMarkupModel[];
}