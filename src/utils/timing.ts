/**
 * Generate a promise which resolves after the given amount of milliseconds.
 */
export const wait = (ms?: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
