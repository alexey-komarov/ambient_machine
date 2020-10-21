`use strict`

const server = require('./server');
const querystring = require('querystring');
const events = require('events');

function create(port, size) {
	const queues = {};
	const thresholds = [];
	const emitter = new events.EventEmitter();

	server.create(port).emitter.on('data', ev => {
		for (let i in ev) {
			ev[i] = parseIntSafe(ev[i]);
		}

		const id = ev.id;
		delete ev.id;

		queues[id] = queues[id] || [];
		const queue = queues[id];
		queue.push(ev);
		trimQueues(queues, id, size);

		if (queues[id]. length >= size << 1) {
			thresholds.forEach(t => {
				const cur = normalize(queue, -1 * t.len);
				const prev = normalize(queue, 0, (t.len + (t.len >> 1)) - 1);

				for (let axis in cur) {
					if (Math.abs(cur[axis] - (prev[axis] || 0)) >= t.threshold) {
						emitter.emit('threshold', {axis: axis[1], id});
					}
				}
			});
		}
	});

	function addThreshold(threshold, len) {
		thresholds.push({threshold, len});
	}

	function getValue(id, axis) {
		if (!queues[id] || (queues[id].length < size)) {
			return undefined;
		}

		const val = normalize(queues[id], size * -1)

		if (axis) {
			return val['g' + axis];
		}

		return val;
	}

	return {emitter, addThreshold, getValue};
}

function trimQueues(queues, id, size) {
	if (queues[id].length > size << 1) {
		queues[id].shift();
	}

	if (!queues[id].length) {
		return;
	}

	const ts = queues[id][0].timestamp;

	for (let i in queues) {
		if (i == id) {
			continue;
		}

		queues[i] = queues[i].filter(i => i.timestamp + 3000 > ts);
	}
}

function parseIntSafe(n) {
	try {
		return parseInt(n || 0);
	} catch(e) {
		console.error(e);
	}

	return 0;
}

function normalize(queue, start, end) {
	const result = {};

	queue.slice(start, end).forEach(i => {
		['gx', 'gy', 'gz'].forEach(axis => {
			result[axis] = (result[axis] || 0) + i[axis];
		});
	});

	const len = Math.abs(start - (end || 0))

	for (let axis in result) {
		result[axis] = Math.round(result[axis] / len);
	}

	return result;
}

module.exports = {
	create: create
};
