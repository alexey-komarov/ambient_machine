`use strict`

const ambient = require('./lib/ambient').create(true);
const scale = ambient.getScale(ambient.scales.hirajoshi, 0, 0, 6);
const playNote = ambient.playNote.bind(ambient);
const gyroQueues = require('./lib/gyroQueues');

const gQueue = gyroQueues.create(9000, 30);

let sign1 = 1;
let sign2 = 1;
let speed1 = 1;
let speed2 = 1;

const pressLen = 20000;
const baseNote = 12 * 2;

function delay(callback, time) {
	let c = 0;

	function next() {
		if (c++ == 1000) {
			return callback();
		}

		setTimeout(next, time / 1000 / speed1);
	}

	next();
}

function start(baseChan, lens) {
	for (let i = 0; i < lens.length; i++) {
		const l = lens[i];
		const note = baseNote + i;
		const chan = baseChan + i;

		function play() {
			ambient.playNote(chan, note, 127, l - 100);
			delay(play, l);
		}

		setTimeout(() => {
			play();
		}, i * 1000);
	}
}

start(0, [17000, 23100, 28000, 29500, 30000, 31100, 38040]);
start(8, [17700, 19600, 20100, 16200, 32800, 21300, 24600]);

setInterval(() => {
	let x1 = gQueue.getValue(1, 'y') || 0;
	let x2 = gQueue.getValue(2, 'y') || 0;
	x1 = x1 + 200;

	sign1 = Math.round(x1 / 100) < 0 ? -1 : 1;

	x1 = Math.sqrt(Math.abs(x1));
	x1 = x1 * Math.log(x1 + 2000);

	x1 = Math.round(Math.abs(x1));
	x1 = Math.round(x1 / 12) - 5;
	x1 = Math.min(x1, 127);


	ambient.cc(14, 0, x1);
	ambient.cc(14, 1, 127 - x1);
	ambient.cc(14, 3, x1 >> 2);
	ambient.cc(14, 2, Math.max(0, Math.min(127, Math.round(x1 / 2 * sign1 + 64))));

	sign2 = Math.round(x2 / 100) < 0 ? -1 : 1;

	x2 = Math.sqrt(Math.abs(x2));
	x2 = x2 * Math.log(x2 + 2000);

	x2 = Math.round(Math.abs(x2));
	x2 = Math.round(x2 / 12) - 5;
	x2 = Math.min(x2, 127);

	ambient.cc(15, 0, x2);

	ambient.cc(15, 1, 127 - x2);
	let cc2 = Math.max(0, Math.min(127, Math.round(x2 / 2 * sign2 + 64)))
	ambient.cc(15, 2, cc2);

	speed1 = x1 / 10;
	speed1 = Math.max(speed1, 0.9);
	speed2 = x2 / 5;
	speed2 = Math.max(speed2, 0.4);
}, 100);
