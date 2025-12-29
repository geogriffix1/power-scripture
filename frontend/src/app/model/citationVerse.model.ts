import { ScriptureModel } from './scripture.model';
import { CitationMarkupService } from '../citation-markup.service';
import { CitationVerseMarkup, CitationVerseMarkupKind } from './citationVerseMarkup.model';

export interface CitationVerseModel {
    id: number,
    citationId: number,
    scriptureId: number
}

export interface CitationVerseExtendedModel extends CitationVerseModel {
    scripture: ScriptureModel,
    markups: CitationVerseMarkup[];
    hide?: string,
    isOpen?: boolean;
    verseCitationLabel?: string;
    text?: string;
}

export class NullCitationVerse implements CitationVerseExtendedModel {
    id = 0;
    citationId = 0;
    scriptureId = 0;
    scripture = {
        id: 0,
        book: "",
        chapter: 0,
        verse: 0,
        text: "",
        bibleOrder: 0
    };
    markups = [];
}