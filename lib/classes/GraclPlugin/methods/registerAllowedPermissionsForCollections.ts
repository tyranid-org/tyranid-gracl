import Tyr from 'tyranid';
import * as _ from 'lodash';
import { GraclPlugin } from '../';
import { schemaGraclConfigObject } from '../../../interfaces';


export function registerAllowedPermissionsForCollections() {
  const plugin = <GraclPlugin> this;

  if (!plugin.permissionHierarchy) {
    plugin.error(
      `Must create permissions hierarchy before registering allowed permissions`
    );
  }

  Tyr.collections.forEach(col => {
    const config = <schemaGraclConfigObject> _.get(col, 'def.graclConfig', {});

    if (config.permissions) {

      let allowedSet = new Set<string>();

      if (config.permissions.exclude) {
        const excludeSet = new Set(config.permissions.exclude);
        for (const p of plugin.setOfAllPermissions) {
          if (p && !excludeSet.has(p)) {
            allowedSet.add(p)
          }
        }
      }

      if (config.permissions.include) {
        allowedSet = new Set(config.permissions.include);
      }

      // if flagged as this collection only,
      // add all crud permissions with this collection to allowed mapping
      if (config.permissions.thisCollectionOnly) {
        allowedSet = new Set(_.chain([...plugin.crudPermissionSet.values()]).map(action => {
          if (!action) {
            return ''; // TODO: strictNullCheck hack
          } else {
            return plugin.formatPermissionType({
              action: action,
              collection: col.def.name
            });
          }
        }).compact().value());
      }


      if (allowedSet) {
        plugin.permissionRestrictions.set(col.def.name, allowedSet);
      }
    }
  });

}
