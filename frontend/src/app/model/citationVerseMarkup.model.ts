export enum CitationVerseMarkupKind {
  Highlight = 'highlight',
  Suppress  = 'suppress',
  Replace   = 'replace',
  Paragraph = 'paragraph'
}

export interface CitationVerseMarkup {
  id: number;
  citationId: number;
  verseId: number;
  startIndex: number;
  endIndex: number;
  kind: CitationVerseMarkupKind;
  replacementText?: string;
}

export interface PristineSelection {
  verseId: number;
  startIndex: number;
  endIndex: number;
  caretIndex: number; // used for paragraph breaks and restoring caret
}