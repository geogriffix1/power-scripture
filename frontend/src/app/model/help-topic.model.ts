export interface HelpTopic {
    id: string;
    title: string;
    iconClass: string;
    group: 'concepts' | 'tools' | 'editing';
    content: string;
}