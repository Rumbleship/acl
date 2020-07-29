import { Authorizer } from './../../src/authorizer';
import { Permissions } from './../../src/permissions-matrix';
import { Roles, Resource, Scopes, Actions } from './../../src/types';
import { AuthorizerTreatAs } from './../../src/authorizer-treat-as.directive';
import { MockConfig } from './../mock-config';
import { Oid } from '@rumbleship/oid';

Authorizer.initialize(MockConfig);

const user_id = Oid.create('User', 1).oid;
const another_user_id = Oid.create('User', 2).oid;
const buyer_id = Oid.create('Buyer', 1).oid;
const supplier_id = Oid.create('Supplier', 2).oid;

const adminOfUserIdHeader = Authorizer.createAuthHeader({
  user: user_id,
  roles: {
    [Roles.ADMIN]: [user_id]
  },
  scopes: [Scopes.USER]
});
const adminOfAnotherUserIdHeader = Authorizer.createAuthHeader({
  user: user_id,
  roles: {
    [Roles.ADMIN]: [user_id, another_user_id]
  },
  scopes: [Scopes.USER]
});
const userOfUserIdHeader = Authorizer.createAuthHeader({
  user: user_id,
  roles: {
    [Roles.USER]: [user_id]
  },
  scopes: [Scopes.USER]
});
const adminOfBuyerIdHeader = Authorizer.createAuthHeader({
  user: user_id,
  roles: {
    [Roles.ADMIN]: [buyer_id]
  },
  scopes: [Scopes.USER]
});

