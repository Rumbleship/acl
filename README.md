# ACL

## The Four Questions
Authentication & Authorization have four critical questions:
1. Authenticate -> Do I exist? -> Am I someone in the Rumbleship system?
    > failure: 401; "bad password", "your credentials have been revoked"

2. Scope / Resolver -> Can I ask this kind of question? -> Do I have access to ask for data from this particular table in the database?
    > failure: 403; "you're not allowed to ask about BankAccounts"

3. Instance Filtering: Sequelize Service -> Can I ask this specific question? -> Loads instances from database based on passed in filter
    > expected failure: 200 with no empty lists; "you can ask about bank accounts, but there are no bank accounts you can see".

    > unexpected failure: 500. true error.

4. Attribute Filtering: Relay -> Can I ask for these specific fields/details on an instance? -> whitelists specific attributes on the instance
    > expected failure: 200 with data, where unallowed fields are `null`; "you can ask about bank accounts, and here are five of them you can see, but you're not allowed to view `account_number` on any of them, so we've nulled it.

    > unexpected failure: 500. true error.

