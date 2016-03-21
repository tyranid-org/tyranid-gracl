/// <reference path='../../typings/main.d.ts' />
import * as _ from 'lodash';
import * as Tyr from 'tyranid';
import * as gracl from 'gracl';
import { GraclPlugin } from '../classes/GraclPlugin';


export const PermissionsBaseCollection = new Tyr.Collection({
  id: 'gcp',
  name: 'graclPermission',
  dbName: 'graclPermissions',
  fields: {
    _id: { is: 'mongoid' },
    subjectId: { is: 'uid' },
    resourceId: { is: 'uid' },
    subjectType: { is: 'string' },
    resourceType: { is: 'string' },
    access: {
      is: 'object',
      keys: { is: 'string' },
      of: { is: 'boolean' }
    }
  }
});


/**
  Collection to contain all permissions used by gracl

  Note: requires explicit cast to tyr.collectioninstance for tsc to pass
 */
export class PermissionsModel extends (<Tyr.CollectionInstance> PermissionsBaseCollection) {


  static validPermissionActions = new Set(['view', 'edit', 'update', 'delete']);


  static getGraclPlugin(): GraclPlugin {
    const plugin = <GraclPlugin> Tyr.secure;
    if (!plugin) {
      throw new Error(`No gracl plugin available, must instantiate GraclPlugin and pass to Tyr.config()!`);
    }
    return plugin;
  }


  static validatePermissionType(permissionType: string) {
    const [ action, collectionName ] = permissionType.split('-'),
          { validPermissionActions } = PermissionsModel;

    if (!collectionName) {
      throw new Error(
        `Invalid permissionType ${permissionType}! ` +
        `No collection name in permission type, permissions must be formatted as <action>-<collection>`
      );
    }

    if (!validPermissionActions.has(action)) {
      throw new Error(
        `Invalid permissionType ${permissionType}! ` +
        `permission action given ${action} is not valid. Must be one of ${[...validPermissionActions].join(', ')}`
      );
    }

    const plugin = PermissionsModel.getGraclPlugin();

    if (!plugin.graclHierarchy.resources.has(collectionName)) {
      throw new Error(
        `Invalid permissionType ${permissionType}! ` +
        `collection given ${collectionName} is not valid as there is no associated resource class.`
      );
    }
  }

  static async getGraclClasses(
    resourceDocument: Tyr.Document,
    subjectDocument: Tyr.Document
    ): Promise<{
      subject: gracl.Subject,
      resource: gracl.Resource
    }> {

    if (!resourceDocument) {
      throw new Error('No resource document provided!');
    }

    if (!subjectDocument) {
      throw new Error('No subject document provided (or Tyr.local.user is unavailable)!');
    }

    // extract secure and cast to plugin
    const plugin = PermissionsModel.getGraclPlugin();

    const resourceCollectionName = resourceDocument.$model.def.name,
          subjectCollectionName = subjectDocument.$model.def.name;

    if (!resourceDocument['permissions']) {
      await Tyr.byName[resourceCollectionName].populate('permissionIds', resourceDocument);
    }

    // extract subject and resource Gracl classes
    const ResourceClass = plugin.graclHierarchy.getResource(resourceCollectionName),
          SubjectClass = plugin.graclHierarchy.getSubject(subjectCollectionName);

    if (!ResourceClass) {
      throw new Error(
        `Attempted to set/get permission using ${resourceCollectionName} as resource, ` +
        `no relevant resource class found in tyranid-gracl plugin!`
      );
    }

    if (!SubjectClass) {
      throw new Error(
        `Attempted to set/get permission using ${subjectCollectionName} as subject, ` +
        `no relevant subject class found in tyranid-gracl plugin!`
      );
    }

    /**
     *  Instantiate gracl objects and set permission
     */
    const subject = new SubjectClass(subjectDocument),
          resource = new ResourceClass(resourceDocument);

    return { subject, resource };
  }


  static async setPermissionAccess(
      resourceDocument: Tyr.Document,
      permissionType: string,
      access: boolean,
      subjectDocument = Tyr.local.user
    ): Promise<Tyr.Document> {
    PermissionsModel.validatePermissionType(permissionType);

    const { subject, resource } = await PermissionsModel.getGraclClasses(resourceDocument, subjectDocument);

    // setPermissionAccess calls resource.getClass().repository.saveEntity()
    // which in turn calls PermissionsModel.updatePermissions(doc)
    await resource.setPermissionAccess(subject, permissionType, access);

    // manage permissions
    return <Tyr.Document> resource.doc;
  }


