`use strict`

const ambient = require('./lib/ambient').create(true);
const scale = ambient.getScale(ambient.scales.minor, 3, 1, 6);
const playNoteInScale = ambient.playNoteInScale.bind(ambient);

let len = 32000 * 2;

let queue;

const rule30 = [0, 0, 0, 1, 1, 1, 1, 0].reverse();

function reverb(time, feedback, velocities, feedbacks, dry, wet, playFunc, args) {
	const delay = time / feedback;
	let args1 = args.concat();

	if (args1[3]) {
		args1[3] = Math.abs(Math.round(args1[3] * dry))
	}

	for (let i = 0; i < feedback; i++) {
		if (!feedbacks[i % feedbacks.length]) {
			continue;
		}

		args1 = args.concat();

		if (args1[3]) {
			args1[3] = Math.abs(Math.round(args1[3] * velocities[i % velocities.length] * wet));
		}

		setTimeout(queue.push.bind(queue, playFunc.bind(...[ambient].concat(args1))), i * delay);
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
	console.log(arr.join('').replace(/0/g, ' ').replace(/1/g, '.'));;
}

const lines = 8;
const patternLen = 24;

function getMatrixGenerator1() {
	const arr = new Array(patternLen).fill(0);

	for (let n = 0; n < 3; n++) {
		arr[Math.round(Math.random() * (patternLen - 1))] = 1;
	}

	return function() {
		const matrix = [];

		while (matrix.length < lines) {
			printArr(arr);
			matrix.push(rule30Apply(arr));
		}

		return matrix;
	}
}

function getMatrixGenerator2() {
	const patterns = [];

	for (let i = 0; i < lines; i++ ) {
		patterns[i] = new Array(patternLen).fill(0);

		for (let n = 0; n < 3; n++) {
			patterns[i][Math.round(Math.random() * (patternLen - 1))] = 1;
		}
	}

	return function () {
		for (i = 0; i < lines; i++) {
			printArr(patterns[i]);
			rule30Apply(patterns[i]);
		}

		return patterns;
	}
}


let p1 = createPattern(24, [0, Math.PI / 2], i => Math.cos(i)     / 2 + 0.5);
let p2 = createPattern(24, [0, Math.PI / 2], i => Math.sin(i)     / 2 + 0.5);
let p3 = createPattern(24, [0, Math.PI / 2], i => Math.cos(i / 2) / 2 + 0.5);
let p4 = createPattern(24, [0, Math.PI / 2], i => Math.sin(i / 3) / 2 + 0.5);

const getMatrix1 = getMatrixGenerator1();
const getMatrix2 = getMatrixGenerator2();

function play1() {
	const matrix1 = getMatrix1();
	const matrix2 = getMatrix2();

	reverb(len, 24, p1, matrix1[0], 1, 1, playNoteInScale, [0, scale,  0,      50, 2500]);
	reverb(len, 24, p2, matrix1[1], 1, 1, playNoteInScale, [1, scale,  2,      50, 2500]);
	reverb(len, 24, p3, matrix1[2], 1, 1, playNoteInScale, [2, scale,  4,      50, 2500]);
	reverb(len, 24, p4, matrix1[3], 1, 1, playNoteInScale, [3, scale,  6,      50, 2500]);

	reverb(len, 24, p1, matrix2[4], 1, 1, playNoteInScale, [4, scale,  0 + 7,  70, 2500]);
	reverb(len, 24, p2, matrix2[5], 1, 1, playNoteInScale, [5, scale,  2 + 14, 90, 2500]);
	reverb(len, 24, p3, matrix2[6], 1, 1, playNoteInScale, [6, scale,  4 + 7,  70, 2500]);
	reverb(len, 24, p4, matrix2[7], 1, 1, playNoteInScale, [7, scale,  6 + 14, 90, 2500]);
}

function play2() {
	const matrix1 = getMatrix1();
	const matrix2 = getMatrix1();

	reverb(len, 17 * 3, p1, matrix1[0], 1, 1, playNoteInScale, [0, scale,  0,      50, 2500]);
	reverb(len, 13 * 3, p2, matrix1[1], 1, 1, playNoteInScale, [1, scale,  2,      50, 2500]);
	reverb(len, 11 * 3, p3, matrix1[2], 1, 1, playNoteInScale, [2, scale,  4,      50, 2500]);
	reverb(len, 8  * 3, p4, matrix1[3], 1, 1, playNoteInScale, [3, scale,  6,      50, 2500]);

	reverb(len, 16 * 3, p1, matrix2[4], 1, 1, playNoteInScale, [4, scale,  6 + 21, 90, 2500]);
	reverb(len, 12 * 3, p2, matrix2[5], 1, 1, playNoteInScale, [5, scale,  2 + 14, 90, 2500]);
	reverb(len, 20 * 3, p3, matrix2[6], 1, 1, playNoteInScale, [6, scale,  4 + 7,  70, 2500]);
	reverb(len, 24 * 3, p4, matrix2[7], 1, 1, playNoteInScale, [7, scale,  6 + 14, 90, 2500]);
}

function play3() {
	const matrix1 = getMatrix2();
	const matrix2 = getMatrix2();

	reverb(len, 24 * 2, p1, matrix1[0], 1, 1, playNoteInScale, [0, scale,   0,      80,  2500]);
	reverb(len, 24 * 3, p2, matrix1[1], 1, 1, playNoteInScale, [1, scale,   2,      50,  2500]);
	reverb(len, 24 * 5, p3, matrix1[2], 1, 1, playNoteInScale, [2, scale,   4,      50,  2500]);
	reverb(len, 24 * 7, p4, matrix1[3], 1, 1, playNoteInScale, [3, scale,   6,      50,  2500]);

	reverb(len, 24 * 9,  p1, matrix2[4], 1, 1, playNoteInScale, [4, scale,  6 + 21, 90,  3500]);
	reverb(len, 24 * 13, p2, matrix2[5], 1, 1, playNoteInScale, [5, scale,  2 + 14, 90,  2500]);
	reverb(len, 24 * 15, p3, matrix2[6], 1, 1, playNoteInScale, [6, scale,  4 + 7,  70,  2500]);
	reverb(len, 24 * 17, p4, matrix2[7], 1, 1, playNoteInScale, [7, scale,  6 + 14, 90,  2500]);
}

function play4() {
	reverb(len, 17, p1,  [1,0,0,1,1,0,0,1], 1, 1, playNoteInScale, [0, scale,  0,  70, 2500]);
	reverb(len, 13, p1,  [0,1,0,1,0,1,0,1], 1, 1, playNoteInScale, [1, scale,  2,  70, 2500]);
	reverb(len, 11, p2,  [0,0,1,0,0,1,0,0], 1, 1, playNoteInScale, [2, scale,  4,  70, 2500]);
	reverb(len, 8,  p2,  [1,0,0,1,1,0,0,1], 1, 1, playNoteInScale, [3, scale,  6,  70, 2500]);

	reverb(len, 16, p1,  [1,0,0,1,1,0,0,1], 1, 1, playNoteInScale, [4, scale,  0 + 7,  70, 2500]);
	reverb(len, 12, p1,  [0,1,0,1,0,1,0,1], 1, 1, playNoteInScale, [5, scale,  2 + 14, 70, 2500]);
	reverb(len, 20, p2,  [0,0,0,1,0,1,0,0], 1, 1, playNoteInScale, [6, scale,  4 + 7,  70, 2500]);
	reverb(len, 24, p2,  [1,0,0,1,1,0,0,1], 1, 1, playNoteInScale, [7, scale,  6 + 14, 70, 2500]);
}

function play(preset, time, delay) {
	queue = require('./lib/ambient').createQueue(delay);

	len = time;
	setInterval(preset, len);
	preset();
}

play(play3, 80000, 500);
