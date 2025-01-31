import { ApolloServer } from "@apollo/server";
import { schema } from "./schema.ts";
import { MongoClient } from "mongodb";
import { RestaurantModel } from "./types.ts";
import { startStandaloneServer } from "@apollo/server/standalone";
import { resolvers } from "./resolvers.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

if (!MONGO_URL) {
	throw new Error("Please provide a MONGO_URL");
}

const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect();

console.info("Connected to MongoDB");

const mongoDB = mongoClient.db("restaurantes");
const RestaurantCollection = mongoDB.collection<RestaurantModel>("restaurants");

const server = new ApolloServer({
	typeDefs: schema,
	resolvers,
});

const { url } = await startStandaloneServer(server, {
	context: async () => ({ RestaurantCollection }),
});

console.info(`Server ready at ${url}`);
