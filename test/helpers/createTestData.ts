import Tyr from 'tyranid';
import { Blog } from '../models/Blog';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { Chart } from '../models/Chart';
import { Inventory } from '../models/Inventory';
import { Organization } from '../models/Organization';

export async function createTestData() {
  // nuke old data...
  await Promise.all(Tyr.collections.map(c => c.remove({})));

  /**
    Organiations
   */
  const [
    chipotle,
    chopped,
    cava
  ] = await Promise.all([
    Organization.insert({ name: 'Chipotle' }),
    Organization.insert({ name: 'Chopped' }),
    Organization.insert({ name: 'Cava' })
  ]);

  /**
    Organiations
   */
  const [
    chipotleInventory,
    choppedInventory,
    cavaInventory
  ] = await Promise.all([
    Inventory.insert({ name: 'Chipotle', organizationId: chipotle.$id }),
    Inventory.insert({ name: 'Chopped', organizationId: chopped.$id }),
    Inventory.insert({ name: 'Cava', organizationId: cava.$id })
  ]);

  /**
    Blogs
   */
  const [
    chipotleFoodBlog,
    chipotleCorporateBlog,
    choppedBlog,
    cavaBlog
  ] = await Promise.all([
    Blog.insert({ name: 'Burritos Etc', organizationId: chipotle.$id }),
    Blog.insert({ name: 'Mexican Empire', organizationId: chipotle.$id }),
    Blog.insert({ name: 'Salads are great', organizationId: chopped.$id }),
    Blog.insert({ name: 'Spinach + Lentils', organizationId: cava.$id })
  ]);


  /**
    Posts
   */
  const [
    whyBurritosAreAmazing,
    ecoliChallenges,
    weDontKnowWhyPeopleGotSick,
    cleaningUp,
    burritoManagement,
    saladsAreGreat,
    guacGreens,
    lentilsAreGreat
  ] = await Promise.all([
    Blog.addPost('Why burritos are amazing.', chipotleFoodBlog),
    Blog.addPost('Ecoli challenges.', chipotleFoodBlog),
    Blog.addPost('We don\' actually know why people got sick.', chipotleFoodBlog),
    Blog.addPost('Re-evaluating the way we clean up.', chipotleCorporateBlog),
    Blog.addPost('Burrito Management, a new paradigm.', chipotleCorporateBlog),
    Blog.addPost('Salads are great, the post.', choppedBlog ),
    Blog.addPost('Guacamole Greens to the rescue!.', choppedBlog),
    Blog.addPost('Lentils are great', cavaBlog)
  ]);


  /**
    Teams
   */
  const [
    burritoMakers,
    chipotleMarketing,
    choppedExec,
    cavaEngineers
  ] = await Promise.all([
    Team.insert({ name: 'burritoMakers', organizationId: chipotle.$id }),
    Team.insert({ name: 'chipotleMarketing', organizationId: chipotle.$id }),
    Team.insert({ name: 'choppedExec', organizationId: chopped.$id }),
    Team.insert({ name: 'cavaEngineers', organizationId: cava.$id })
  ]);


  /**
    Users
   */
  const [
    ben,
    ted
  ] = await Promise.all([

    User.insert({
      name: 'ben',
      organizationId: chipotle.$id,
      teamIds: [
        burritoMakers.$id,
        chipotleMarketing.$id
      ]
    }),

    User.insert({
      name: 'ted',
      organizationId: cava.$id,
      teamIds: [
        cavaEngineers.$id
      ]
    })

  ]);

  await Promise.all([
    Chart.insert({
      name: 'test1',
      blogId: cavaBlog.$id,
      organizationId: cava.$id,
      userIds: [ ben.$id, ted.$id ]
    })
  ]);

}
