/// <reference path='../../../typings/main.d.ts' />
import Tyr from 'tyranid';
import * as _ from 'lodash';
import {
  Permission,
  topologicalSort,
  Node,
  Graph,
  binaryIndexOf,
  baseCompare,
  SchemaNode,
  Subject,
  Resource,
  Repository
} from 'gracl';


import { PermissionsModel } from '../../models/PermissionsModel';
import {
  Hash,
  permissionHierarchy,
  permissionTypeList,
  pluginOptions,
  schemaGraclConfigObject,
  TyrSchemaGraphObjects
} from '../../interfaces';


// methods to mixin
import * as methods from './methods/';



@(function (pluginClass: typeof GraclPlugin) {
  Object.assign(pluginClass.prototype, methods);
  return pluginClass;
})
export class GraclPlugin {


  constructor(opts?: pluginOptions) {
    opts = opts || {};
    const plugin = this;

    if (Array.isArray(opts.permissionTypes) && opts.permissionTypes.length) {
      plugin.permissionTypes = opts.permissionTypes;
    }

    plugin.verbose = opts.verbose || false;
  };


  /**
    Create Gracl class hierarchy from tyranid schemas,
    needs to be called after all the tyranid collections are validated
   */
  boot(stage: Tyr.BootStage) {
    if (stage === 'post-link') {
      const plugin = this;

      plugin.log(`starting boot.`);

      plugin.mixInDocumentMethods();
      plugin.buildLinkGraph();
      plugin.createGraclHierarchy();
      plugin.constructPermissionHierarchy();
      plugin.registerAllowedPermissionsForCollections();

      if (plugin.verbose) plugin.logHierarchy();
    }
  }


  createIndexes() {
    return PermissionsModel.createIndexes();
  }


  graclHierarchy: Graph;
  unsecuredCollections = new Set([
    PermissionsModel.def.name
  ]);

  // some collections may have specific permissions
  // they are restricted to...
  permissionRestrictions = new Map<string, Set<string>>();


  // plugin options
  verbose: boolean;
  permissionHierarchy: permissionHierarchy;
  setOfAllPermissions: Set<string>;
  crudPermissionSet = new Set<string>();
  permissionsModel = PermissionsModel;


  permissionTypes: permissionTypeList = [
    { name: 'edit' },
    { name: 'view', parents: [ 'edit' ] },
    { name: 'delete' }
  ];

  _outgoingLinkPaths: Hash<Hash<string>>;
  _permissionChildCache: Hash<string[]> = {};
  _allPossiblePermissionsCache: string[];
  _sortedLinkCache: Hash<Tyr.Field[]> = {};


  // method mixin typings
  buildLinkGraph: typeof methods.buildLinkGraph;
  compareCollectionWithField: typeof methods.compareCollectionWithField;
  constructPermissionHierarchy: typeof methods.constructPermissionHierarchy;

  createGraclHierarchy: typeof methods.createGraclHierarchy;
  createInQueries: typeof methods.createInQueries;
  createResource: typeof methods.createResource;
  createSubject: typeof methods.createSubject;
  createSchemaNode: typeof methods.createSchemaNode;

  error: typeof methods.error;
  extractIdAndModel: typeof methods.extractIdAndModel;
  findLinkInCollection: typeof methods.findLinkInCollection;
  formatPermissionType: typeof methods.formatPermissionType;

  getAllowedPermissionsForCollection: typeof methods.getAllowedPermissionsForCollection;
  getAllPossiblePermissionTypes: typeof methods.getAllPossiblePermissionTypes;
  getCollectionLinksSorted: typeof methods.getCollectionLinksSorted;
  getGraclClasses: typeof methods.getGraclClasses;
  getObjectHierarchy: typeof methods.getObjectHierarchy;
  getPermissionChildren: typeof methods.getPermissionChildren;
  getPermissionObject: typeof methods.getPermissionObject;
  getPermissionParents: typeof methods.getPermissionParents;
  getShortestPath: typeof methods.getShortestPath;

  isCrudPermission: typeof methods.isCrudPermission;

  log: typeof methods.log;
  logHierarchy: typeof methods.logHierarchy;

  makeRepository: typeof methods.makeRepository;
  mixInDocumentMethods: typeof methods.mixInDocumentMethods;
  nextPermissions: typeof methods.nextPermissions;
  parsePermissionString: typeof methods.parsePermissionString;
  query: typeof methods.query;
  registerAllowedPermissionsForCollections: typeof methods.registerAllowedPermissionsForCollections;
  stepThroughCollectionPath: typeof methods.stepThroughCollectionPath;

  validateAsResource: typeof methods.validateAsResource;
  validatePermissionExists: typeof methods.validatePermissionExists;
  validatePermissionForResource: typeof methods.validatePermissionForResource;


}
