import moment = require('moment');
import * as tk from 'timekeeper';
import * as jwt from 'jsonwebtoken';
import { Authorizer } from './../../src/authorizer';
import { baseRoles } from './../../src/helpers';
const SECRET = 'signingsecret';
describe('An Authorizer only accepts a properly formatted `Bearer {{jwt.claims.here}}', () => {
  test.each([
    'bearer jwt.claims.here',
    'Bearer nosubsections',
    'Bearer',
    'hdaoe',
    'jwt.claims.here',
    ''
  ])(
    'Constructing an Authorizer with an invalid auth header: %s throws',
    (badAuthHeader: string) => {
      expect(() => new Authorizer(badAuthHeader, SECRET)).toThrow();
    }
  );
  test('Constructing an authorizer with a valid header `Bearer jwt.claims.here` succeeds', () => {
    expect(new Authorizer('Bearer jwt.claims.here', SECRET)).toBeTruthy();
  });
  test('Constructing an Authorizer without a secret throws', () => {
    expect(() => new Authorizer('Bearer jwt.claims.here', '')).toThrow();
  });
});

describe('`authenticate()` throws IFF jwt is expired', () => {
  describe('Given: time is frozen at X', () => {
    const now = new Date();
    beforeAll(() => {
      tk.freeze(now);
    });
    afterAll(() => {
      tk.reset();
    });
    describe('And: an Authorizer wrapping an accessToken whose `claims.exp` is in the future', () => {
      let authorizer: Authorizer;
      beforeAll(() => {
        const roles = baseRoles();
        const accessToken = jwt.sign({ roles }, SECRET);
        authorizer = new Authorizer(`Bearer ${accessToken}`, SECRET);
      });
      describe('When: authenticating the authorizer', () => {
        test('Then: authorizer.authenticate() should return true', () => {
          expect(() => authorizer.authenticate()).not.toThrow();
          expect(authorizer.authenticate()).toBe(true);
        });
      });
    });
    describe('And: an Authorizer wrapping an accessToken whose `claims.exp` is in the past', () => {
      let authorizer: Authorizer;
      let tenSecondsAgo;
      beforeAll(() => {
        tenSecondsAgo = moment(now).subtract(10, 'seconds');
        tk.travel(tenSecondsAgo.toDate());
        const roles = baseRoles();
        const accessToken = jwt.sign({ roles }, SECRET, {
          expiresIn: '2sec'
        });
        authorizer = new Authorizer(`Bearer ${accessToken}`, SECRET);
        tk.travel(now);
      });
      describe('When: authenticating the authorizer', () => {
        test('Then: authorizer.authenticate() should throw', () => {
          expect(() => authorizer.authenticate()).toThrow();
        });
      });
    });
  });
});
