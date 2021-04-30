import { Roles, Scopes, Claims, AccessClaims } from './../../src/types';
import { InvalidJWTError } from './../../src/errors';
import moment = require('moment');
import * as tk from 'timekeeper';
import * as jwt from 'jsonwebtoken';
import { Authorizer } from './../../src/authorizer';
import { baseRoles } from './../../src/helpers';
import { MockConfig } from './../mock-config';
import { Oid } from '@rumbleship/oid';

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
    expect(() => new Authorizer('Bearer jwt.claims.here')).not.toThrow();
  });
});

describe('Checking if an authorizer is expired', () => {
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
      describe('When: checking expiredness', () => {
        test('Then: authorizer.authenticate() should not throw', () => {
          expect(() => authorizer.authenticate()).not.toThrow();
        });
        test('Then: authorizer.isExpired() is false', () => {
          expect(authorizer.isExpired()).toBe(false);
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
      describe('When: checking expiredness', () => {
        test('Then: authorizer.authenticate() should throw', () => {
          expect(() => authorizer.authenticate()).toThrow();
        });
        test('Then: authorizer.isExpired() returns true', () => {
          expect(authorizer.isExpired()).toEqual(true);
        });
      });
    });
  });
});

describe('Feature: Marshaling an Authorizer', () => {
  const id = 'u_12345';
  const claims: AccessClaims = {
    user: id,
    roles: {
      [Roles.ADMIN]: [id],
      [Roles.USER]: [],
      [Roles.PENDING]: []
    },
    scopes: [Scopes.USER]
  };
  const authHeader = Authorizer.createAuthHeader(claims);
  const authorizer = new Authorizer(authHeader);
  authorizer.authenticate();
  describe('When: extracting the marshaled string', () => {
    test('Then: a base64 encoded string is returned', () => {
      const marshalled = authorizer.marshalClaims();
      expect(typeof marshalled).toBe('string');
      expect(JSON.parse(Buffer.from(marshalled, 'base64').toString('ascii'))).toStrictEqual(claims);
    });
    test.each(['iat', 'exp'])(
      'Then: the marshalled claims do not contain the lib-generated `%s` val',
      deleted_claim => {
        const marshalled = authorizer.marshalClaims();
        const hydrated = JSON.parse(Buffer.from(marshalled, 'base64').toString('ascii'));
        expect(Object.keys(hydrated).includes(deleted_claim)).toBe(false);
      }
    );
  });

  describe('When: making an authorizer from marshaled string', () => {
    test('Then: an authorizer with default expriry is returned', () => {
      const marshalled = authorizer.marshalClaims();
      const the_future = moment().add(5, 'days').milliseconds(0);
      tk.freeze(the_future.toDate());
      const hydrated = Authorizer.make(marshalled);
      hydrated.authenticate();
      const cloned_original_claims = { ...claims };

      const hydrated_claims: Claims = Reflect.get(hydrated, 'claims');
      const { iat: hydrated_iat, exp: hydrated_exp } = hydrated_claims;
      delete (hydrated_claims as any).iat;
      delete (hydrated_claims as any).exp;
      expect(new Date(hydrated_iat * 1000)).toEqual(the_future.toDate());
      expect(new Date(hydrated_exp * 1000)).toEqual(the_future.add(9, 'hours').toDate());

      expect(hydrated_claims).toStrictEqual(cloned_original_claims);
      tk.reset();
    });
  });
});

describe('An authorizer can extend its access token', () => {
  const now = new Date();
  const id = 'u_12345';
  const claims: AccessClaims = {
    user: id,
    roles: {
      [Roles.ADMIN]: [id],
      [Roles.USER]: [],
      [Roles.PENDING]: []
    },
    scopes: [Scopes.USER]
  };

  describe('Given: time frozen at X', () => {
    const authHeader = Authorizer.createAuthHeader(claims, { expiresIn: '5m' });
    let authorizer: Authorizer;
    beforeAll(() => {
      tk.freeze(now);
      authorizer = new Authorizer(authHeader);
      authorizer.authenticate();
    });
    describe('When: extending the validity of the authorizer', () => {
      beforeAll(() => {
        authorizer.extend();
      });
      test('Then: `exp` on the authorizers claims is extended', () => {
        const extended_claims: Claims = Reflect.get(authorizer, 'claims');
        expect(new Date(extended_claims.exp * 1000)).toEqual(
          moment(now).milliseconds(0).add(9, 'h').toDate()
        );
      });
      test('Then: `iat` on the authorizers claims is the frozen time', () => {
        const extended_claims: Claims = Reflect.get(authorizer, 'claims');
        expect(new Date(extended_claims.iat * 1000)).toEqual(moment(now).milliseconds(0).toDate());
      });
    });

    afterAll(() => {
      tk.reset();
    });
  });
});

describe('createSysAdminAuthHeader helper', () => {
  test('It builds a SysAdmin header with no roles and a SysAdmin scope', () => {
    const header = Authorizer.createServiceUserAuthHeader();
    const claims = jwt.decode(header.split(' ')[1]) as Claims;
    expect(claims.roles).toStrictEqual({});
    expect(claims.scopes).toStrictEqual([Scopes.SYSADMIN]);
    expect(claims.user).toBe(MockConfig.ServiceUser.id);
  });
});

describe('Getting the onBehalfOf claim', () => {
  const user = Oid.Create('User', 1).toString();
  const claims: AccessClaims = {
    user,
    roles: {
      [Roles.ADMIN]: [user],
      [Roles.USER]: [],
      [Roles.PENDING]: []
    },
    scopes: [Scopes.USER]
  };
  describe('When: `on_behalf_of` is a valid oid string', () => {
    const on_behalf_of = Oid.Create('Buyer', 1);
    const authHeader = Authorizer.createAuthHeader({
      ...claims,
      on_behalf_of: on_behalf_of.toString()
    });
    const authorizer = new Authorizer(authHeader);
    authorizer.authenticate();
    test('Then: an Oid instance is returned', () => {
      const target = authorizer.getOnBehalfOf();
      expect(target).toBeInstanceOf(Oid);
      expect(target).toStrictEqual(on_behalf_of);
    });
  });
  describe('When: `on_behalf_of` is present and not a valid oid string', () => {
    const on_behalf_of = 'b_garbage';
    const authHeader = Authorizer.createAuthHeader({ ...claims, on_behalf_of });
    const authorizer = new Authorizer(authHeader);
    authorizer.authenticate();
    test('Then: an error is thrown', () => {
      expect(() => authorizer.getOnBehalfOf()).toThrow();
    });
  });
  describe('When: `on_behalf_of` is undefined', () => {
    const authHeader = Authorizer.createAuthHeader({ ...claims, on_behalf_of: undefined });
    const authorizer = new Authorizer(authHeader);
    authorizer.authenticate();
    test('Then: undefined is returned', () => {
      expect(authorizer.getOnBehalfOf()).toBe(undefined);
    });
  });
});
