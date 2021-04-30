# Changelog

All notable changes to this project will be documented in this file. Starting with v0.1.0.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Added
  * MIT License
### Removed
  * tslint
### Changed
  * eslint
  * upgrad to typescript 4
### Fixed
### Deprecated
### Security


## [2.2.0] -- 2020-08-28

### Added
  * support for `on_behalf_of` claim

## [2.1.0] -- 2020-08-19

### Added
  * Scopes.MIGRATION

## [2.0.1] -- 2020-07-30

### Changed
  * `createSysAdminAuthHeader()` --> `createServiceUserAuthHeader()`

## [2.0.0] -- 2020-07-30

### Added
  * Guarantee the presence of `claims.user`: https://www.pivotaltracker.com/story/show/174020936
    * static `Authorizer.initialize()` to allow removing boilerplate passing of `SECRET`
    * peer dependency on `@rumbleship/config` for type interfaces
### Removed
  * `createAuthHeader()` and `createRefreshHeader` in favor of static methods: `Authorizer.createAuthHeader()` and `Authorizer.createRefreshHeader()`
  * deprecated methods; getRoles, getClient
### Changed
  * RefreshClaims has `user` instead of `owner` for consistency with `AccessClaims`
### Fixed
  * launch.json boilerplate for new debugger

## [1.4.0] -- 2020-07-15

### Changed
  * Roll logic for `authorizerTreatAs` to return either with inflected ids, or without -- defaults to with

## [1.3.0] -- 2020-07-10

### Changed
  * @AuthorizerTreatAs accepts either a single resource or a list of resources

## [1.2.1] -- 2020-06-05

### Added
  * `NEW_JWT_THOUGHTS.md` to collect thoughts on how we may change the jwt to have a deeper, more granular, more data-driven permission structure.
  * `Scopes.API_KEY` to group together the permissions that an `ApiKey` has, but a `User` does not have.

## [1.2.0] -- 2020-04-20

### Removed
  * peer dep on `@rumbleship/spyglass`
### Changed
  * package.json engine supports node 12
  * circle builds on node12
  * Upgrade to `@rumbleship/oid#4.0.2`

## [1.1.1] -- 2020-03-31

### Removed
  * Approve for publishing build step on merge to master
  * `xxhash` dependency
### Changed
  * Updated tslint.json, tsconfig.json, plugins, etc to support nullish coalescing.
  * Upgrade to `@rumbleship/acl#4.0.1`

## [1.1.0] -- 2020-03-05

### Changed
  * Throw `InvalidJWTError` instead of plain `Error` when constructing an Authorizer with invalid accessToken: https://www.pivotaltracker.com/story/show/171657687

## [1.0.3] -- 2020-01-21

### Changed
  * o11y fix: authorizer.getUser(), .getRoles() will still return after authenticating an accesstoken -- even if the token has expired

## [1.0.2] -- 2019-12-24

### Fixed
  * authorizer.authenticate() no longer throws if passed an access token that has a falsy role object

## [1.0.1] -- 2019-12-23

### Added
  * Scopes.USER

## [1.0.0] -- 2019-12-15

### Added
  * `AuthorizerTreatAs` property decorator and `getAuthorizerTreatAs()` pair, allowing explicit mapping of a property to the resource it abstracts, e.g.:
    * `owner_id` to `Resource.User`
    * `buyer_division_id`, `supplier_division_id` to `Resource.Division`
    * TODO: make this a parameterDecorator as well
### Removed
  * `AuthorizedResource` and `AuthorizedAttribute` decorators
### Changed
  * `authorizer.can()` accepts explicit attr/resource overrides as a map; defaults to collating information from decorators

## [0.0.2] -- 2019-08-14

### Added
  * DivisionAdmin scope
  * `.prettierignore` file
  * Skeleton for generating and consuming `refreshTokens`
  * Decorators for injecting the `attribute` and `resource` into a subclass's method definition
  * keys and values in `Actions` enum relating to `OrderEvent`
### Removed
  * `moment` is no longer a peer dependency, just a `devDependency`
### Changed
  * `Actions.PURCHASE`, `Actions.SHIP` and `Actions.RETURN` values are now uppercase
  * `can` accepts either an attribute or a list of attributes

## [0.0.1] -- 2019-07-17

### Added

- Initial Release; parity with what is currently executed in Alpha

### Removed

### Changed

### Fixed

### Deprecated

### Security
