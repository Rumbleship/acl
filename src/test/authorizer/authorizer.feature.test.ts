import { Authorizer } from './../../authorizer';
import { Roles, Resource, Actions } from './../../types';
import { Permissions } from './../../permissions-matrix';
import { createAuthHeader } from '../../helpers';
import { AuthorizerTreatAs } from '../../authorizer-treat-as.directive';
const SECRET = 'signingsecret';

const user_id = 'u_abcde';
const buyer_id = 'b_12345';
const supplier_id = 's_8eho0o9';

const adminOfUserHeader = createAuthHeader(
  {
    roles: {
      [Roles.ADMIN]: [user_id]
    },
    scopes: []
  },
  SECRET
);
const userOfUserHeader = createAuthHeader(
  {
    roles: {
      [Roles.USER]: [user_id]
    },
    scopes: []
  },
  SECRET
);

const adminOfBuyerHeader = createAuthHeader(
  {
    roles: {
      [Roles.ADMIN]: [buyer_id]
    },
    scopes: []
  },
  SECRET
);
// const userOfBuyerHeader = createAuthHeader(
//   {
//     roles: {
//       [Roles.USER]: [buyer_id]
//     },
//     scopes: []
//   },
//   SECRET
// );

describe('Working with an explicitly listed Action', () => {
  describe('Scenario: matching on default attribute:id || reflexive self-permissioning of core Authorizables (User|Division)', () => {
    describe('Given: A matrix that allows Role:Admins of Resource:User to Actions:Delete', () => {
      const matrix = new Permissions();
      // matrix.allow({
      //   role: Roles.ADMIN,
      //   at: Resource.Division,
      //   to: [Actions.CREATE, Actions.QUERY]
      // });
      // matrix.allow({
      //   role: Roles.USER,
      //   at: Resource.Division,
      //   to: [Actions.QUERY]
      // });
      matrix.allow({
        role: Roles.ADMIN,
        at: Resource.User,
        to: [Actions.DELETE]
      });

      describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${user_id}}`, () => {
        const authorizer = new Authorizer(adminOfUserHeader, SECRET);
        authorizer.authenticate();
        class Authorizable {
          constructor(public id: string) {}
        }
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${user_id}`, () => {
          const noMatchOnId = new Authorizable('u_foobar');
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, noMatchOnId, matrix)).toBe(false);
          });
        });
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${user_id}`, () => {
          const matchOnId = new Authorizable(user_id);
          test('Then: authorization is allowed', () => {
            expect(authorizer.can(Actions.DELETE, matchOnId, matrix)).toBe(true);
          });
        });
      });
      describe(`And: an authorizer wrapping a JWT that represents a {Role:User of instance: ${user_id}}`, () => {
        const authorizer = new Authorizer(userOfUserHeader, SECRET);
        authorizer.authenticate();
        class Authorizable {
          constructor(public id: string) {}
        }
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${user_id}`, () => {
          const noMatchOnId = new Authorizable('u_foobar');
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, noMatchOnId, matrix)).toBe(false);
          });
        });
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${user_id}`, () => {
          const matchOnId = new Authorizable(user_id);
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, matchOnId, matrix)).toBe(false);
          });
        });
      });
    });
  });

  describe('Scenario: matching on default association attribute:division_id', () => {
    describe('Given: A matrix that allows Role:Admins of Resource:Division to Actions:Delete', () => {
      const matrix = new Permissions();
      matrix.allow({
        role: Roles.ADMIN,
        at: Resource.Division,
        to: [Actions.DELETE]
      });
      describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${buyer_id}}`, () => {
        const authorizer = new Authorizer(adminOfBuyerHeader, SECRET);
        authorizer.authenticate();
        class Authorizable {
          constructor(public division_id: string) {}
        }
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${buyer_id}`, () => {
          const noMatchOnDivisionId = new Authorizable('b_foobar');
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, noMatchOnDivisionId, matrix)).toBe(false);
          });
        });
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${buyer_id}`, () => {
          const matchOnDivisionId = new Authorizable(buyer_id);
          test('Then: authorization is allowed', () => {
            expect(authorizer.can(Actions.DELETE, matchOnDivisionId, matrix)).toBe(true);
          });
        });
      });
      describe(`And: an authorizer wrapping a JWT that represents a {Role:User of instance: ${buyer_id}}`, () => {
        const authorizer = new Authorizer(userOfUserHeader, SECRET);
        authorizer.authenticate();
        class Authorizable {
          constructor(public id: string) {}
        }
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${buyer_id}`, () => {
          const noMatchOnId = new Authorizable('b_foobar');
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, noMatchOnId, matrix)).toBe(false);
          });
        });
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${buyer_id}`, () => {
          const matchOnId = new Authorizable(buyer_id);
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, matchOnId, matrix)).toBe(false);
          });
        });
      });
    });
  });

  describe('Scenario: matching on directive-specified association attribute:buyer_id', () => {
    class Authorizable {
      @AuthorizerTreatAs(Resource.Division)
      public buyer_id: string;
      constructor(division_id: string, public _hereforShape: string) {
        this.buyer_id = division_id;
      }
    }

    describe('Given: A matrix that allows Role:Admins of Resource:Division to Actions:Delete', () => {
      const matrix = new Permissions();
      matrix.allow({
        role: Roles.ADMIN,
        at: Resource.Division,
        to: [Actions.DELETE]
      });
      describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${buyer_id}}`, () => {
        const authorizer = new Authorizer(adminOfBuyerHeader, SECRET);
        authorizer.authenticate();

        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'buyer_id' attribute DOES NOT MATCH:${buyer_id}`, () => {
          const noMatchOnDivisionId = new Authorizable('b_foobar', 's_1209a');
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, noMatchOnDivisionId, matrix)).toBe(false);
          });
        });
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'buyer_id' attribute matches:${buyer_id}`, () => {
          const matchOnDivisionId = new Authorizable(buyer_id, supplier_id);
          test('Then: authorization is allowed', () => {
            expect(authorizer.can(Actions.DELETE, matchOnDivisionId, matrix)).toBe(true);
          });
        });
      });
      describe(`And: an authorizer wrapping a JWT that represents a {Role:User of instance: ${buyer_id}}`, () => {
        const authorizer = new Authorizer(userOfUserHeader, SECRET);
        authorizer.authenticate();
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'buyer_id' attribute DOES NOT MATCH:${buyer_id}`, () => {
          const noMatchOnId = new Authorizable('b_foobar', 's_09aoeud');
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, noMatchOnId, matrix)).toBe(false);
          });
        });
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'buyer_id' attribute matches:${buyer_id}`, () => {
          const matchOnId = new Authorizable(buyer_id, supplier_id);
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.DELETE, matchOnId, matrix)).toBe(false);
          });
        });
      });
    });
  });
});

describe('Working with an unlisted action', () => {
  describe('Scenario: matching on default attribute:id || reflexive self-permissioning of core Authorizables (User|Division)', () => {
    describe('Given: A matrix that allows Role:Admins of Resource:User to Actions:Delete', () => {
      const matrix = new Permissions();
      // matrix.allow({
      //   role: Roles.ADMIN,
      //   at: Resource.Division,
      //   to: [Actions.CREATE, Actions.QUERY]
      // });
      // matrix.allow({
      //   role: Roles.USER,
      //   at: Resource.Division,
      //   to: [Actions.QUERY]
      // });
      matrix.allow({
        role: Roles.ADMIN,
        at: Resource.User,
        to: [Actions.DELETE]
      });

      describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${user_id}}`, () => {
        const authorizer = new Authorizer(adminOfUserHeader, SECRET);
        authorizer.authenticate();
        class Authorizable {
          constructor(public id: string) {}
        }
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${user_id}`, () => {
          const noMatchOnId = new Authorizable('u_foobar');
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.READ, noMatchOnId, matrix)).toBe(false);
          });
        });
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${user_id}`, () => {
          const matchOnId = new Authorizable(user_id);
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.READ, matchOnId, matrix)).toBe(false);
          });
        });
      });
      describe(`And: an authorizer wrapping a JWT that represents a {Role:User of instance: ${user_id}}`, () => {
        const authorizer = new Authorizer(userOfUserHeader, SECRET);
        authorizer.authenticate();
        class Authorizable {
          constructor(public id: string) {}
        }
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute DOES NOT MATCH:${user_id}`, () => {
          const noMatchOnId = new Authorizable('u_foobar');
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.READ, noMatchOnId, matrix)).toBe(false);
          });
        });
        describe(`When: checking if 'Action:delete' is allowed on an Authorizable instance whose 'id' attribute matches:${user_id}`, () => {
          const matchOnId = new Authorizable(user_id);
          test('Then: authorization is denied', () => {
            expect(authorizer.can(Actions.READ, matchOnId, matrix)).toBe(false);
          });
        });
      });
    });
  });
});
