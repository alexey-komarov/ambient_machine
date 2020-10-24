`use strict`

const ambient = require('./lib/ambient').create(true);
const scale = ambient.getScale(ambient.scales.major, 1, 1, 6);
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

let p1 = createPattern(24, [0, Math.PI / 2], i => Math.cos(i)     / 2 + 0.5);
let p2 = createPattern(24, [0, Math.PI / 2], i => Math.sin(i)     / 2 + 0.5);
let p3 = createPattern(24, [0, Math.PI / 2], i => Math.cos(i / 2) / 2 + 0.5);
let p4 = createPattern(24, [0, Math.PI / 2], i => Math.sin(i / 3) / 2 + 0.5);

const getMatrix1 = getMatrixGenerator1();

const pressLen = 5000;


function play3r() {
	const matrix = getMatrix1();
	const delays = new Array(8).fill(1);

	for (let i = 0; i < speed2; i++) {
		delays[Math.round(Math.random() * 7)]++;
	}

	reverb(len, 24, p1, matrix[0], 1, 1, playNoteInScale, [0, scale,  0,      50,  pressLen]);
	reverb(len, 27, p2, matrix[1], 1, 1, playNoteInScale, [1, scale,  2,      50,  pressLen]);
	reverb(len, 24, p3, matrix[2], 1, 1, playNoteInScale, [2, scale,  4,      50,  pressLen]);
	reverb(len, 39, p4, matrix[3], 1, 1, playNoteInScale, [3, scale,  6,      50,  pressLen]);

	reverb(len, 24, p1, matrix[4], 1, 1, playNoteInScale, [4, scale,  0 + 14, 70,  pressLen]);
	reverb(len, 27, p2, matrix[5], 1, 1, playNoteInScale, [5, scale,  2 + 14, 70,  pressLen]);
	reverb(len, 29, p3, matrix[6], 1, 1, playNoteInScale, [6, scale,  4 + 14, 70,  pressLen]);
	reverb(len, 27, p4, matrix[7], 1, 1, playNoteInScale, [7, scale,  6 + 14, 70,  pressLen]);
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

play(play3r, 30000 * 5, 600);

setInterval(() => {
	let x1 = gQueue.getValue(1, 'y') || 0;
	let x2 = gQueue.getValue(2, 'y') || 0;

	x1 = Math.sqrt(Math.abs(x1));
	x1 = Math.sqrt(x1 * Math.log(x1 + 50)) - 13;
	x1 = Math.round(Math.abs(1 + x1));
	x1 = Math.min(x1, 200);
	x1 = Math.max(x1, 1);

	x2 = Math.sqrt(Math.abs(x2));
	x2 = Math.sqrt(x2 * Math.log(x2 + 50)) - 6;
	x2 = Math.round(Math.abs(x2));
	x2 = Math.min(x2, 200);
	x2 = Math.max(x2, 1);
	speed1 = x1 / 5 + 1;
	speed2 = x2;
}, 100);
