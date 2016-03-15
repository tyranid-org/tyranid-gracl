import * as Tyr from 'tyranid';

const OrganizationBaseCollection = new Tyr.Collection({
  id: 'o00',
  name: 'organization',
  dbName: 'organizations',
  fields: {
    _id: { is: 'mongoid' },
    name: { is: 'string' },
    permissions: { link: 'graclPermission' }
  }
});

export class Organization extends (<Tyr.CollectionInstance> OrganizationBaseCollection) {

}