  static async isAllowed(
      resourceDocument: Tyr.Document,
      permissionType: string,
      subjectDocument = Tyr.local.user
    ): Promise<boolean> {
    PermissionsModel.validatePermissionType(permissionType);

    const { subject, resource } = await PermissionsModel.getGraclClasses(resourceDocument, subjectDocument);

    return await resource.isAllowed(subject, permissionType);
  }


  /**
   *  Given a tyranid document <doc>, update its permissions based on doc.permissions
   */
  static async updatePermissions(resourceDocument: Tyr.Document): Promise<Tyr.Document> {
    const permissions         = <gracl.Permission[]> _.get(resourceDocument, 'permissions', []),
          existingPermissions = <gracl.Permission[]> [],
          newPermissions      = <gracl.Permission[]> [],
          updated             = <Tyr.Document[]> [],
          permIdField         = PermissionsModel.def.primaryKey.field;

    // extract secure and cast to plugin
    const plugin = PermissionsModel.getGraclPlugin(),
          resourceCollectionName = resourceDocument.$model.def.name;

    if (!plugin.graclHierarchy.resources.has(resourceCollectionName)) {
      throw new Error(
        `Attempted to update permissions for document in ${resourceCollectionName} collection as resource ` +
        `but no resource class for that collection was found!`
      );
    }

    const uniquenessCheck = new Set();

    // validate + partition
    _.each(permissions, perm => {
      if (!perm.resourceId) throw new Error(`Tried to add permission for ${resourceDocument.$uid} without resourceId!`);
      if (!perm.subjectId) throw new Error(`Tried to add permission for ${resourceDocument.$uid} without subjectId!`);

      const hash = `${perm.resourceId}-${perm.subjectId}`;

      if (uniquenessCheck.has(hash)) {
        throw new Error(
          `Attempted to set duplicate permission for combination of ` +
          `resource = ${perm.resourceId}, subject = ${perm.subjectId}`
        );
      }

      uniquenessCheck.add(hash);

      if (perm[permIdField]) {
        existingPermissions.push(perm);
      } else {
        newPermissions.push(perm);
      }
    });


    const existingUpdatePromises = existingPermissions.map(perm => {
      return PermissionsModel.findAndModify({
        query: { [permIdField]: perm[permIdField] },
        update: { $set: perm },
        new: true
      });
    });

    const newPermissionPromises = newPermissions.map(perm => {
      return PermissionsModel.fromClient(perm).$save();
    });

    updated.push(...(await Promise.all(existingUpdatePromises)));
    updated.push(...(await Promise.all(newPermissionPromises)));

    // extract all the ids from the updated permissions
    resourceDocument['permissionIds'] = _.map(updated, permIdField);

    // remove permissions for this resource that are not in the given ids
    await PermissionsModel.remove({
      [permIdField]: { $nin: resourceDocument['permissionIds'] },
      resourceId: resourceDocument.$uid
    });

    const updatedResourceDocument = await resourceDocument.$save();
    return <Tyr.Document> (
      await Tyr.byName[resourceCollectionName]
        .populate('permissionIds', updatedResourceDocument)
    );
  }


  /**
   *  Given a uid, remove all permissions relating to that entity in the system
   */
  static async deletePermissions(doc: Tyr.Document): Promise<Tyr.Document> {
    const uid = doc.$uid;

    if (!uid) {
      throw new Error('No $uid property on document!');
    }

    /**
     * Get all permissions relevant to this uid
     */
    const permissions = await PermissionsModel.find({
      $or: [
        { subjectId: uid },
        { resourceId: uid }
      ]
    }, null, { tyranid: { insecure: true } });

    const permissionsByCollection = new Map<string, string[]>();

    _.each(permissions, perm => {
      const altUid = perm['subjectId'] === uid
        ? perm['resourceId']
        : perm['subjectId'];

      const parsed = Tyr.parseUid(altUid),
            collectionName = parsed.collection.def.name;

      if (!permissionsByCollection.has(collectionName)) {
        permissionsByCollection.set(collectionName, []);
      }

      permissionsByCollection.get(collectionName).push(perm.$id);
    });

    for (const [collectionName, idList] of permissionsByCollection) {
      // pull all permissions ids out of documents in this collection
      // that relate to the resourceDocument
      await Tyr.byName[collectionName].update(
        {},
        {
          $pull: {
            [PermissionsModel.def.primaryKey.field]: {
              $in: idList
            }
          }
        },
        { multi: true }
      );
    }

    delete doc['permissions'];
    doc['permissionIds'] = [];
    return doc.$save();
  }


}
