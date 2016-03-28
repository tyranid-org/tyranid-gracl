import Tyr from 'tyranid';


const UserBaseCollection = new Tyr.Collection({
  id: 'u00',
  name: 'user',
  dbName: 'users',
  fields: {
    _id: { is: 'mongoid' },
    name: { is: 'string' },
    teamIds: {
      is: 'array',
      of: {
        link: 'team',
        relate: 'ownedBy',
        graclType: ['subject', 'resource']
      }
    },
    organizationId: { link: 'organization' },
    graclResourcePermissionIds: { is: 'array', link: 'graclPermission' }
  }
});


export class User extends (<Tyr.CollectionInstance> UserBaseCollection) {

}
