`use strict`;

const ambient = require('./lib/ambient').create(true);
const scale = ambient.getScale(ambient.scales.hirajoshi, 0, 0, 6);
const playNoteInScale = ambient.playNoteInScale.bind(ambient);
const gyroQueues = require('./lib/gyroQueues');

const gQueue = gyroQueues.create(9000, 30);

function playArr(arr) {
	let copy = arr.concat();

	for (let i = 1; i < copy.length - 1; i++) {
		if (copy[i - 1] == 0 && copy[i + 1] == 0 && copy[i] == 0) {
			copy[i] = '*';
		}
	}

	for (let i = 0; i < arr.length / 5; i++) {
		for (j = 0; j < 5; j++) {
			if (copy[i * 5 + j] == '*') {
				playNoteInScale(i, scale, i * 5 + j, 127, 5000);
			}
		}
	}
}

let rule30 = [0, 0, 0, 1, 1, 1, 1, 0].reverse();

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

const patternLen = 50;
const arr = new Array(patternLen).fill(0);

function printArr(arr) {
	let copy = arr.concat();

	for (let i = 1; i < copy.length - 1; i++) {
		if (copy[i - 1] == 0 && copy[i + 1] == 0 && copy[i] == 0) {
			copy[i] = '*';
		}
	}

	console.log(copy.join('').replace(/0/g, ' ').replace(/1/g, ' '));;
}

for (let i = 0; i < 3; i++) {
	arr[Math.round(Math.random() * (arr.length - 1))] = 1;
}

let speed1 = 1;
let speed2 = 2;

// Rewind
for (let i = 0; i < 200; i++) {
	rule30Apply(arr);
}

let i = 1;

function play() {
	rule30Apply(arr);
	playArr(arr);
	let sp1 = Math.abs(1500 - speed1 * 13);
	let sp2 = Math.abs(1500 - speed2 * 13);
	setTimeout(play, sp1);

	for (let i = 0; i < speed2 / 20; i++) {
		setTimeout(playArr.bind(this, arr), sp2 + i * 1000);
	}
}

play();

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
	ambient.cc(14, 1, x1 >> 1);

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

	speed1 = x1;
	speed1 = Math.max(speed1, 1);
	speed2 = x2 ;
	speed2 = Math.max(speed2, 1);
	console.log(speed2);
}, 100);

function getCoords(i, shift) {
	x = Math.round(Math.sin((i/1.595 + shift)) * 63);
	y = Math.round(Math.cos((i/1.595 + shift)) * 127) - 64;
	return [x, y];
}

let posX = 0;
let posY = 64;

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

	if (sign1 == 1) {
		k += speed1 / 1000;
	} else {
		k -= speed1 / 1000;
	}
}, 100);
