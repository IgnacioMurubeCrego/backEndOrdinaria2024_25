import { Collection, ObjectId } from "mongodb";
import { APIgeocoding, APIweather, APIworldtime, RestaurantModel } from "./types.ts";
import { GraphQLError } from "graphql";
import { APIvalidatephone } from "./types.ts";

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
		id: (parent: RestaurantModel) => {
			return parent._id?.toString();
		},
		datetime: async (parent: RestaurantModel): Promise<string> => {
			const timezone = parent.timezone;
			const url = "https://api.api-ninjas.com/v1/worldtime?timezone=" + timezone;
			const API_KEY = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY required for API Ninjas request.");

			const datetimeData = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (datetimeData.status !== 200) throw new GraphQLError("Error in WorldTime API request.");

			const data: APIworldtime = await datetimeData.json();
			const datetime = data.datetime;
			return datetime;
		},
		temp: async (parent: RestaurantModel): Promise<string> => {
			const latitude = parent.latitude;
			const longitude = parent.longitude;
			const url = `https://api.api-ninjas.com/v1/weather?lat=${latitude}&lon=${longitude}`;
			const API_KEY = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY required for API Ninjas request.");

			const weatherData = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (weatherData.status !== 200) throw new GraphQLError("Error in Weather API request.");

			const data: APIweather = await weatherData.json();
			const temp = data.temp.toString();
			return temp;
		},
	},
	Query: {
		getRestaurant: async (
			_parent: unknown,
			args: QueryGetRestaurantArgs,
			ctx: Context
		): Promise<RestaurantModel | null> => {
			const id = args.id;
			const restaurant: RestaurantModel | null = await ctx.RestaurantCollection.findOne({ _id: new ObjectId(id) });
			return restaurant;
		},
		getRestaurants: async (
			_parent: unknown,
			args: QueryGetRestaurantsArgs,
			ctx: Context
		): Promise<RestaurantModel[]> => {
			const city = args.city;
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

			const url = "https://api.api-ninjas.com/v1/validatephone?number=" + phone;
			const API_KEY = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY required for API Ninjas request.");

			const phoneExists = await ctx.RestaurantCollection.countDocuments({ phone });
			if (phoneExists > 0) throw new GraphQLError("Phone already registered in DB");

			const valPhoneData = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (valPhoneData.status !== 200) throw new GraphQLError("Error in ValidatePhone API request.");

			const data: APIvalidatephone = await valPhoneData.json();
			if (!data.is_valid) throw new GraphQLError("Phone number format is not valid");

			const timezone = data.timezones[0];

			const geocodingURL = "https://api.api-ninjas.com/v1/geocoding?city=" + city;
			const geocodingData = await fetch(geocodingURL, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (geocodingData.status !== 200) throw new GraphQLError("Error in GeoCoding API request.");

			const geoData: APIgeocoding[] = await geocodingData.json();
			console.log(geoData[0]);

			const latitude = geoData[0].latitude;
			const longitude = geoData[0].longitude;

			console.log(`Latitude:${latitude}`);
			console.log(`Longitude:${longitude}`);

			const { insertedId } = await ctx.RestaurantCollection.insertOne({
				name,
				address,
				phone,
				city,
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
				timezone,
				latitude,
				longitude,
			};
		},
		deleteRestaurant: async (_parent: unknown, args: MutationDeleteRestaurantArgs, ctx: Context): Promise<boolean> => {
			const id = args.id;
			const { deletedCount } = await ctx.RestaurantCollection.deleteOne({ _id: new ObjectId(id) });
			return !(deletedCount === 0);
		},
	},
};
