"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const _ = require('lodash');
const tyranid_1 = require('tyranid');
const PermissionsLocks_1 = require('./PermissionsLocks');
exports.PermissionsBaseCollection = new tyranid_1.default.Collection({
    id: '_gp',
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
class PermissionsModel extends exports.PermissionsBaseCollection {
    static getGraclPlugin() {
        const plugin = tyranid_1.default.secure;
        if (!plugin) {
            throw new Error(`No gracl plugin available, must instantiate GraclPlugin and pass to Tyr.config()!`);
        }
        return plugin;
    }
    static validatePermissionType(permissionType, queriedCollection) {
        const plugin = PermissionsModel.getGraclPlugin(), components = plugin.parsePermissionString(permissionType);
        if (!plugin.getPermissionObject(permissionType)) {
            throw new Error(`Invalid permissionType ${permissionType}! ` +
                `permission action given ("${components.action}") is not valid. Must be one of (${_.keys(plugin.permissionHierarchy).join(', ')})`);
        }
        if (components.collection) {
            const permissionCollection = tyranid_1.default.byName[components.collection];
            if (!permissionCollection) {
                throw new Error(`No collection ${components.collection}, permission ` +
                    `of type <action>-<collection> must contain valid collection!`);
            }
            PermissionsModel.validateAsResource(permissionCollection);
            PermissionsModel.validateAsResource(queriedCollection);
            const queriedResourceHierarchy = plugin
                .graclHierarchy
                .getResource(queriedCollection.def.name)
                .getHierarchyClassNames();
            const permissionResourceHierarchy = plugin
                .graclHierarchy
                .getResource(components.collection)
                .getHierarchyClassNames();
            if (!(_.contains(permissionResourceHierarchy, queriedCollection.def.name) ||
                _.contains(queriedResourceHierarchy, components.collection))) {
                throw new Error(`Cannot set permission "${permissionType}" on collection ` +
                    `"${components.collection}" as resource, as collection "${queriedCollection.def.name}" ` +
                    `does not exist in the resource hierarchy of "${components.collection}"`);
            }
        }
    }
    static validateAsResource(collection) {
        const plugin = PermissionsModel.getGraclPlugin();
        if (!collection) {
            throw new Error(`Attempted to validate undefined collection!`);
        }
        if (!plugin.graclHierarchy.resources.has(collection.def.name)) {
            throw new Error(`Attempted to set/get permission using ${collection.def.name} as resource, ` +
                `no relevant resource class found in tyranid-gracl plugin!`);
        }
    }
    static getGraclClasses(resourceDocument, subjectDocument) {
        return __awaiter(this, void 0, Promise, function* () {
            if (!(resourceDocument && resourceDocument.$uid)) {
                throw new Error('No resource document provided!');
            }
            if (!(subjectDocument && subjectDocument.$uid)) {
                throw new Error('No subject document provided (or Tyr.local.user is unavailable)!');
            }
            const plugin = PermissionsModel.getGraclPlugin(), resourceCollectionName = resourceDocument.$model.def.name, subjectCollectionName = subjectDocument.$model.def.name, ResourceClass = plugin.graclHierarchy.getResource(resourceCollectionName), SubjectClass = plugin.graclHierarchy.getSubject(subjectCollectionName);
            if (!resourceDocument[plugin.populatedPermissionsProperty]) {
                yield tyranid_1.default.byName[resourceCollectionName]
                    .populate(plugin.permissionIdProperty, resourceDocument);
            }
            if (!ResourceClass) {
                throw new Error(`Attempted to set/get permission using ${resourceCollectionName} as resource, ` +
                    `no relevant resource class found in tyranid-gracl plugin!`);
            }
            if (!SubjectClass) {
                throw new Error(`Attempted to set/get permission using ${subjectCollectionName} as subject, ` +
                    `no relevant subject class found in tyranid-gracl plugin!`);
            }
            const subject = new SubjectClass(subjectDocument), resource = new ResourceClass(resourceDocument);
            return { subject: subject, resource: resource };
        });
    }
    static setPermissionAccess(resourceDocument, permissionType, access, subjectDocument = tyranid_1.default.local.user, abstract = false) {
        return __awaiter(this, void 0, Promise, function* () {
            if (!abstract)
                PermissionsModel.validatePermissionType(permissionType, resourceDocument.$model);
            const plugin = PermissionsModel.getGraclPlugin();
            const { subject, resource } = yield PermissionsModel.getGraclClasses(resourceDocument, subjectDocument);
            const set = yield resource.setPermissionAccess(subject, permissionType, access);
            return set.doc;
        });
    }
    static isAllowed(resourceDocument, permissionType, subjectDocument = tyranid_1.default.local.user, abstract = false) {
        return __awaiter(this, void 0, Promise, function* () {
            if (!abstract)
                PermissionsModel.validatePermissionType(permissionType, resourceDocument.$model);
            const plugin = PermissionsModel.getGraclPlugin();
            if (!resourceDocument[plugin.populatedPermissionsProperty]) {
                resourceDocument = yield resourceDocument.$populate(plugin.permissionIdProperty);
            }
            const { subject, resource } = yield PermissionsModel.getGraclClasses(resourceDocument, subjectDocument), components = plugin.parsePermissionString(permissionType), nextPermissions = plugin.nextPermissions(permissionType), access = yield resource.isAllowed(subject, permissionType);
            if (!access && nextPermissions) {
                for (const nextPermission of nextPermissions) {
                    const parentAccess = yield PermissionsModel
                        .isAllowed(resourceDocument, nextPermission, subjectDocument, abstract);
                    if (parentAccess)
                        return true;
                }
            }
            return access;
        });
    }
    static explainPermission(resourceDocument, permissionType, subjectDocument = tyranid_1.default.local.user, abstract = false) {
        return __awaiter(this, void 0, Promise, function* () {
            if (!abstract)
                PermissionsModel.validatePermissionType(permissionType, resourceDocument.$model);
            const { subject, resource } = yield PermissionsModel.getGraclClasses(resourceDocument, subjectDocument);
            return yield resource.determineAccess(subject, permissionType);
        });
    }
    static lockPermissionsForResource(resourceDocument) {
        return __awaiter(this, void 0, Promise, function* () {
            if (!(resourceDocument && resourceDocument.$uid)) {
                throw new Error('No resource document provided!');
            }
            const lock = yield PermissionsLocks_1.PermissionLocks.findAndModify({
                query: {
                    resourceId: resourceDocument.$uid
                },
                update: {
                    $set: {
                        locked: true
                    }
                },
                new: false,
                upsert: true
            });
            if (lock['value'] && lock['value']['locked'] === true) {
                throw new Error(`Cannot update permissions for resource ${resourceDocument.$uid} as another update is in progress!`);
            }
        });
    }
    static unlockPermissionsForResource(resourceDocument) {
        return __awaiter(this, void 0, Promise, function* () {
            if (!(resourceDocument && resourceDocument.$uid)) {
                throw new Error('No resource document provided!');
            }
            const lock = yield PermissionsLocks_1.PermissionLocks.findAndModify({
                query: {
                    resourceId: resourceDocument.$uid
                },
                update: {
                    $set: {
                        locked: false
                    }
                },
                new: false,
                upsert: true
            });
            if (!lock['value']) {
                throw new Error(`Attempted to unlock permissions that were not locked!`);
            }
        });
    }
    static updatePermissions(resourceDocument) {
        return __awaiter(this, void 0, Promise, function* () {
            if (!resourceDocument) {
                throw new TypeError(`called PermissionsModel.updatePermissions() on undefined`);
            }
            if (!resourceDocument.$uid) {
                throw new TypeError(`resource document must be a Tyranid document with $uid`);
            }
            PermissionsModel.validateAsResource(resourceDocument.$model);
            const plugin = PermissionsModel.getGraclPlugin();
            const permissions = _.get(resourceDocument, plugin.populatedPermissionsProperty, []), existingPermissions = [], newPermissions = [], updated = [], permIdField = PermissionsModel.def.primaryKey.field;
            delete resourceDocument[plugin.populatedPermissionsProperty];
            yield PermissionsModel.lockPermissionsForResource(resourceDocument);
            const resourceCollectionName = resourceDocument.$model.def.name;
            const subjectIds = _.chain(permissions)
                .map('subjectId')
                .compact()
                .value();
            const existingSubjects = yield tyranid_1.default.byUids(subjectIds);
            const existingSubjectIdsFromPermissions = _.reduce(existingSubjects, (out, entity) => {
                out.add(entity.$uid);
                return out;
            }, new Set());
            const uniquenessCheck = new Set();
            _.chain(permissions)
                .filter(perm => {
                return (perm.subjectId && existingSubjectIdsFromPermissions.has(perm.subjectId));
            })
                .each(perm => {
                if (!perm.resourceId) {
                    throw new Error(`Tried to add permission for ${resourceDocument.$uid} without resourceId!`);
                }
                const hash = `${perm.resourceId}-${perm.subjectId}`;
                if (uniquenessCheck.has(hash)) {
                    throw new Error(`Attempted to set duplicate permission for combination of ` +
                        `resource = ${perm.resourceId}, subject = ${perm.subjectId}`);
                }
                uniquenessCheck.add(hash);
                if (perm[permIdField]) {
                    existingPermissions.push(perm);
                }
                else {
                    newPermissions.push(perm);
                }
            })
                .value();
            const existingUpdates = yield Promise.all(existingPermissions.map((perm) => __awaiter(this, void 0, void 0, function* () {
                const update = yield PermissionsModel.findAndModify({
                    query: {
                        [permIdField]: perm[permIdField]
                    },
                    update: { $set: perm },
                    new: true
                });
                return update['value'];
            })));
            const newPermissionInserts = yield Promise.all(newPermissions.map(perm => {
                return PermissionsModel.fromClient(perm).$insert();
            }));
            updated.push(...existingUpdates);
            updated.push(...newPermissionInserts);
            const updatedIds = resourceDocument[plugin.permissionIdProperty] = _.chain(updated)
                .compact()
                .map(permIdField)
                .value();
            const removeQuery = {
                [permIdField]: { $nin: updatedIds },
                resourceId: resourceDocument.$uid
            };
            yield PermissionsModel.remove(removeQuery);
            const updatedResourceDocument = yield resourceDocument.$save();
            const populated = (yield tyranid_1.default.byName[resourceCollectionName]
                .populate(plugin.permissionIdProperty, updatedResourceDocument));
            yield PermissionsModel.unlockPermissionsForResource(resourceDocument);
            return populated;
        });
    }
    static deletePermissions(doc) {
        return __awaiter(this, void 0, Promise, function* () {
            const uid = doc.$uid;
            if (!uid)
                throw new Error('No $uid property on document!');
            yield PermissionsModel.lockPermissionsForResource(doc);
            const permissions = yield PermissionsModel.find({
                $or: [
                    { subjectId: uid },
                    { resourceId: uid }
                ]
            }), permissionsByCollection = new Map(), plugin = PermissionsModel.getGraclPlugin();
            _.each(permissions, perm => {
                const altUid = perm['subjectId'] === uid
                    ? perm['resourceId']
                    : perm['subjectId'];
                const parsed = tyranid_1.default.parseUid(altUid), collectionName = parsed.collection.def.name;
                if (!permissionsByCollection.has(collectionName)) {
                    permissionsByCollection.set(collectionName, []);
                }
                permissionsByCollection.get(collectionName).push(perm.$id);
            });
            for (const [collectionName, idList] of permissionsByCollection) {
                yield tyranid_1.default.byName[collectionName].update({
                    [plugin.permissionIdProperty]: {
                        $in: idList
                    }
                }, {
                    $pull: {
                        [plugin.permissionIdProperty]: {
                            $in: idList
                        }
                    }
                }, { multi: true });
            }
            delete doc[plugin.populatedPermissionsProperty];
            doc[plugin.permissionIdProperty] = [];
            yield doc.$save();
            yield PermissionsModel.unlockPermissionsForResource(doc);
            return doc;
        });
    }
}
exports.PermissionsModel = PermissionsModel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGVybWlzc2lvbnNNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9tb2RlbHMvUGVybWlzc2lvbnNNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSxNQUFZLENBQUMsV0FBTSxRQUFRLENBQUMsQ0FBQTtBQUM1QiwwQkFBZ0IsU0FBUyxDQUFDLENBQUE7QUFHMUIsbUNBQWdDLG9CQUFvQixDQUFDLENBQUE7QUFHeEMsaUNBQXlCLEdBQUcsSUFBSSxpQkFBRyxDQUFDLFVBQVUsQ0FBQztJQUMxRCxFQUFFLEVBQUUsS0FBSztJQUNULElBQUksRUFBRSxpQkFBaUI7SUFDdkIsTUFBTSxFQUFFLGtCQUFrQjtJQUMxQixNQUFNLEVBQUU7UUFDTixHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFO1FBQ3RCLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUU7UUFDeEIsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRTtRQUN6QixXQUFXLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFO1FBQzdCLFlBQVksRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUU7UUFDOUIsTUFBTSxFQUFFO1lBQ04sRUFBRSxFQUFFLFFBQVE7WUFDWixJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFO1lBQ3RCLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUU7U0FDdEI7S0FDRjtDQUNGLENBQUMsQ0FBQztBQVFILCtCQUFnRSxpQ0FBMEI7SUFHeEYsT0FBTyxjQUFjO1FBQ25CLE1BQU0sTUFBTSxHQUFpQixpQkFBRyxDQUFDLE1BQU0sQ0FBQztRQUN4QyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLG1GQUFtRixDQUFDLENBQUM7UUFDdkcsQ0FBQztRQUNELE1BQU0s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