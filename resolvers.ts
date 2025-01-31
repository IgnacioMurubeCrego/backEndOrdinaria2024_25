import { ClientSession, Collection, ObjectId } from "mongodb";
import { TestModel } from "./types.ts";
import { GraphQLError } from "graphql";

type Context = {
	TestCollection: Collection<TestModel>;
};

type QueryUserArgs = {
	email: string;
};

type MutationAddTestArgs = {
	msg: string;
};

export const resolvers = {
	Test: {
		id: (parent: TestModel) => {
			return parent._id?.toString();
		},
	},
	Query: {
		test: async (_parent: unknown, _args: unknown, ctx: Context): Promise<TestModel[]> => {
			return ctx.TestCollection.find().toArray();
		},
	},
	Mutation: {
		addTest: async (_parent: unknown, args: MutationAddTestArgs, ctx: Context): Promise<TestModel> => {
			const { msg } = args;

			const test = await ctx.TestCollection.insertOne({
				msg,
			});

			return {
				_id: test.insertedId,
				msg,
			};
		},
	},
};
