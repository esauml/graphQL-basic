import { ApolloServer, gql, UserInputError } from 'apollo-server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const typeDefs = gql`
    enum YesNo {
        YES
        NO
    }

    type Address {
        city: String
        street: String
    }

    type Person {
        name: String!
        age: Int
        phone: String
        uuid: String!
        address: Address
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person]!
        findPerson(name: String!): Person
        findByCity(city: String!): [Person]
    }

    type Mutation {
        addPerson(
            name: String!
            age: Int
            phone: String
            city: String
            street: String
        ): Person

        editNumber(
            name: String!
            phone: String!
        ): Person
    }
`

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async (root, arg) => {
            const { data: persons } = await axios.get('http://localhost:3000/persons')

            if (!arg.phone) return persons

            const byPhone = (person) =>
                arg.phone === 'YES' ? person.phone : !person.phone
            return persons.filter(byPhone)
        },
        findPerson: (root, args) => persons.find(p => p.name === args.name),
        findByCity: (root, args) => persons.filter(p => p.city === args.city)
    },

    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(p => p.name === args.name)) {
                throw new UserInputError('Name must be unique', {
                    invalidArgs: args.name
                });
            }

            const person = { ...args, uuid: uuidv4() }
            persons.push(person)
            return person
        },

        editNumber: (root, args) => {
            const personIndex = persons.findIndex(p => p.name === args.name)

            if (personIndex === -1) return null

            const personUpdated = { ...persons[personIndex], phone: args.phone }
            persons[personIndex] = personUpdated
            return personUpdated
        }
    },

    Person: {
        address: (root) => {
            return {
                city: root.city,
                street: root.street
            }
        }
    }
}

// const server = new ApolloServer({
const server = new ApolloServer({
    typeDefs: typeDefs,
    resolvers: resolvers
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
})