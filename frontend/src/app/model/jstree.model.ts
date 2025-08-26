import { ThemeModel, ThemeExtendedModel } from "./theme.model";

export class JstreeModel {
    id: string;
    text: string;
    state: JstreeState;
    a_attr: any;
    li_attr: any;
    children: JstreeModel[] | boolean;
    type: string;
    data: any;
    parent!:string;

    constructor(
        id:string,
        text:string,
        title:string,
        icon:string,
        sequence:number,
        state:JstreeState
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
            sequence: sequence
        };

        this.children = <JstreeModel[]>[];
        this.data = {};
    }
            
    static getJstreeModel(node: any): JstreeModel {
        let pattern = /(theme|citation)(\d+)/;
        let icon = node.id.replace(pattern, '$1');
        let model = new JstreeModel(node.id, node.text, node.li_attr.title, icon, node.li_attr.sequence, new JstreeState(false, false, true));
        model.parent = node.parent;
        return model;
    }

    static getJstreeModelFromExtendedTheme(node: ThemeExtendedModel): JstreeModel {
        let jstreeModel = JstreeModel.getJstreeModel(node);
        jstreeModel.children = [];
        console.log("in getJstreeModelFromExtendedModel node: (JstreeModel)")
        console.log(node);
        node.themes.sort((a, b) => a.theme.sequence - b.theme.sequence);
        node.themes.forEach(theme => {
            let treeTheme = JstreeModel.getJstreeModel(theme.theme);
            (<JstreeModel[]>jstreeModel.children).push(treeTheme);
        });

        node.themeToCitationLinks.sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence);
        node.themeToCitationLinks.forEach(themeToCitation => {
            let treeTheme = JstreeModel.getJstreeModel(themeToCitation.themeToCitation);
            (<JstreeModel[]>jstreeModel.children).push(treeTheme);
        })

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