describe('Working with an explicitly listed Action', () => {
  describe('Scenario: matching on default attribute:id || reflexive self-permissioning of core Authorizables (User|Division)', () => {
    describe('Given: A matrix that allows Role:Admins of Resource:User to Actions:Delete', () => {
      const matrix = new Permissions();
      matrix.allow({
        role: Roles.ADMIN,
        at: Resource.User,
        to: [Actions.DELETE]
      });

      describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${user_id}}`, () => {
        const authorizer = new Authorizer(adminOfUserIdHeader);
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
        const authorizer = new Authorizer(userOfUserIdHeader);
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
        const authorizer = new Authorizer(adminOfBuyerIdHeader);
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
        const authorizer = new Authorizer(userOfUserIdHeader);
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
        const authorizer = new Authorizer(adminOfBuyerIdHeader);
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
        const authorizer = new Authorizer(userOfUserIdHeader);
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
      matrix.allow({
        role: Roles.ADMIN,
        at: Resource.User,
        to: [Actions.DELETE]
      });

      describe(`And: an authorizer wrapping a JWT that represents a {Role:Admin of instance: ${user_id}}`, () => {
        const authorizer = new Authorizer(adminOfUserIdHeader);
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
        const authorizer = new Authorizer(userOfUserIdHeader);
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
describe('Feature: a user can ask an authorizer for a list of ids that have permission to perform a specified set of actions', () => {
  describe(`Given: A matrix that allows:
    Role:Admins of Resource:User to Actions:Delete
    Role:Admins of Resource:Division to Actions:Read 
    Role: Users of Resource:User to Actions:Read`, () => {
    const matrix = new Permissions();
    matrix.allow({
      role: Roles.ADMIN,
      at: Resource.User,
      to: [Actions.DELETE]
    });
    matrix.allow({
      role: Roles.ADMIN,
      at: Resource.Division,
      to: [Actions.READ]
    });
    matrix.allow({
      role: Roles.USER,
      at: Resource.User,
      to: [Actions.READ]
    });
    describe(`And: a JWT that represents a {role:Admin of instance: ${user_id}}`, () => {
      const authorizer = new Authorizer(adminOfUserIdHeader);
      authorizer.authenticate();
      describe('When: asking for ids that can perform an allowed action: DELETE', () => {
        test(`Then: the known id ${user_id} is returned`, () => {
          expect(authorizer.identifiersThatCan({ action: Actions.DELETE, matrix })).toStrictEqual([
            user_id
          ]);
        });
      });
      describe('When: asking for ids that can perform a disallowed action: UPDATE', () => {
        test(`Then: no ids are returned`, () => {
          expect(authorizer.identifiersThatCan({ action: Actions.UPDATE, matrix })).toStrictEqual(
            []
          );
        });
      });
    });
    describe(`And: a JWT that represents a {role:Admin of instance: ${another_user_id}}`, () => {
      const authorizer = new Authorizer(adminOfAnotherUserIdHeader);
      authorizer.authenticate();
      describe('When: asking for ids that can perform an allowed action: DELETE', () => {
        const ids = authorizer.identifiersThatCan({
          action: Actions.DELETE,
          matrix
        });
        test(`Then: the known id of target (${another_user_id}) is returned`, () => {
          expect(ids.includes(another_user_id)).toBe(true);
        });
        test(`Then: the known id of self (${user_id}) is returned`, () => {
          expect(ids.includes(user_id)).toBe(true);
        });
        test('Then: only two ids are returned', () => {
          expect(ids.length).toBe(2);
        });
      });
      describe('When: asking for ids that can perform a disallowed action: UPDATE', () => {
        test(`Then: no ids are returned`, () => {
          expect(authorizer.identifiersThatCan({ action: Actions.UPDATE, matrix })).toStrictEqual(
            []
          );
        });
      });
    });
    describe(`And: a JWT that represents a user with:
       { user (self): ${user_id},
         role:Admin of instance: ${another_user_id}, 
         role:Admin of instance: ${buyer_id},
         role:User of instance: ${supplier_id} }`, () => {
      const authorizer = new Authorizer(
        Authorizer.createAuthHeader({
          user: user_id,
          roles: {
            [Roles.ADMIN]: [another_user_id, buyer_id],
            [Roles.USER]: [supplier_id]
          },
          scopes: [Scopes.USER]
        })
      );
      authorizer.authenticate();
      describe(`When: asking for ids that can perform an action: DELETE`, () => {
        const possibles = authorizer.identifiersThatCan({
          action: Actions.DELETE,
          matrix
        });
        test(`Then: the known id ${another_user_id} is included in returned list`, () => {
          expect(possibles.includes(another_user_id)).toBe(true);
        });
        test(`Then: the known id ${another_user_id} is included in returned list`, () => {
          expect(possibles.includes(another_user_id)).toBe(true);
        });
        test(`Then: a known id whose role matches but under the wrong authorizable resource type `, () => {
          expect(possibles.includes(buyer_id)).toBe(false);
        });
      });
      describe('When: asking for ids that can perform a disallowed action: UPDATE', () => {
        test(`Then: no ids are returned`, () => {
          expect(authorizer.identifiersThatCan({ action: Actions.UPDATE, matrix })).toStrictEqual(
            []
          );
        });
      });
      describe('When: asking for ids that can perform an action: READ', () => {
        const possibles = authorizer.identifiersThatCan({
          action: Actions.READ,
          matrix
        });
        test(`Then: the known id ${buyer_id} is returned`, () => {
          expect(possibles.includes(buyer_id)).toBe(true);
        });
      });
    });
    describe(`And: a JWT that represents a user with:
      { user(self): ${user_id}
        role:Admin of Division instance: ${buyer_id}
        role:User of User instance: ${another_user_id}
      },`, () => {
      const authorizer = new Authorizer(
        Authorizer.createAuthHeader({
          user: user_id,
          roles: {
            [Roles.ADMIN]: [buyer_id],
            [Roles.USER]: [another_user_id]
          },
          scopes: [Scopes.USER]
        })
      );
      authorizer.authenticate();
      describe('When: asking for ids that can READ, unfiltered', () => {
        test(`Then: the buyer_id ${buyer_id} is returned`, () => {
          expect(
            authorizer.identifiersThatCan({ action: Actions.READ, matrix }).includes(buyer_id)
          ).toBe(true);
        });
        test(`Then: the another_user_id ${another_user_id} is returned`, () => {
          expect(
            authorizer
              .identifiersThatCan({ action: Actions.READ, matrix })
              .includes(another_user_id)
          ).toBe(true);
        });
      });
      describe('When: asking for ids that can READ, filtered to Resource.Division', () => {
        test(`Then: the buyer_id ${buyer_id} is returned`, () => {
          expect(
            authorizer
              .identifiersThatCan({
                action: Actions.READ,
                matrix,
                only: Resource.Division
              })
              .includes(buyer_id)
          ).toBe(true);
        });
        test(`Then: the another_user_id ${another_user_id} is not returned`, () => {
          expect(
            authorizer
              .identifiersThatCan({
                action: Actions.READ,
                matrix,
                only: Resource.Division
              })
              .includes(another_user_id)
          ).toBe(false);
        });
        test(`Then: the user_id ${user_id} is not returned`, () => {
          expect(
            authorizer
              .identifiersThatCan({
                action: Actions.READ,
                matrix,
                only: Resource.Division
              })
              .includes(another_user_id)
          ).toBe(false);
        });
      });
      describe('When: asking for ids that can READ, filtered to Resource.User', () => {
        test(`Then: the another_user_id ${another_user_id} is returned`, () => {
          expect(
            authorizer
              .identifiersThatCan({
                action: Actions.READ,
                matrix,
                only: Resource.User
              })
              .includes(another_user_id)
          ).toBe(true);
        });
        test(`Then: the user_id ${user_id} (e.g. 'user' attribute in JWT) is not returned`, () => {
          expect(
            authorizer
              .identifiersThatCan({
                action: Actions.READ,
                matrix,
                only: Resource.User
              })
              .includes(user_id)
          ).toBe(false);
        });
        test(`Then: the buyer_id ${buyer_id} is not returned`, () => {
          expect(
            authorizer
              .identifiersThatCan({
                action: Actions.READ,
                matrix,
                only: Resource.User
              })
              .includes(buyer_id)
          ).toBe(false);
        });
      });
    });
  });
});

describe('Feature: methods throw if the authorizer has not yet been authenticated', () => {
  describe('Given: two authorizers, one authenticated, one not, exist', () => {
    const id = 'b_abcde';
    const authHeader = Authorizer.createAuthHeader({
      roles: {
        [Roles.ADMIN]: [id],
        [Roles.USER]: [],
        [Roles.PENDING]: []
      },
      user: 'u_abcde',
      client: 'here for good measure',
      scopes: [Scopes.BANKINGADMIN]
    });
    const unauthenticated = new Authorizer(authHeader);
    const authenticated = new Authorizer(authHeader);
    beforeAll(() => {
      authenticated.authenticate();
    });
    describe.each(['getUser', 'inScope'])(
      'When: invoking %s on the unauthenticated authorizer',
      methodName => {
        test('Then: an error is thrown', () => {
          expect(() => (unauthenticated as any)[methodName]()).toThrowError();
        });
      }
    );
    describe.each(['getUser', 'inScope'])(
      'When: invoking %s on the authenticated authorizer',
      methodName => {
        test('Then: no error is thrown', () => {
          expect(() => (authenticated as any)[methodName]()).not.toThrowError();
        });
      }
    );
    test('Then: inScope passes args through decorator', () => {
      expect(authenticated.inScope(Scopes.BANKINGADMIN)).toBe(true);
      expect(authenticated.inScope([Scopes.BANKINGADMIN])).toBe(true);
    });
  });
});

describe('Feature: `inScope()` always returns true for a system administrator', () => {
  describe('Given: A user with an authHeader that contains SYSADMIN scope', () => {
    const id = 'u_12345';
    const authHeader = Authorizer.createAuthHeader({
      roles: {
        [Roles.ADMIN]: [id],
        [Roles.USER]: [],
        [Roles.PENDING]: []
      },
      scopes: [Scopes.SYSADMIN]
    });
    const authorizer = new Authorizer(authHeader);
    authorizer.authenticate();
    describe('When: asking for a more specific scope, e.g. BANKINGADMIN', () => {
      test('Then: `inScope()` returns true', () => {
        expect(authorizer.inScope(Scopes.BANKINGADMIN)).toBe(true);
      });
    });
  });
});
describe('Feature: `inScope()` accepts an array or a single scope', () => {
  const id = 'u_12345';
  const authHeader = Authorizer.createAuthHeader({
    roles: {
      [Roles.ADMIN]: [id],
      [Roles.USER]: [],
      [Roles.PENDING]: []
    },
    scopes: [Scopes.BANKINGADMIN]
  });
  const authorizer = new Authorizer(authHeader);
  authorizer.authenticate();
  describe('When querying inScope with a single parameter', () => {
    test('Then: a missing scope fails', () => {
      expect(authorizer.inScope(Scopes.ORDERADMIN)).toBe(false);
    });
    test('Then: a present scope passes', () => {
      expect(authorizer.inScope(Scopes.BANKINGADMIN)).toBe(true);
    });
  });
  describe('When querying inScope with an array parameter', () => {
    test('Then: a missing scope fails', () => {
      expect(authorizer.inScope([Scopes.ORDERADMIN])).toBe(false);
    });
    test('Then: a present scope passes', () => {
      expect(authorizer.inScope([Scopes.BANKINGADMIN])).toBe(true);
    });
  });
});
