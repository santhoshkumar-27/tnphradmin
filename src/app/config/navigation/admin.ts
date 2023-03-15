import { MenuItem } from "src/app/models/menu_item";
export const adminMenu: MenuItem[] = [
    {
        id       : 'users',
        title    : 'User',
        type     : 'group',
        icon     : 'apps',
        children : [
            {
                id   : 'list_users',
                title: 'List Users',
                type : 'item',
                url  : '/apps/organizations'
            },
            {
                id       : 'add_user',
                title    : 'Add User',
                type     : 'item',
                url      : '/apps/zones'
            },
            {
                id       : 'edit_user',
                title    : 'Edit User',
                type     : 'item',
                url      : '/apps/areas'
            },
            {
                id       : 'role_user',
                title    : 'Roles',
                type     : 'group',
                url      : '/apps/areas',
                children : [
                    {
                        id       : 'add_role',
                        title    : 'Add Role',
                        type     : 'item',
                        url      : '/apps/areas'
                    },
                    {
                        id       : 'edit_role',
                        title    : 'Edit Role',
                        type     : 'item',
                        url      : '/apps/areas'
                    },                
                ]
            }
        ]
    },    
];
