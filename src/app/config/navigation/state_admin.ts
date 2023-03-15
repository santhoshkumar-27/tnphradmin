
export const stateAdminMenu: any[] = [
    {
        id       : 'users',
        title    : 'User',
        level    : 1,
        type     : 'group',
        icon     : 'apps',
        children : [
            {
                id   : 'list_users',
                title: 'List Users',
                level: 2,
                type : 'item',
                url  : '/apps/organizations'
            },
            {
                id       : 'add_user',
                title    : 'Add User',
                level    : 2,
                type     : 'item',
                url      : '/apps/zones'
            },
            {
                id       : 'edit_user',
                title    : 'Areas',
                level    : 2,
                type     : 'item',
                url      : '/apps/areas'
            }
        ]
    },    
];
