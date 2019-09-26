# ACL

Four layers of GQL authorization:

-Authenticate -> Do I exist? -> Am I someone in the Rumbleship system?

-Resolver -> Can I ask this kind of question? -> Do I have access to ask for data from this particular table in the database?

-Sequelize Service -> Can I ask this specific question? -> Loads instances from database based on passed in filter

-Attribute -> Can I ask for these specific fields/details on an instance? -> whitelists specific attributes on the instance

# Open Questions
