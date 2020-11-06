`use strict`

const ambient = require('./lib/ambient').create(true);
const scale = ambient.getScale(ambient.scales.minor, 0, 0, 6);
const playNoteInScale = ambient.playNoteInScale.bind(ambient);
const gyroQueues = require('./lib/gyroQueues');

const gQueue = gyroQueues.create(9000, 30);

let len = 32000 * 2;

let queue = [];

const rule30 = [0, 0, 0, 1, 1, 1, 1, 0].reverse();

let tick = 100;
let speed1 = 1;
let speed2 = 1;
let minDelay = 100;
let sign1 = 1;
let sign2 = 1;

function player() {
	let played = false;
	const notes = queue.filter(i => i[2] < tick);

	const s2r = Math.round(speed2) >> 1;
	const chans = s2r;
	const repeats = s2r >> 1;;

	if (notes.length) {
		const k = Math.round(Math.random() * (notes.length - 1))
		const note = notes[k];
		const chan = note[1][0];

		if (chan < chans) {
			for (let r = 0; r < repeats; r++) {
				const m = 3;
				setTimeout(() => {
					note[0].apply(note[0], note[1])
				}, (minDelay * (r + 1)));
			}
		}

		if (sign1 < 1) {
			note[1][2] += 7
		}

		if (sign2 < 1) {
			note[1][2] += 7
		}

		note[0].apply(note[0], note[1])
		note[2] = -1;
	}

	queue = queue.filter(i => i[2] >= 0)

	tick += minDelay * speed1;
	setTimeout(player, minDelay / speed1);
}

player();

let startTime = 0;

function reverb(time, feedback, velocities, feedbacks, dry, wet, playFunc, args) {
	const delay = time / feedback;
	let args1 = args.concat();

	if (args1[3]) {
		args1[3] = Math.abs(Math.round(args1[3] * dry));
	}

	for (let i = 0; i < feedback; i++) {
		if (!feedbacks[i % feedbacks.length]) {
			continue;
		}

		args1 = args.concat();

		if (args1[3]) {
			args1[3] = Math.abs(Math.round(args1[3] * velocities[i % velocities.length] * wet));
		}

		queue.push([playFunc, args1, tick + i * delay]);
	}
}

function rereverb(time, feedback, args) {
	const delay = time / feedback;

	for (let i = 0; i < feedback; i++) {
		const args1 = args.concat();
		args1[7] = args1[7].concat();
		args1[7][3] = 120 - Math.round(args1[7][3] * (feedback - i) * 0.2);
		setTimeout(reverb.bind(this, ...args1));
	}

}

function createPattern(size, interval, func) {
	const delta = (interval[1] - interval[0]) / (size - 1);
	const pattern = [];

	for (let i = interval[0]; i <= interval[1]; i += delta) {
		pattern.push(func(i));
	}

	return pattern;
}

function rule30Apply(arr) {
	let copy = arr.concat([]);

	for (let i = 0; i < arr.length; i++) {
		const v = (copy[i - 1] ? 4 : 0) + (copy[i] ? 2 : 0) + (copy[i + 1] ? 1 : 0);
		arr[i] = rule30[v];
	}

	arr.shift();
	arr.push(arr[arr[0]]);
	return arr;
}

function printArr(arr) {
	console.log(arr.join('').replace(/0/g, ' ').replace(/1/g, '*'));;
}

const lines = 8;
const patternLen = 12;

function getMatrixGenerator1() {
	const arr = new Array(patternLen).fill(0);

	for (let n = 0; n < 3; n++) {
		arr[Math.round(Math.random() * (patternLen - 1) >> 1) + patternLen >> 1] = 1;
	}

	return function() {
		let matrix;
		let sum = 0;

		while (sum < lines * patternLen << 1) {
			matrix = [];

			while (matrix.length < lines) {
				rule30Apply(arr);
				matrix.push(arr.concat(arr.concat().reverse()));
				matrix.unshift(arr.concat(arr.concat().reverse()));
			}

			matrix.forEach(a => a.forEach(a => sum += a));
		}

		matrix.forEach(printArr.bind(this));
		return matrix;
	}
}

