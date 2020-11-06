`use strict`

const midi = require('midi');

const scales = {
	major:                  [2, 2, 1, 2, 2, 2],
	minor:                  [2, 1, 2, 2, 1, 2],
	harmonicMajor:          [2, 2, 1, 2, 1, 3],
	harmonicMinor:          [2, 1, 2, 2, 1, 3],
};

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const queue = [];

const instances = {};

function create(debug) {
	const index = (Object.keys(instances).sort().pop() || 0) + 1;
	const output = new midi.Output();
	output.openVirtualPort(`Ambient Machine ${index}`);

	return {
		scales: scales,
		getScale: getScale,
		getScales: getScales,
		playNote: playNote,
		getNoteInScale: getNoteInScale,
		getNotesInScale: getNotesInScale,
		playNoteInScale: playNoteInScale,
		findTonalities: findTonalities,
		getTriad: getTriad,
		playNotes: playNotes,
		nameNote: nameNote,
		nameNotes: nameNotes,
		pc: pc,
		cc: cc,
		debug: debug,
		output: output
	}
}

function getScale(scaleDef, shift, startFrom, octaves) {
	const scale = [];

	if (octaves === undefined) {
		octaves = startFrom;
		startFrom = 0;
	}

	for (let o = startFrom; o < octaves; o++) {
		for (let n = 0; n <= scaleDef.length; n++) {
			if (n == 0) {
				scale.push(o * 12);
				continue;
			}

			scale.push(scale[scale.length - 1] + scaleDef[n - 1]);
		}
	}

	return scale.map(n => n + shift);
}

function getScales(def, startFrom, octaves) {
	return [...Array(12).keys()].map(shift => this.getScale(def, shift, startFrom, octaves));
}

function playNote(...args) {
	if (this.debug) {
		queue.push([this, args]);
	} else {
		_playNote.apply(this, args)
	}
}

function printQueue() {
	if (queue.length < 1) {
		return;
	}

	const line = new Array(120).fill(' ');

	queue.forEach(n => line[n[1][1]] = nameNote(n[1][1]));

	console.log(line.join(''));
}

function trap() {
	printQueue();
	const copy = [].concat(queue);
	queue.length = 0;
	copy.forEach(args => _playNote.apply(args[0], args[1]));;
}

setInterval(trap, 15);

function pc(chan, prg) {
	this.output.sendMessage([192 + chan, prg]);
}

function cc(chan, num, val) {
	this.output.sendMessage([176 + chan, num, val]);
}

function _playNote(chan, note, vel, playLen, len, done) {
	if (len instanceof Function) {
		done = len;
		len = playLen;
	}

	len = len || 0;

	if (note !== null) {
		let midiNote = note + 24;

		let noteOn = 144 + chan;
		let noteOff = 128 + chan;
		const output = this.output;

		output.sendMessage([noteOn, midiNote, vel]);

		setTimeout(() => {
			output.sendMessage([noteOff, midiNote, vel]);
		}, playLen);
	}

	if (done) {
		setTimeout(done, len);
	}
}

function getNoteInScale(scale, note) {
	if (note === null) {
		return null;
	}

	return scale[note % scale.length];
}

function getNotesInScale(scale, notes) {
	return notes.map(getNoteInScale.bind(this, scale));
}

function playNoteInScale(chan, scale, note, vel, playLen, len, done) {
	this.playNote(chan, this.getNoteInScale(scale, note), vel, playLen, len, done);
}

function findTonalities(scales, notes) {
	return scales.filter(scale => !notes.some(note => scale.map(x => x % 12).indexOf(note % 12) == -1))
}

function getTriad(scale, note) {
	return [0, 2, 4].map(shift => this.getNoteInScale(scale, note + shift));
}

function playNotes(chan, notes, vel, playLen, done) {
	notes = notes.concat();

	function playNext(self) {
		if (!notes.length) {
			if (done) {
				done();
			}

			return;
		}

		self.playNote(chan, notes.shift(), vel, playLen, playNext.bind(self));
	}

	playNext(this);
}


function nameNote(note) {
	if (note === null || note === undefined) {
		return '--';
	}

	return noteNames[note % 12] + Math.trunc(note / 12 + 1);
}

function nameNotes(notes) {
	return notes.map(n => nameNote(n));
}


function nameNotes(notes) {
	return notes.map(n => nameNote(n));
}

function createQueue(interval) {
	const queue = [];

	setInterval(() => {
		const func = queue.shift();

		if (func) {
			func();
		}
	}, interval);

	return queue;
}

module.exports = {
	create: create,
	createQueue: createQueue
};
