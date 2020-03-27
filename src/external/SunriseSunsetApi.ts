// core
import { URL } from 'url'

// public
import fetch, { Response } from 'node-fetch'

// local
import { RateLimiter } from '../utils/RateLimiter'

export interface SunriseSunsetArgs {
	lat: number;
	lng: number;
	date?: string;
	callback?: string;
	formatted?: 0 | 1;
}

export interface SunriseSunsetResult {
	sunrise: Date;
	sunset: Date;
	dayLength: number;
}

interface SunriseSunsetRawResult {
	results: {
		sunrise: string;
		sunset: string;
		day_length: number; // eslint-disable-line camelcase
	};
	status: 'OK' | 'INVALID_REQUEST' | 'INVALID_DATE' | 'UNKNOWN_ERROR';
}

/**
 * The external Sunrise/Sunset API.
 * Rate limited.
 */
class SunriseSunsetApi extends RateLimiter {
	// in a larger app, this should be stored in config/env
	private static baseUrl = 'https://api.sunrise-sunset.org/json'

	/**
	 * A function to create a target API URL with passed args pushed in
	 * to the query string.
	 */
	private static getUrlForArgs (rawArgs: SunriseSunsetArgs): URL {
		const args: SunriseSunsetArgs = {
			...rawArgs,
			formatted: 0
		}

		const rawUrl = new URL(SunriseSunsetApi.baseUrl)

		const parsedUrl = Object.entries(args).reduce((url, [ key, val ]) => {
			url.searchParams.set(key, val)

			return url
		}, rawUrl)

		return parsedUrl
	}

	/**
	 * Fetch sunrise/sunset times.
	 * Requires that a latitude and longitude be given.
	 */
	async getTimes (args: SunriseSunsetArgs): Promise<SunriseSunsetResult> {
		const url = SunriseSunsetApi.getUrlForArgs(args)
		let res: Response
		let data: SunriseSunsetRawResult

		const reqId = await this.fetchWorker()

		try {
			res = await fetch(url)
			data = await res.json()
		} catch (err) {
			console.error(err)
			throw new Error('Request failed')
		} finally {
			this.releaseWorker(reqId)
		}

		if (!data || data.status !== 'OK') {
			throw new Error(`Failed to fetch timings: ${data.status}`)
		}

		return {
			sunrise: new Date(data.results.sunrise),
			sunset: new Date(data.results.sunset),
			dayLength: data.results.day_length
		}
	}
}

// export as a singleton
export const client = new SunriseSunsetApi()
