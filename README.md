# ACL

# Open Questions

- what is the right place in package.json for `type-graphql` ?
  - peer dep, or dev dep? the library works in the context of Hapi/REST without type-graphql,
    but it is required to work for AuthChecker that is exported for use in TS/GQL ecosystem
