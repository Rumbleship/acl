import { InvalidJWTError } from './../../src/errors';
import moment = require('moment');
import * as tk from 'timekeeper';
import * as jwt from 'jsonwebtoken';
import { Authorizer } from './../../src/authorizer';
import { baseRoles } from './../../src/helpers';
import { MockConfig } from './../mock-config';

Authorizer.initialize(MockConfig);

describe('Given: an initialized Authorizer', () => {
  test.each(['AccessToken', 'ServiceUser'])('Then: `config.%s` is cloned', config_key => {
    expect(
      // tslint:disable-next-line: triple-equals
      Reflect.get(Reflect.get(Authorizer, 'config'), config_key) ==
        Reflect.get(MockConfig, config_key)
    ).toBe(false);
    expect(Reflect.get(Reflect.get(Authorizer, 'config'), config_key)).toStrictEqual(
      Reflect.get(MockConfig, config_key)
    );
  });
});

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
      expect(() => new Authorizer(badAuthHeader)).toThrow(InvalidJWTError);
    }
  );
  test('Constructing an authorizer with a valid header `Bearer jwt.claims.here` succeeds', () => {
    expect(new Authorizer('Bearer jwt.claims.here')).toBeTruthy();
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
        const accessToken = jwt.sign({ roles }, MockConfig.AccessToken.secret);
        authorizer = new Authorizer(`Bearer ${accessToken}`);
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
        const accessToken = jwt.sign({ roles }, MockConfig.AccessToken.secret, {
          expiresIn: '2sec'
        });
        authorizer = new Authorizer(`Bearer ${accessToken}`);
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
