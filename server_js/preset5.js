`use strict`;

const ambient = require('./lib/ambient').create(true);
const scale = ambient.getScale(ambient.scales.hirajoshi, 2, 0, 5);
const gyroQueues = require('./lib/gyroQueues');
const gQueue = gyroQueues.create(9000, 30);


setInterval(() => {
	let x1 = gQueue.getValue(2, 'y') || 0;
	let x2 = gQueue.getValue(1, 'y') || 0;

	let g5 = gQueue.getValue(5);

	console.log(g5)
	//ambient.cc(1, 0, x1 * s1 + 63);
}, 30);
