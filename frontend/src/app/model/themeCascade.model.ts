import { ThemeChainLinkModel } from "./themeChain.model"

export interface ThemeCascadeModel {
    themes: ThemeChainLinkModel[],
    citations: ThemeCascadeCitationModel[]
}

export interface ThemeCascadeCitationModel {
    themeId: number,
    themeToCitationId: number,
    citationId: number
}
