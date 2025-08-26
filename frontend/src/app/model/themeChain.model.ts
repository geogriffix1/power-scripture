export interface ThemeChainModel {
    chain: ThemeChainLinkModel[]
}

export interface ThemeChainLinkModel {
    id: number,
    name: string,
    parent: number
}
