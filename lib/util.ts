/// <reference path='../typings/main.d.ts' />

import * as Tyr from 'tyranid';
import * as _ from 'lodash';
import * as gracl from 'gracl';


/**
 *  parametric type for arbitrary string-keyed objects
 */
export type Hash<T> = {
  [key: string]: T;
};


/**
 *  Memoized function to find links for a given collection
    and sort them by the collection name
 */
export const getCollectionLinksSorted = (function() {

  // need to cast function to special memoized type to allow the cache property
  type memoized = {
    (col: Tyr.CollectionInstance, opts?: any): Tyr.Field[];
    cache: Hash<Tyr.Field[]>;
  };

  const defaultOpts = { direction: 'outgoing' };

  // create and cast function
  const fn = <memoized> function getCollectionLinksSorted(
      col: Tyr.CollectionInstance,
      opts: any = defaultOpts
    ): Array<Tyr.Field> {

    const collectionFieldCache = fn.cache,
          hash = `${col.def.name}:${_.pairs(opts).map(e => e.join('=')).sort().join(':')}`;

    if (collectionFieldCache[hash]) return collectionFieldCache[hash];

    // sort fields by link collection name
    const links = _.sortBy(col.links(opts), field => field.link.def.name);

    return collectionFieldCache[hash] = links;
  };

  // add cache
  fn.cache = {};
  return fn;
})();



/**
 *  Compare a collection by name with a field by name
 */
export function compareCollectionWithField(
    aCol: Tyr.CollectionInstance,
    bCol: Tyr.Field
  ) {
  const a = aCol.def.name,
        b = bCol.link.def.name;

  return gracl.baseCompare(a, b);
}



/**
 *  Function to find if <linkCollection> appears on an outgoing link field
    on <col>, uses memoized <getCollectionFieldSorted> for O(1) field lookup
    and binary search for feild search => O(log(n)) lookup
 */
export function findLinkInCollection(
    col: Tyr.CollectionInstance,
    linkCollection: Tyr.CollectionInstance
  ): Tyr.Field {

  const links = getCollectionLinksSorted(col),
        index = gracl.binaryIndexOf(links, linkCollection, compareCollectionWithField);

  return (index >= 0)
    ? links[index]
    : undefined;
}



export function createInQueries(
                  map: Map<string, Set<string>>,
                  queriedCollection: Tyr.CollectionInstance,
                  key: string
                ) {

  return Array.from(map.entries())
    .reduce((out: Hash<Hash<string[]>>, [col, uids]) => {
      // if the collection is the same as the one being queried, use the primary id field
      let prop: string;
      if (col === queriedCollection.def.name) {
        prop = queriedCollection.def.primaryKey.field;
      } else {
        const link = findLinkInCollection(queriedCollection, Tyr.byName[col]);
        prop = link.spath;
      }

      out[prop] = { [key]: [...uids] };
      return out;
    }, {});
};



/**
 *  Given collections A and B and an array of object ids of documents from A (aIds),
    find the ids of all documents in B linked to A by <aIds>
 */
export async function stepThroughCollectionPath(
                        ids: string[],
                        previousCollection: Tyr.CollectionInstance,
                        nextCollection: Tyr.CollectionInstance,
                        insecure: boolean = true
                      ) {

  // find the field in the current path collection which we need to get
  // for the ids of the next path collection
  const nextCollectionLinkField = findLinkInCollection(nextCollection, previousCollection);

  if (!nextCollectionLinkField) {
    throw new Error(
      `cannot step through collection path, as no link to collection ${nextCollection.def.name} ` +
      `from collection ${previousCollection.def.name}`
    );
  }

  const nextCollectionId = nextCollection.def.primaryKey.field;

  return <string[]> _
    // get the objects in the second to last collection of the path using
    // the ids of the last collection in the path
    .chain(await nextCollection.find(
      { [nextCollectionLinkField.spath]: { $in: ids } },
      { _id: 1, [nextCollectionId]: 1 },
      { tyranid: { insecure } }
    ))
    // extract their primary ids using the primary field
    .map(nextCollectionId)
    .value();
}
