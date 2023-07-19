const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require("express");
const { OGM } = require("@neo4j/graphql-ogm");

const {getDriver} = require('./getDriver')
const driver = getDriver()

const typeDefs = `
    type User {
        _id: ID @id
        firstName: String
        lastName: String
        phoneNumber: String
        email: String
        createdAt: DateTime! @timestamp(operations: [CREATE])
        updatedAt: DateTime @timestamp(operations: [UPDATE])
    }
`;

const ogm = new OGM({ typeDefs, driver });

const User = ogm.model("User");
const app = express();

app.get("/users", async (req, res) => {
    const session = driver.session();
    const session1 = driver.session();
    const tx = await session.beginTransaction()
    const tx1 = await session1.beginTransaction()
    try {
        let {users} = await User.create({
            input: {
                firstName: "John",
                lastName: "Doe",
                phoneNumber: "1234567890",
                email: "john.doe@xyz.com"
            },
            context: {
                executionContext: tx
            }
        })
        console.log(users[0])   // this will print the user
        let Users = await User.find({
            where: { 
                _id: users[0]._id
             }
        });
        await tx.rollback() 
        console.log(Users)   // this will print undefined since we havent committed the transaction

        let users2  = await User.create({
            input: {
                firstName: "John",
                lastName: "Doe",
                phoneNumber: "1234567890",
                email: "john.doe@xyz.com"
            },
            context: {
                executionContext: tx1
            }
        })
        users = users2.users
        console.log(users[0])   // this will print the user
        await tx1.commit()
        Users = await User.find({
            where: {
                _id: users[0]._id
            }
        });
        console.log(Users)    // this will print the user as transaction has been committed
        return res.json(Users).end();
    } catch (error) {
        if (tx1) await tx1.rollback();
    }
    

});

const port = 4000;

ogm.init().then(() => {
    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    });
});