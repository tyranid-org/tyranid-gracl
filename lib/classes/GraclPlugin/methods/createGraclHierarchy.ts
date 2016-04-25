import Tyr from 'tyranid';
import * as _ from 'lodash';
import { SchemaNode, Graph } from 'gracl';
import { GraclPlugin } from '../';
import {
  Hash,
  schemaGraclConfigObject,
  TyrSchemaGraphObjects
} from '../../../interfaces';


export function createGraclHierarchy() {
  const plugin = <GraclPlugin> this,
        collections = Tyr.collections,
        nodeSet     = new Set<string>();

  const graclGraphNodes = {
    subjects: <TyrSchemaGraphObjects> {
      links: [],
      parents: []
    },
    resources: <TyrSchemaGraphObjects> {
      links: [],
      parents: []
    }
  };

  // loop through all collections, retrieve
  // ownedBy links
  collections.forEach(col => {
    const linkFields = plugin.getCollectionLinksSorted(col, { relate: 'ownedBy', direction: 'outgoing' }),
          graclConfig = <schemaGraclConfigObject> _.get(col, 'def.graclConfig', {}),
          graclTypeAnnotation = <string[]> _.get(graclConfig, 'types', []),
          collectionName = col.def.name;

    // if no links at all, skip
    if (!(linkFields.length || graclTypeAnnotation.length)) return;

    // validate that we can only have one parent of each field.
    if (linkFields.length > 1) {
      plugin.error(
        `tyranid-gracl permissions hierarchy does not allow for multiple inheritance. ` +
        `Collection ${collectionName} has multiple fields with outgoing ownedBy relations.`
      );
    }

    const [ field ] = linkFields;
    const graclType = _.get(field || {}, 'def.graclTypes', graclTypeAnnotation);

    // if no graclType property on this collection, skip the collection
    if (!(graclType && graclType.length)) return;

    while (graclType.length) {
      const currentType = graclType.pop();
      switch (currentType) {
        case 'subject':
          if (field) {
            graclGraphNodes.subjects.links.push(field);
            graclGraphNodes.subjects.parents.push(field.link);
          } else {
            graclGraphNodes.subjects.parents.push(col);
          }
          break;
        case 'resource':
          if (field) {
            graclGraphNodes.resources.links.push(field);
            graclGraphNodes.resources.parents.push(field.link);
          } else {
            graclGraphNodes.resources.parents.push(col);
          }
          break;
        default:
          plugin.error(`Invalid gracl node type set on collection ${collectionName}, type = ${graclType}`);
          break;
      }
    }

  });

  const schemaMaps = {
    subjects: new Map<string, SchemaNode>(),
    resources: new Map<string, SchemaNode>()
  };

  for (const type of ['subjects', 'resources']) {
    let nodes: Map<string, SchemaNode>,
        tyrObjects: TyrSchemaGraphObjects;

    let graclType: string;
    if (type === 'subjects') {
      nodes = schemaMaps.subjects;
      tyrObjects = graclGraphNodes.subjects;
      graclType = 'subject';
    } else {
      nodes = schemaMaps.resources;
      tyrObjects = graclGraphNodes.resources;
      graclType = 'resource';
    }

    _.each(tyrObjects.links, node => {
      const name = node.collection.def.name,
            parentName = node.link.def.name,
            parentNamePath = node.collection.parsePath(node.path);

      /**
       * Create node in Gracl graph with a custom getParents() method
       */
      nodes.set(name, plugin.createSchemaNode(node.collection, graclType, node));
    });

    _.each(tyrObjects.parents, parent => {
      const name = parent.def.name;
      if (!nodes.has(name)) {
        nodes.set(name, plugin.createSchemaNode(parent, graclType));
      }
    });

  }

  plugin.graclHierarchy = new Graph({
    subjects: Array.from(schemaMaps.subjects.values()),
    resources: Array.from(schemaMaps.resources.values())
  });
}
