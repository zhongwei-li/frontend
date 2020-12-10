import {seed} from './seed'
import merge from 'lodash/merge'

/**
 * A factory makes it easy to seed the database with data.
 */
export class Factory {
	static table = null

	static factory() {
		return {}
	}

	/**
	 * Seeds a bunch of fake data into the database.
	 *
	 * Takes an override object as its single argument which will override the data from the factory.
	 * If the value of one of the override fields is `{increment}` that value will be replaced with an incrementing
	 * number through all created entities.
	 *
	 * @param override
	 * @returns {[]}
	 */
	static create(count = 1, override = {}) {
		const data = []

		for (let i = 1; i <= count; i++) {
			const entry = merge(this.factory(), override)
			for (const e in entry) {
				if (entry[e] === '{increment}') {
					entry[e] = i
				}
			}
			data.push(entry)
		}

		seed(this.table, data)

		return data
	}

	static truncate() {
		seed(this.table, null)
	}
}
