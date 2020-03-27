// local
import { generateRandomLatLng } from './location'

describe('generateRandomLatLng', () => {
	test('generates valid latitudes and longitudes', () => {
		const points = Array(500).fill(undefined).map(generateRandomLatLng)

		points.forEach((point) => {
			expect(Array.isArray(point)).toBe(true)
			expect(point).toHaveLength(2)

			const [ lat, lng ] = point

			expect(lat).toBeGreaterThanOrEqual(-180)
			expect(lat).toBeLessThanOrEqual(180)

			expect(lng).toBeGreaterThanOrEqual(-360)
			expect(lng).toBeLessThanOrEqual(360)
		})
	})
})
