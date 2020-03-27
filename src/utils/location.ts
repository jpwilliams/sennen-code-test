/**
 * Generate a random latitude/longitude that could be anywhere in the world.
 */
export const generateRandomLatLng: () => [number, number] = () => {
	const lat = (Math.random() - 0.5) * 180
	const lng = (Math.random() - 0.5) * 360

	return [ lat, lng ]
}
