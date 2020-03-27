// public
import nock from 'nock'

// local
import { client } from './SunriseSunsetApi'

describe('client', () => {
	describe('getTimes', () => {
		beforeEach(() => {
			nock.cleanAll()
		})

		test('should resolve if valid arguments given', async () => {
			const expectedRes = {
				sunrise: '2020-03-26T20:21:41.000Z',
				sunset: '2020-03-27T08:27:36.000Z',
				day_length: 43555 // eslint-disable-line
			}

			const lat = -2.1926490501209006
			const lng = 145.13557221223374

			const scope = nock('https://api.sunrise-sunset.org')
				.get('/json')
				.query({
					lat,
					lng,
					formatted: 0
				})
				.reply(200, {
					status: 'OK',
					results: expectedRes
				})

			const req = client.getTimes({
				lat,
				lng
			})

			await expect(req).resolves.toMatchObject({
				sunrise: new Date(expectedRes.sunrise),
				sunset: new Date(expectedRes.sunset),
				dayLength: expectedRes.day_length
			})

			expect(scope.isDone()).toBe(true)
		})

		test('should throw if invalid arguments given', async () => {
			const lat = 9000
			const lng = 145.13557221223374

			const scope = nock('https://api.sunrise-sunset.org')
				.get('/json')
				.query({
					lat,
					lng,
					formatted: 0
				})
				.reply(200, {
					results: '',
					status: 'INVALID_REQUEST'
				})

			const req = client.getTimes({
				lat,
				lng
			})

			await expect(req).rejects.toThrow(`Failed to fetch timings: INVALID_REQUEST`)

			expect(scope.isDone()).toBe(true)
		})

		test('should throw if request fails', async () => {
			const lat = -2.1926490501209006
			const lng = 145.13557221223374

			const scope = nock('https://api.sunrise-sunset.org')
				.get('/json')
				.query({
					lat,
					lng,
					formatted: 0
				})
				.replyWithError('FOO')

			const req = client.getTimes({
				lat,
				lng
			})

			await expect(req).rejects.toThrow('Request failed')

			expect(scope.isDone()).toBe(true)
		})
	})
})
