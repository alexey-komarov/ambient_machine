`use strict`;

const ambient = require('./lib/ambient').create(true);
const scalefs = ambient.getScale(ambient.scales.minor, 6, 0, 3);


const scales = [
	ambient.getScale(ambient.scales.minor, 5, 0, 4),
	ambient.getScale(ambient.scales.minor, 0, 0, 4),
	ambient.getScale(ambient.scales.minor, 7, 0, 4),
	ambient.getScale(ambient.scales.minor, 2, 0, 4),
	ambient.getScale(ambient.scales.minor, 9, 0, 4),
	ambient.getScale(ambient.scales.minor, 4, 0, 4),
	ambient.getScale(ambient.scales.minor, 11, 0, 4),
	ambient.getScale(ambient.scales.minor, 6, 0, 4),
	ambient.getScale(ambient.scales.minor, 1, 0, 4),
	ambient.getScale(ambient.scales.minor, 8, 0, 4),
	ambient.getScale(ambient.scales.minor, 3, 0, 4),
	ambient.getScale(ambient.scales.minor, 10, 0, 4),
]

const playNoteInScale = ambient.playNoteInScale.bind(ambient);
const gyroQueues = require('./lib/gyroQueues');
const gQueue = gyroQueues.create(9000, 30);

gQueue.addThreshold(8000, 30);

let busy = false;
gQueue.emitter.on('threshold', payload => {
	if (busy) {
		return;
	}
console.log("TONALITY CHANGE");
	tonality += 5;
	busy = true
	setTimeout(() => busy = false, 5000);
});


let int = 1000;
let tonality = 8;
let speed1 = 0;
let speed2 = 0;
let sign1 = 1;
let sign2 = 1;

function getNote() {
	const r = Math.random() * 100;

	if (r < 40) {
		return 0;
	}

	if (r < 63) {
		return 2;
	}

	if (r < 75) {
		return 4;
	}

	if (r < 83) {
		return 3;
	}

	if (r < 91) {
		return 6;
	}

	if (r < 95) {
		return 1;
	}

	return 5;
}

const initialRTable = [
	[7, 30],
	[12, 30],
	[5, 10],
	[3, 8],
	[4, 10],
	[2, 5],
	[5, 7],
	[3, 7],
	[2, 8],
	[7, 13],
	[3, 6],
	[4, 11],
];

function getRTable(fr) {
	const result = initialRTable.map(r => r.concat());

	for (let i = 0; i < fr; i++) {
		const r = result[i % result.length];

		if (r[0] + 1 == r[1]) {
			r[1] += 7;
		} else {
			r[0]++;
		}
	};

	return result;
}

let freqRatio = 0;// [0..36]

function getIterator(index) {
	let cursor = 0;

	return function getNext() {
		let r = getRTable(freqRatio)[index]
		const rhytm = ambient.getEuclideanRhythm(r[0], r[1]);
		return [rhytm[cursor++ % rhytm.length]];
	}
}

let shiftRatio = 0; //[0-14]

let velocity = 127;
function runRhytm(chan, note, shift, iterator, ctx) {
	ctx = ctx || {counter: 0}
	playNote = note;

	if (chan <= 9) {
		playNote = getNote() + playNote;
	}

	const scale = scalefs ;scales[tonality % scales.length];
	if (iterator() == '1') {
		ctx.counter++;
		ambient.playNoteInScale(chan, scale, playNote + shift, velocity, 2500);

		if (Math.random() < 0.3) {
			setTimeout(() => {
				ambient.playNoteInScale(chan, scale, playNote + shift, velocity, 2500);
			}, 250);
		}
	}

	if (chan <= 9) {
		shift = shift + shiftRatio;
	}

	setTimeout(runRhytm.bind(this, chan, note, shift, iterator, ctx), int);
}

runRhytm(10, 12, 0, getIterator(0));
runRhytm(11, 12, 0, getIterator(1));

runRhytm(0, 0, 7, getIterator(2));
runRhytm(2, 0, 7, getIterator(3));
runRhytm(4, 0, 7, getIterator(4));
runRhytm(6, 0, 7, getIterator(5));
runRhytm(8, 0, 7, getIterator(6));
runRhytm(1, 0, 7, getIterator(7));
runRhytm(3, 0, 7, getIterator(8));
runRhytm(5, 0, 7, getIterator(9));
runRhytm(7, 0, 7, getIterator(10));
runRhytm(9, 0, 7, getIterator(11));


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

	ambient.cc(14, 0, Math.round(Math.sqrt(x1) * 7));
	ambient.cc(14, 1, 127 - x1);
	ambient.cc(14, 2, 64 - x1 >> 3);
	ambient.cc(14, 3, x1 >> 3);

	sign2 = Math.round(x2 / 100) < 0 ? -1 : 1;

	x2 = Math.sqrt(Math.abs(x2));
	x2 = x2 * Math.log(x2 + 2000);

	x2 = Math.round(Math.abs(x2));
	x2 = Math.round(x2 / 12) - 5;
	x2 = Math.min(x2, 127);

	ambient.cc(15, 0, x2);
	ambient.cc(15, 1, 127 - x2);

	speed1 = x1;
	speed2 = x2;
	speed1 = Math.max(speed1, 0.1);
	speed2 = Math.max(speed2, 0.1);

	freqRatio = Math.round(speed1 / 3);
	shiftRatio = Math.round(speed1 / 12);
	shiftRatio = 7;
	velocity = Math.round(Math.min(speed1 / 3, 60) + 60);
	speed1 = Math.max(0, speed1 * 2 - speed2);
	int = Math.max(100, Math.round(3000 - (Math.round(speed1 / 20) + 1) * 300));
}, 100);

function getCoords(i, shift) {
	x = Math.round(Math.sin((i/1.595 + shift)) * 63);
	y = Math.round(Math.cos((i/1.595 + shift)) * 127) - 64;
	return [x, y];
}

let posX = 0;
let posY = 0;

let k = 0;

setInterval(() => {
	for (let i = 0; i < 10; i++) {
		let coords = getCoords(i, k);

		let x = coords[0];
		let y = coords[1];

		x = x - posX;
		y = posY - y;

		let dist = Math.round(Math.sqrt(x * x + y * y));

		x = x + 64;
		dist = 127 - dist

		let pan = Math.max(0, Math.min(127, x));
		let vol = Math.max(0, Math.min(127, dist));

		ambient.cc(i, 0, vol);
		ambient.cc(i, 1, pan);
	}

	const avg = speed1 / 450;

	if (sign1 == 1) {
		k += avg;
	} else {
		k -= avg;
	}
}, 100);
