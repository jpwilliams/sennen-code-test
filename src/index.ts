#!/usr/bin/env node

// public
import { program } from 'commander'
import open from 'open'
import ora from 'ora'

// local
import { generateRandomLatLng } from './utils/location'
import { client as SunriseSunsetApi, SunriseSunsetResult } from './external/SunriseSunsetApi'

// Set up CLI interface and parse incoming arguments
program
	.option('-c, --count <number>', 'number of data points to generate', '100')
	.option('-p, --print', 'print out raw data points')
	.option('-r, --repo', 'go to the GitHub code repository')
	.option('-g, --github', 'go to my GitHub profile')
	.option('-l, --linkedin', 'go to my LinkedIn profile')
	.parse(process.argv)

;(async (): Promise<any> => {
	// novelty links
	if (program.repo) return open('https://github.com/jpwilliams/sennen-code-test')
	if (program.github) return open('https://github.com/jpwilliams')
	if (program.linkedin) return open('https://www.linkedin.com/in/jackpwilliams/')

	// parse count input
	const dataPointCount = Number(program.count)

	if (!isFinite(dataPointCount)) {
		console.error('Invalid number', dataPointCount, 'given.')
		process.exit(1)
	}

	// Create spinner so we know the process is doing something
	const generationSpinner = ora(`Generating ${dataPointCount} random data points`).start()

	// Create an array of bare-bones data points
	const dataPoints: DataPoint[] = Array(dataPointCount).fill(undefined).map(() => ({
		latLng: generateRandomLatLng()
	}))

	generationSpinner.stopAndPersist({
		symbol: '✔',
		text: `${dataPoints.length} data points generated`
	})

	if (program.print) {
		console.log('Raw data points:', dataPoints)
	}

	// "Spin up" another spinner for enhancing our data points.
	const enhanceSpinner = ora(`Enhancing ${dataPointCount} data points (0 / ${dataPointCount})`).start()

	// Also set up a ghetto counter purely as a CLI helper so we can track the progress.
	let completeCounter = 0

	// Set a date that we'll use across all requests so that we're getting the
	// sunrise/sunset for the same time for each lat/lng.
	const currentDate = new Date()
	const targetDate = currentDate.toISOString().slice(0, 10)

	// Revisit every couple of seconds to check the progress.
	const interval = setInterval(() => {
		enhanceSpinner.text = `Enhancing data points (${completeCounter} / ${dataPointCount})`
	}, 2000)

	// Map over our data points and enhance them all with metadata
	const enhancedDataPoints = await Promise.all(dataPoints.map(async (dataPoint) => {
		const [ lat, lng ] = dataPoint.latLng

		// Here we trigger a promise which queries the Sunrise/Sunset API, but we don't await.
		//
		// If we were querying multiple services, we might trigger all of the calls here, then
		// wait for them all to finish before returning a result with lots of metadata.
		const timings: Promise<Partial<SunriseSunsetResult>> = new Promise(async (resolve) => {
			let res: SunriseSunsetResult

			try {
				res = await SunriseSunsetApi.getTimes({
					lat,
					lng,
					date: targetDate
				})
			} catch (err) {
				// Log that the request failed, but don't kill everything.
				// We'll just ignore this data point and continue trying
				// with the others.
				console.error(err)

				return resolve({})
			}

			return resolve(res)
		})

		const ret = {
			...dataPoint,
			...await timings
		}

		completeCounter++

		return ret
	}))

	clearInterval(interval)

	enhanceSpinner.stopAndPersist({
		symbol: '✔',
		text: `${completeCounter} data points enhanced`
	})

	if (program.print) {
		console.log('Enhanced data points:', enhancedDataPoints)
	}

	// "Earliest" is a bit subjective. Technically, 22:00 on the 25th is earlier than
	// 02:00 on the 26th, though "earliest" may be intended to mean the earliest within
	// the day, rather than across time.
	//
	// If this was the case I'd "flatten" the sunrise dates by creating new dates with
	// a null year/month/day (ergo 1970-01-01) so that we're only comparing hours/minutes/
	// seconds/milliseconds here.
	const dataPointWithEarliestSunrise = enhancedDataPoints.reduce((earliest, dataPoint) => {
		// if for whatever reason sunrise times aren't available, skip
		if (!earliest?.sunrise || !dataPoint?.sunrise) return earliest

		return dataPoint.sunrise < earliest.sunrise ? dataPoint : earliest
	})

	console.log('Day length (in seconds) of earliest sunrise in generated data:', dataPointWithEarliestSunrise.dayLength)
})()
