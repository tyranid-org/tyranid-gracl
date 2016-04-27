import Tyr from 'tyranid';
import { Subject } from 'gracl';
import { GraclPlugin } from '../';

export function createSubject(subjectDocument: Tyr.Document): Subject {
  const plugin = <GraclPlugin> this;

  if (!(subjectDocument && subjectDocument.$uid)) {
    plugin.error('No subject document provided (or Tyr.local.user is unavailable)!');
  }

  const subjectCollectionName  = subjectDocument.$model.def.name,
        SubjectClass           = plugin.graclHierarchy.getSubject(subjectCollectionName);

  if (!SubjectClass) {
    plugin.error(
      `Attempted to set/get permission using ${subjectCollectionName} as subject, ` +
      `no relevant subject class found in tyranid-gracl plugin!`
    );
  }

  return new SubjectClass(subjectDocument);
}