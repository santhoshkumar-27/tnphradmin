export class MenuItem {

    id: string;
    title: string;
    type: 'item' | 'group';
    //level: number;
    icon?: string;
    url?: string;
    children?: MenuItem[];
}