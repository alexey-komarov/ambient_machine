`use strict`;

const ambient = require('./lib/ambient').create(true);
const scale = ambient.getScale(ambient.scales.hirajoshi, 2, 0, 5);
const gyroQueues = require('./lib/gyroQueues');
const gQueue = gyroQueues.create(9000, 30);

const playNoteInScale = ambient.playNoteInScale.bind(ambient);

function getIterator(list) {
	console.log(list);
	let i = 0;
	return () => list[i++ % list.length];
}

function getRIterator(r1, r2) {
	return getIterator(ambient.getEuclideanRhythm(r1, r2));
}

function runRhytm(interval, chan, note, scale, rIterator, fIterator) {
	if (rIterator() == '1') {
		let v = fIterator();
		const vel = (v + 1) * 5;
		playNoteInScale(chan, scale, v + note, vel, 2500);
	}

	setTimeout(runRhytm.bind(this, interval, chan, note, scale, rIterator, fIterator), interval);
}

let speed1 = 500;

function runRhytm1(interval, chan, note, scale, rIterator, fIterator) {
	if (rIterator() == '1') {
		let v = fIterator();
		const vel = (v + 1) * 5;
		playNoteInScale(chan, scale, v + note, vel, 2500);
	}

	setTimeout(runRhytm1.bind(this, interval, chan, note, scale, rIterator, fIterator), speed1);
}

let a1 = 1;
let f1 = 1;

let a2 = 2;
let f2 = 10;

function func1(i) {
	return Math.round(Math.cos(i / f1) * a1 + a1);
}

function func2(i) {
	return Math.round(Math.sin(i / f2) * a2 + a2);
}

function getFIterator(func) {
	let i = 0;
	return () => func(i++);
}

runRhytm1(500, 0, 0, scale, getRIterator(9, 24), getFIterator(func1));

runRhytm(1000, 1, 0, scale, getRIterator(4, 24), getIterator([1]));

let it1 = getFIterator(func2);
let it2 = getFIterator(func1);

setInterval(() => {
	a1 = it1() * 5;
}, 200);

const intervals = [1250, 1000, 500, 250, 125, 64.5];

setInterval(() => {
	let x1 = gQueue.getValue(2, 'y') || 0;
	let x2 = gQueue.getValue(1, 'y') || 0;
	x2 = Math.round(Math.sqrt(Math.sqrt(Math.abs(x2))) / 2) - 1;
	x2 = Math.max(0, x2);
	x2 = Math.min(5, x2);

	speed1 = intervals[x2];


	let s1 = x1 < 0 ? -1 : 1;
	x1 = Math.round(Math.sqrt(Math.abs(x1) / 1.6)) / 2;
	x1 = Math.max(0, x1);
	x1 = Math.min(63, x1);

	ambient.cc(1, 0, x1 * s1 + 63);
}, 30);
