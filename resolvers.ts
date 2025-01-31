import { Collection, ObjectId } from "mongodb";
import { APIgeocoding, APIweather, APIworldtime, RestaurantModel } from "./types.ts";
import { GraphQLError } from "graphql";
import { APIvalidatephone } from "./types.ts";
import { parentPort } from "node:worker_threads";

type Context = {
	RestaurantCollection: Collection<RestaurantModel>;
};

type QueryGetRestaurantArgs = {
	id: string;
};

type QueryGetRestaurantsArgs = {
	city: string;
};

type MutationAddRestaurantArgs = {
	name: string;
	address: string;
	city: string;
	phone: string;
};

type MutationDeleteRestaurantArgs = {
	id: string;
};

export const resolvers = {
	Restaurant: {
		id: (parent: RestaurantModel): string => {
			return parent._id!.toString();
		},
		address: (parent: RestaurantModel): string => {
			return `${parent.address}, ${parent.city}, ${parent.country}`;
		},
		datetime: async (parent: RestaurantModel): Promise<string> => {
			const timezone: string = parent.timezone;
			const url: string = "https://api.api-ninjas.com/v1/worldtime?timezone=" + timezone;
			const API_KEY: string | undefined = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY required for API Ninjas request.");

			const datetimeData: Response = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (datetimeData.status !== 200) throw new GraphQLError("Error in WorldTime API request.");

			const data: APIworldtime = await datetimeData.json();
			const datetime: string = data.datetime;
			return datetime;
		},
		temp: async (parent: RestaurantModel): Promise<string> => {
			const latitude: number = parent.latitude;
			const longitude: number = parent.longitude;
			const url: string = `https://api.api-ninjas.com/v1/weather?lat=${latitude}&lon=${longitude}`;
			const API_KEY: string | undefined = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY required for API Ninjas request.");

			const weatherData: Response = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (weatherData.status !== 200) throw new GraphQLError("Error in Weather API request.");

			const data: APIweather = await weatherData.json();
			const temp: string = data.temp.toString();
			return temp;
		},
	},
	Query: {
		getRestaurant: async (
			_parent: unknown,
			args: QueryGetRestaurantArgs,
			ctx: Context
		): Promise<RestaurantModel | null> => {
			const id: string = args.id;
			const restaurant: RestaurantModel | null = await ctx.RestaurantCollection.findOne({ _id: new ObjectId(id) });
			return restaurant;
		},
		getRestaurants: async (
			_parent: unknown,
			args: QueryGetRestaurantsArgs,
			ctx: Context
		): Promise<RestaurantModel[]> => {
			const city: string = args.city;
			const restaurantsInCity: RestaurantModel[] = await ctx.RestaurantCollection.find({ city }).toArray();
			return restaurantsInCity;
		},
	},
	Mutation: {
		addRestaurant: async (
			_parent: unknown,
			args: MutationAddRestaurantArgs,
			ctx: Context
		): Promise<RestaurantModel> => {
			const { name, address, city, phone } = args;

			const url: string = "https://api.api-ninjas.com/v1/validatephone?number=" + phone;
			const API_KEY: string | undefined = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY required for API Ninjas request.");

			const phoneExists: number = await ctx.RestaurantCollection.countDocuments({ phone });
			if (phoneExists > 0) throw new GraphQLError("Phone already registered in DB");

			const valPhoneData: Response = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (valPhoneData.status !== 200) throw new GraphQLError("Error in ValidatePhone API request.");

			const data: APIvalidatephone = await valPhoneData.json();
			if (!data.is_valid) throw new GraphQLError("Phone number format is not valid");

			const timezone: string = data.timezones[0];
			const country: string = data.country;

			const geocodingURL: string = "https://api.api-ninjas.com/v1/geocoding?city=" + city;
			const geocodingData: Response = await fetch(geocodingURL, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (geocodingData.status !== 200) throw new GraphQLError("Error in GeoCoding API request.");

			const geoData: APIgeocoding[] = await geocodingData.json();

			const latitude: number = geoData[0].latitude;
			const longitude: number = geoData[0].longitude;

			const { insertedId } = await ctx.RestaurantCollection.insertOne({
				name,
				address,
				phone,
				city,
				country,
				timezone,
				latitude,
				longitude,
			});

			return {
				_id: insertedId,
				name,
				address,
				phone,
				city,
				country,
				timezone,
				latitude,
				longitude,
			};
		},
		deleteRestaurant: async (_parent: unknown, args: MutationDeleteRestaurantArgs, ctx: Context): Promise<boolean> => {
			const id: string = args.id;
			const { deletedCount } = await ctx.RestaurantCollection.deleteOne({ _id: new ObjectId(id) });
			return !(deletedCount === 0);
		},
	},
};
