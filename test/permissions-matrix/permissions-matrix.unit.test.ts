import { Permissions } from './../../src/permissions-matrix';
import { Roles, Resource, Actions } from './../../src/types';
test('Many independent sets of role->resource associations can be allowed', () => {
  const matrix = new Permissions();
  matrix.allow({ role: Roles.USER, at: Resource.Division, to: Actions.READ });
  expect(
    matrix.allows({
      role: Roles.USER,
      at: Resource.Division,
      to: Actions.READ
    })
  ).toBe(true);
  matrix.allow({ role: Roles.USER, at: Resource.User, to: Actions.READ });
  expect(
    matrix.allows({
      role: Roles.USER,
      at: Resource.Division,
      to: Actions.READ
    })
  ).toBe(true);
  expect(matrix.allows({ role: Roles.USER, at: Resource.User, to: Actions.READ })).toBe(true);
  matrix.allow({ role: Roles.ADMIN, at: Resource.User, to: Actions.CREATE });
  expect(
    matrix.allows({
      role: Roles.USER,
      at: Resource.Division,
      to: Actions.READ
    })
  ).toBe(true);
  expect(matrix.allows({ role: Roles.USER, at: Resource.User, to: Actions.READ })).toBe(true);
  expect(matrix.allows({ role: Roles.ADMIN, at: Resource.User, to: Actions.CREATE })).toBe(true);
});
test('A specific role->resource associations can be granted a single action', () => {
  const matrix = new Permissions();
  matrix.allow({ role: Roles.USER, at: Resource.Division, to: Actions.READ });
  expect(matrix.allows({ role: Roles.USER, at: Resource.Division, to: Actions.READ })).toBe(true);
  expect(
    matrix.allows({
      role: Roles.USER,
      at: Resource.Division,
      to: Actions.CREATE
    })
  ).toBe(false);
});
test('A specific role->resource association can be allowed an explicit list of actions', () => {
  const matrix = new Permissions();
  matrix.allow({
    role: Roles.USER,
    at: Resource.Division,
    to: [Actions.READ, Actions.CREATE]
  });
  expect(matrix.allows({ role: Roles.USER, at: Resource.Division, to: Actions.READ })).toBe(true);
  expect(
    matrix.allows({
      role: Roles.USER,
      at: Resource.Division,
      to: Actions.CREATE
    })
  ).toBe(true);
});

describe('Given: a matrix exists', () => {
  const matrix = new Permissions();
  describe('When: asking for a role that has not been populated', () => {
    test('Then: an empty ResourceActionsMap is returned', () => {
      expect(matrix.get(Roles.PENDING).size).toBe(0);
    });
  });
  describe('And: a User of Division is only allowed to READ', () => {
    const role = Roles.USER;
    matrix.allow({
      role,
      at: Resource.Division,
      to: [Actions.READ]
    });
    describe.each([
      [{ actions: [Actions.READ, Actions.DELETE] }],
      [{ actions: [Actions.DELETE, Actions.READ] }]
    ])(
      'When: asking about set of actions, some of which are allowed and some of which are not',
      ({ actions }) => {
        test('Then: it returns true, regardless of order of actions', () => {
          expect(
            matrix.allows({
              role,
              at: Resource.Division,
              to: actions
            })
          ).toBe(true);
        });
      }
    );
  });
  describe('When: asking about a Resource|Scope that does not map to an authorizable Resource', () => {
    test('Then: it returns falsy', () => {
      expect(matrix.allows({ role: Roles.USER, at: 'FooBar', to: Actions.READ })).toBeFalsy();
    });
  });
});
