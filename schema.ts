export const schema = `#graphql

type Test{
    id: ID!
    msg: String!
}

type Query{
    test: [Test!]!
}

type Mutation{
  addTest(msg:String!): Test! 
}

`;
