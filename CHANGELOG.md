# Changelog

All notable changes to this project will be documented in this file. Starting with v0.1.0.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Added
### Removed
### Changed
  * o11y fix: authorizer.getUser(), .getRoles() will still return after authenticating an accesstoken -- even if the token has expired
### Fixed
### Deprecated
### Security


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
