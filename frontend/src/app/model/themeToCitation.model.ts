import { CitationModel } from './citation.model';
export interface ThemeToCitationModel {
    id: number,
    //citation: CitationModel,
    citationLabel: string,
    description: string,
    citationId: number,
    themeId: number,
    sequence: number
}

export interface ThemeToCitationLinkModel {
    themeToCitation: {
        id: number,
        sequence: number,
        themeId: number,
        citationId: number,
        theme: {
            id: number,
            name: string,
            description: string,
            sequence: number,
            parent: number,
            path: string
        },
        citation: {
            id: number,
            citationId: number,
            themeId: number,
            citationLabel: string,
            description: string,
            sequence: number,
            bibleOrder: number
        }
    }
}
