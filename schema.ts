export const schema = `#graphql

type Restaurant{
  id: ID!
	name: String!
	address: String!
	city: String!
	phone: String!
  temp: String!
  datetime: String!
}

type Query{
    getRestaurant(id: ID!): Restaurant
    getRestaurants(city: String!): [Restaurant!]!
}

type Mutation{
  addRestaurant(name: String!, address: String!, city: String!, phone: String!): Restaurant! 
  deleteRestaurant(id: ID!): Boolean!
}
`