function getMatrixGenerator2() {
	const patterns = [];

	for (let i = 0; i < lines; i++ ) {
		patterns[i] = new Array(patternLen).fill(0);

		for (let n = 0; n < 3; n++) {
			patterns[i][Math.round(Math.random() * (patternLen - 1) >> 1) + patternLen >> 1] = 1;
		}
	}

	return function () {
		let sum = 0;
		let matrix;

		while (sum < lines * patternLen << 1) {
			matrix = [];

			for (i = 0; i < lines; i++) {
				rule30Apply(patterns[i]);
				matrix.push(patterns[i].concat(patterns[i].concat().reverse()));
				matrix.unshift(patterns[i].concat(patterns[i].concat().reverse()));
			}

			matrix.forEach(a => a.forEach(a => sum += a));
		}

		matrix.forEach(printArr.bind(this));
		return matrix;
	}
}

let p1 = createPattern(24, [0, Math.PI / 4], i => Math.cos(i)     / 2 + 0.7);
let p2 = createPattern(24, [0, Math.PI / 4], i => Math.sin(i)     / 2 + 0.7);
let p3 = createPattern(24, [0, Math.PI / 2], i => Math.cos(i / 2) / 2 + 0.7);
let p4 = createPattern(24, [0, Math.PI / 2], i => Math.sin(i / 3) / 2 + 0.7);

const getMatrix1 = getMatrixGenerator1();

const pressLen = 5000;

function play3r(div, baseNote) {
	const matrix = getMatrix1();

	reverb(len, div, p1, matrix[0], 1, 0.5, playNoteInScale, [0, scale,  0 + baseNote,      90,  pressLen]);
	reverb(len, div, p2, matrix[1], 1, 0.5, playNoteInScale, [1, scale,  2 + baseNote,      90,  pressLen]);
	reverb(len, div, p3, matrix[2], 1, 0.5, playNoteInScale, [2, scale,  4 + baseNote,      90,  pressLen]);
	reverb(len, div, p4, matrix[3], 1, 0.5, playNoteInScale, [3, scale,  5 + baseNote,      90,  pressLen]);

	reverb(len, div, p1, matrix[4], 1, 0.5, playNoteInScale, [4, scale,  5 + 14 + baseNote, 110,  pressLen]);
	reverb(len, div, p2, matrix[5], 1, 0.5, playNoteInScale, [5, scale,  4 + 7 + baseNote,  110,  pressLen]);
	reverb(len, div, p3, matrix[6], 1, 0.5, playNoteInScale, [6, scale,  2 + 14 + baseNote, 110,  pressLen]);
	reverb(len, div, p4, matrix[7], 1, 0.5, playNoteInScale, [7, scale,  0 + 7 + baseNote,  110,  pressLen]);
}

function play(preset, len1, delay1) {
	len = len1;
	minDelay = delay1;

	setInterval(() => {
		if (queue.length == 0) {
			preset();
		}
	}, 250);

	preset();
}

play(play3r.bind(this, 24, 0), 30000 * 3, 250);
play(play3r.bind(this, 24, 4), 30000 * 2, 250);

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
	speed1 = x1 / 25;
	speed1 = Math.max(speed1, 0.6);
	speed2 = x2 / 5;
	speed2 = Math.max(speed2, 0.4);
}, 100);

const ccs = new Array(8);

for (let n = 0; n < 8; n++) {
	ccs[n] = n / 1.27;
}

function getCoords(i, shift) {
	x = Math.round(Math.sin((i + shift) / 1.27) * 63);
	y = Math.round(Math.cos((i + shift) / 1.27) * 63);
	return [x, y];
}

let k = 0;

let posX = 0;
let posY = 64;

setInterval(() => {
	for (let i = 0; i < 8; i++) {
		let coords = getCoords(ccs[i], k);

		let x = coords[0];
		let y = coords[1];

		x = x - posX;

		if (posY < y) {
			y = y - posY;
		} else {
			y = posY - y;
		}

		let pan = x + 64;
		let vol = 127 - y;

		vol = Math.max(vol, 0);

		ambient.cc(i, 0, vol);
		ambient.cc(i, 1, pan);
	}

	if (sign1 == 1) {
		k += speed1 / 50;
	} else {
		k -= speed1 / 50;
	}
}, 100);
