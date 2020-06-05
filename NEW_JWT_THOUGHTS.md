## Key Terms ((Eventually))

### **Identity (Actor, Subject)**

An idenity is a unique reference to an `actor` inside the rumbleship ecosystem. Rumbleship primarily supports two `identities`: `User` and `ApiKey`. An `Identity` is the **subject** of every question of authorization.

### **Credential**

A `credential` is how an `identity` authenticates. Both `Users` and `ApiKeys` used hashed passwords that only the customer knows. A third credential exists, the `IdToken`, which is unhashed, and deprecated.

### **Action (Verb)**

An `Action` is the verb in an question. Create, Read, Update, Delete; Query, Mutate; (More?)
query.
mutation

### **Resource (Object)**

A `Resource` is the target of an action. A resource may be an instance ('this `bank_account`'), or abstract ('bank accounts, generally').

### **Authorizables (Condition, "on behalf of")**

An object within the Rumbleship ecosystem delegates permissions, e.g.:

- actions on a `Workflow` are allowed or denied based on the association stored in `wf.owner_id`
- actions on a `BankAccount` are allowed or denied based on association stored in `ba.division_id`

### **Permission**

A single permission is a granular, revocable grant for an `idenitity` to take an `action` on a `resource` given certain conditions within the Rumbleship ecosystem.

> This affiliated `idenity` can `action:OidScope` on behalf of `[authorizables]`

e.g.

> User `u_abcde` can `create:BankAccount` on behalf of `[b_abcde, s_12345]`

means once user `u_abcde` authenticates, they will receive an access_token that allows them to create `BankAccounts` for `b_abcde` and `s_12345`, but no other other divisions. We explicitly specify a `Oid:Buyer|Supplier` here, and not `Oid:User`, because a `Buyer|Supplier` is the `authorizable` for `BankAccount` -- `Users` are not.

### **Shorthand Permissions: `*`**

This permissioning model is _conservative_. For an action to be allowed, the permission must be _explicitly granted_. This is a pain in the ass for our small team, and speed of iteration, so we introduce a shorthand: `*`.

e.g.

> User `u_abcde` can `create:*` on behalf of `[b_abcde]`

means once `u_abcde` authenticates, they will receive an access*token that allows them to create \_any* associated resource, as long as that resource is owned by `b_abcde`

e.g. sysadmins / super users

> User `u_abcde` can `*:*` on behalf of `[*]`

e.g. "banking admins" can take all actions on bank accounts:

> User `u_abcde` can `*:BankAccount` on behalf of `[*]`

### Roles

Roles are an abstraction of a group of permissions that should be applied when an `identitiy` is associated to an `authorizable`.

e.g. if a `Idenity:u_abcde` is granted `Role:admin` of an `Authorizable:b_12345`, then `u_abcde` is granted:

```
create bank_accounts b_abcde
read bank_accounts b_abcde
create users b_abcde
read users b_abcde
```

whereas if a `Idenity:u_88321` is granted `Role:user` of the same `Authorizable:b_12345`, then `u_abcde` is granted:

```
read bank_accounts b_abcde
read users b_abcde
```

# The Eventual JWT

So what does this end up looking like? A whole new JWT.

```typescript
/**
 * A user who can:
 *  * Read themselves
 *  * Create, Read BankAccounts on behalf of `b_abcde` or `s_123456`
 *  *
 */
{
  subject: 'u_abcde',
  scope: {
    'ba.create': ['b_abcde','s_12356']
    'ba.read': ['b_abcde','s_12356'],
    'u.read': ['u_abcde'],
    's.read': ['s_123456'],
    'b.read': ['b_abcde']
  }
}
```

or

```typescript
/**
 * A sysadmin
 */
{
  subject: 'u_12345',
  scope: {
    '*': ['*']
  }
}
```

or

```typescript
/**
 * A banking admin
 */
{
  subject: `u_091234`,
  scope: {
    'ba.*': ['*']
  }
}
```
