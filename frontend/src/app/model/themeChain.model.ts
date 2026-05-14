export interface ThemeChainModel {
    chain: ThemeChainLinkModel[]
}

export interface ThemeChainLinkModel {
    themeId: number,
    name: string,
    remarks: boolean,
    parent: number
}
