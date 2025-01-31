import { OptionalId } from "mongodb";

export type RestaurantModel = OptionalId<{
	name: string;
	address: string;
	city: string;
	country: string;
	phone: string;
	timezone: string;
	latitude: number;
	longitude: number;
}>;

export type Restaurant = {
	id: string;
	name: string;
	address: string;
	phone: string;
	temp: string;
	datetime: string;
};

//https://api.api-ninjas.com/v1/validatephone?number=+12065550100
export type APIvalidatephone = {
	is_valid: boolean;
	country: string;
	timezones: string[];
};

//https://api.api-ninjas.com/v1/worldtime?timezone=
export type APIworldtime = {
	datetime: string;
};

//https://api.api-ninjas.com/v1/weather?city=
export type APIweather = {
	temp: number;
};

//https://api.api-ninjas.com/v1/geocoding?city=London&country=England
export type APIgeocoding = {
	latitude: number;
	longitude: number;
};
