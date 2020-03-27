// core
import { EventEmitter } from 'events'

// public
import { ulid } from 'ulid'

// local
import { wait } from './timing'

interface ActiveReqMap {
	[key: string]: Promise<void>;
}

interface RateLimiterOptions {
	maxReqsInFlight?: number;
	minPauseTime?: number;
}

export class RateLimiter {
	private reqQueue: string[] = []
	private activeReqs: ActiveReqMap = {}
	private maxReqsInFlight: number
	private blocked = false
	private blockedTime: number
	private emitter = new EventEmitter()

	constructor (opts: RateLimiterOptions = {}) {
		this.maxReqsInFlight = opts.maxReqsInFlight ?? 5
		this.blockedTime = opts.minPauseTime ?? 5000
	}

	/**
	 * Generate a unique ID.
	 */
	private static generateId (): string {
		return ulid()
	}

	/**
	 * Fetch a dummy worker.
	 *
	 * Returns a promise which resolves with a worker ID when that worker is in
	 * your possession.
	 *
	 * Use #releaseWorker to put the worker back in to the pool.
	 */
	protected async fetchWorker (): Promise<string> {
		const id = RateLimiter.generateId()

		if (this.blocked) {
			this.reqQueue.push(id)

			return new Promise((resolve) => {
				this.emitter.once(`start-${id}`, () => resolve(id))
			})
		}

		this.activateReq(id)

		if (Object.keys(this.activeReqs).length >= this.maxReqsInFlight) {
			this.blockRequests()
		}

		return id
	}

	/**
	 * Release the given worker back in to the pool.
	 */
	protected releaseWorker (id: string): void {
		delete this.activeReqs[id]
		this.emitter.emit(`complete-${id}`)
	}

	/**
	 * Set a particular request to be active.
	 */
	private activateReq (id: string): void {
		const reqOp: Promise<void> = new Promise((resolve) => {
			this.emitter.once(`complete-${id}`, () => resolve())
		})

		this.activeReqs[id] = reqOp
		this.emitter.emit(`start-${id}`)
	}

	/**
	 * Queue incoming requests until the current set and X time has passed.
	 */
	private async blockRequests (): Promise<void> {
		this.blocked = true

		await Promise.all([
			Promise.all(Object.values(this.activeReqs)),
			wait(this.blockedTime)
		])

		this.blocked = false
		this.processQueue()
	}

	/**
	 * Check the queue for requests to process.
	 * Triggered after requests become unblocked.
	 */
	private processQueue (): void {
		const nextOpIds = this.reqQueue.splice(0, this.maxReqsInFlight)
		if (!nextOpIds.length) return

		nextOpIds.forEach((nextOpId) => {
			this.activateReq(nextOpId)
		})

		if (nextOpIds.length === this.maxReqsInFlight) {
			this.blockRequests()
		}
	}
}
