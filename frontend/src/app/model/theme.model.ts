import { ThemeToCitationLinkModel } from './themeToCitation.model'
import { JstreeModel, JstreeState } from './jstree.model';

export interface ThemeModel {
    id: number,
    name: string,
    description: string,
    parent: number,
    sequence: number,
    childCount: number,
    path: string,
    node: JstreeModel | undefined;
}

export interface ThemeModelReference {
    theme: ThemeModel;
}

export interface ThemeExtendedModel extends ThemeModel {
    expanded: boolean;
    themes: ThemeModelReference[];
    themeToCitationLinks: ThemeToCitationLinkModel[];
}