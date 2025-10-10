import { ThemeModel, ThemeExtendedModel } from "./theme.model";
import { ThemeToCitationModel } from "./themeToCitation.model";

export class JstreeModel {
    id: string;
    text: string;
    state: JstreeState;
    a_attr: any;
    li_attr: any;
    children: string[] | boolean;
    type: string;
    data: any;
    parent!:string;

    constructor(
        id:string,
        text:string,
        title:string,
        icon:string,
        sequence:number,
        path:string,
        state: JstreeState | any,
        citationId?:number
    ) {
        this.id = id;
        this.text = text;
        this.state = state;
        if (icon == "theme" || icon == "citation") {
            this.type = icon;
            this.a_attr = { class: `theme-tree-node-${icon}` }
        }
        else {
            this.type = "default";
        }

        this.li_attr = {
            class: 'theme-tree-node',
            title: title ?? '',
            sequence: sequence,
            citationId: citationId
        };

        this.children = <string[]>[];
        this.data = { path: path };
    }
            
    static getJstreeModel(node: any): JstreeModel {
        let pattern = /(theme|citation)(\d+)/;
        let icon = node.id.replace(pattern, '$1');
        let model = new JstreeModel(
            node.id,
            node.text,
            node.li_attr.title,
            icon,
            node.li_attr.sequence,
            node.data.path,
            new JstreeState(false, false, true),
            node.li_attr?.citationId
        );

        model.parent = node.parent;
        return model;
    }

    static getJstreeModelFromExtendedTheme(node: ThemeExtendedModel): JstreeModel {

        let jstreeModel = new JstreeModel(`theme${node.id}`, node.name, node.description, "theme", node.sequence, node.path, new JstreeState(false, false, false));
        jstreeModel.children = <string[]>[];
        node.themes.sort((a, b) => a.theme.sequence - b.theme.sequence);
        node.themes.forEach(theme => {
            (<string[]>jstreeModel.children).push(`theme${theme.theme.id}`);
        });

        node.themeToCitationLinks.sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence);
        node.themeToCitationLinks.forEach(themeToCitation => {
            (<string[]>jstreeModel.children).push(`citation${themeToCitation.themeToCitation.id}`);
        })

        if ((<string[]>jstreeModel.children).length == 0) {
            jstreeModel.children = false;
        }

        return jstreeModel;
    }

    static getJstreeModelFromThemeToCitation(node: ThemeToCitationModel): JstreeModel {
        let jstreeModel = new JstreeModel(
            `citation${node.id}`,
            node.citationLabel,
            node.description,
            "citation",
            node.sequence,
            "",
            new JstreeState(false, false, false),
            node.citationId);
        jstreeModel.children = false;
        console.log("in getJstreeModelFromThemeToCitation node: (JstreeModel)");
        console.log(node);
        return jstreeModel;
    }
}

export class JstreeState {
    opened: boolean = false;
    disabled: boolean = false;
    selected: boolean = false;

    constructor(opened:boolean, disabled:boolean, selected:boolean) {
        this.opened = opened;
        this.disabled = disabled;
        this.selected = selected;
    }
}
