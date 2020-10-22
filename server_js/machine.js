`use strict`

const ambient = require('./lib/ambient').create(true);
const scale = ambient.getScale(ambient.scales.minor, 3, 1, 6);
const playNoteInScale = ambient.playNoteInScale.bind(ambient);

let len = 32000 * 2;

let queue = [];

const rule30 = [0, 0, 0, 1, 1, 1, 1, 0].reverse();

let lfo = 0;
setInterval(() => lfo++, 1000);

let tick = 0;
let delay = 150;

function getLfo(div) {
	return Math.cos(lfo / 20) / 2 + 0.5;
}

setInterval(() => {
	ambient.playNoteInScale(15, scale, 0, 127, 250);
}, 20000);

setTimeout(() => {
	setInterval(() => {
		ambient.playNoteInScale(15, scale, 2, 127, 250);
	}, 20000);
}, 10000);

function player() {
	let played = false;

	queue = queue.filter(i => {
		if (!played && i[2] < tick) {
			i[0].apply(i[0], i[1]);
			i[0] = undefined;
			played = true;
			return false;
		}

		return true;
	});

	const ratio = getLfo(20);

	tick += delay * ratio;

	setTimeout(player, delay * ratio);
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
		args1[7][3] = Math.round(args1[7][3] * (feedback - i) * 0.3);
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
const pressLen = 500;

function play3r() {
	const matrix = getMatrix1();
	const ratio = getLfo(20);
	const delay1 = ratio * 1000;

	rereverb(delay1, 3 * ratio, [len, 16 * 2, p1, matrix[0], 1, 1, playNoteInScale, [0, scale,   0,     80,  pressLen]]);
	rereverb(delay1, 1 * ratio, [len, 16 * 3, p2, matrix[1], 1, 1, playNoteInScale, [1, scale,   2,     70,  pressLen]]);
	rereverb(delay1, 2 * ratio, [len, 16 * 5, p3, matrix[2], 1, 1, playNoteInScale, [2, scale,   4,     70,  pressLen]]);
	rereverb(delay1, 2 * ratio, [len, 16 * 7, p4, matrix[3], 1, 1, playNoteInScale, [3, scale,   6,     70,  pressLen]]);

	rereverb(delay1, 2, [len, 16 * 4, p1, matrix[4], 1, 1, playNoteInScale, [4, scale,  6 + 21, 100,  3500]]);
	rereverb(delay1, 1, [len, 16 * 6, p2, matrix[5], 1, 1, playNoteInScale, [5, scale,  2 + 14, 80,  pressLen]]);
	rereverb(delay1, 3, [len, 16 * 7, p3, matrix[6], 1, 1, playNoteInScale, [6, scale,  4 + 7,  80,  pressLen]]);
	rereverb(delay1, 3, [len, 16 * 8, p4, matrix[7], 1, 1, playNoteInScale, [7, scale,  6 + 14, 90,  pressLen]]);
}

function play(preset, len1, delay1) {
	len = len1;
	delay = delay1;
	setInterval(preset, len);
	preset();
}

play(play3r, 30000 * 12, 500);
