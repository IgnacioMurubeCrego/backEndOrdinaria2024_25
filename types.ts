import { OptionalId, ObjectId } from "mongodb";

export type TestModel = OptionalId<{
	msg: string;
}>;

export type Test = {
	id: string;
	msg: string;
};
