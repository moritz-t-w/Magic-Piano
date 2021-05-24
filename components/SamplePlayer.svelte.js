/* src/components/SamplePlayer.svelte generated by Svelte v3.29.4 */
import {
	SvelteComponent,
	component_subscribe,
	init,
	safe_not_equal
} from "../_snowpack/pkg/svelte/internal.js";

import MidiPlayer from "../_snowpack/pkg/midi-player-js.js";
import { Piano } from "../_snowpack/pkg/@tonejs/piano.js";

import {
	rollMetadata,
	softOnOff,
	sustainOnOff,
	accentOnOff,
	volumeCoefficient,
	bassVolumeCoefficient,
	trebleVolumeCoefficient,
	tempoCoefficient,
	playExpressionsOnOff,
	rollPedalingOnOff,
	useMidiTempoEventsOnOff,
	activeNotes,
	currentTick
} from "../stores.js";

const DEFAULT_NOTE_VELOCITY = 50;
const DEFAULT_TEMPO = 60;
const SOFT_PEDAL_RATIO = 0.67;
const HALF_BOUNDARY = 66; // F# above Middle C; divides the keyboard into two "pans"
const ACCENT_BUMP = 1.5;

function instance($$self, $$props, $$invalidate) {
	let $useMidiTempoEventsOnOff;
	let $currentTick;
	let $tempoCoefficient;
	let $playExpressionsOnOff;
	let $softOnOff;
	let $accentOnOff;
	let $volumeCoefficient;
	let $bassVolumeCoefficient;
	let $trebleVolumeCoefficient;
	let $sustainOnOff;
	let $activeNotes;
	let $rollPedalingOnOff;
	component_subscribe($$self, useMidiTempoEventsOnOff, $$value => $$invalidate(9, $useMidiTempoEventsOnOff = $$value));
	component_subscribe($$self, currentTick, $$value => $$invalidate(10, $currentTick = $$value));
	component_subscribe($$self, tempoCoefficient, $$value => $$invalidate(11, $tempoCoefficient = $$value));
	component_subscribe($$self, playExpressionsOnOff, $$value => $$invalidate(12, $playExpressionsOnOff = $$value));
	component_subscribe($$self, softOnOff, $$value => $$invalidate(13, $softOnOff = $$value));
	component_subscribe($$self, accentOnOff, $$value => $$invalidate(14, $accentOnOff = $$value));
	component_subscribe($$self, volumeCoefficient, $$value => $$invalidate(15, $volumeCoefficient = $$value));
	component_subscribe($$self, bassVolumeCoefficient, $$value => $$invalidate(16, $bassVolumeCoefficient = $$value));
	component_subscribe($$self, trebleVolumeCoefficient, $$value => $$invalidate(17, $trebleVolumeCoefficient = $$value));
	component_subscribe($$self, sustainOnOff, $$value => $$invalidate(18, $sustainOnOff = $$value));
	component_subscribe($$self, activeNotes, $$value => $$invalidate(19, $activeNotes = $$value));
	component_subscribe($$self, rollPedalingOnOff, $$value => $$invalidate(20, $rollPedalingOnOff = $$value));
	let tempoMap;

	const controllerChange = Object.freeze({
		SUSTAIN_PEDAL: 64,
		SOFT_PEDAL: 67, // (una corda)
		PEDAL_ON: 127
	});

	const midiSamplePlayer = new MidiPlayer.Player();

	const piano = new Piano({
			url: "assets/samples/",
			velocities: 2,
			release: true,
			pedal: true,
			maxPolyphony: 64
		}).toDestination();

	const pianoReady = piano.load();

	const getTempoAtTick = tick => {
		if (!tempoMap || !$useMidiTempoEventsOnOff) return DEFAULT_TEMPO;
		let tempo;
		let i = 0;

		while (tempoMap[i][0] <= tick) {
			[,tempo] = tempoMap[i];
			i += 1;
			if (i >= tempoMap.length) break;
		}

		return tempo;
	};

	const updatePlayer = (fn = () => {
			
		}) => {
		if (midiSamplePlayer.isPlaying()) {
			midiSamplePlayer.pause();
			fn();
			midiSamplePlayer.setTempo(getTempoAtTick($currentTick) * $tempoCoefficient);
			midiSamplePlayer.play();
			return;
		}

		fn();
		midiSamplePlayer.setTempo(getTempoAtTick($currentTick) * $tempoCoefficient);
	};

	const startNote = (noteNumber, velocity) => {
		const modifiedVelocity = ($playExpressionsOnOff && velocity || DEFAULT_NOTE_VELOCITY) / 100 * ($softOnOff && SOFT_PEDAL_RATIO || 1) * ($accentOnOff && ACCENT_BUMP || 1) * $volumeCoefficient * (noteNumber < HALF_BOUNDARY
		? $bassVolumeCoefficient
		: $trebleVolumeCoefficient);

		if (modifiedVelocity) {
			piano.keyDown({
				midi: noteNumber,
				velocity: Math.min(modifiedVelocity, 1)
			});
		}
	};

	const stopNote = noteNumber => piano.keyUp({ midi: noteNumber });

	const stopAllNotes = () => {
		piano.pedalUp();
		if ($sustainOnOff) piano.pedalDown();
		$activeNotes.forEach(stopNote);
	};

	const resetPlayback = () => {
		currentTick.reset();
		midiSamplePlayer.stop();
	};

	const pausePlayback = () => {
		midiSamplePlayer.pause();
		stopAllNotes();
		activeNotes.reset();
		softOnOff.reset();
		sustainOnOff.reset();
		accentOnOff.reset();
	};

	const startPlayback = () => {
		if ($currentTick < 0) resetPlayback();
		updatePlayer();
		midiSamplePlayer.play();
	};

	midiSamplePlayer.on("fileLoaded", () => {
		const decodeHtmlEntities = string => string.replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num)).replace(/&#x([A-Za-z0-9]+);/g, (match, num) => String.fromCodePoint(parseInt(num, 16)));
		const metadataTrack = midiSamplePlayer.events[0];
		rollMetadata.set(Object.fromEntries(metadataTrack.filter(event => event.name === "Text Event").map(event => event.string.match(/^@([^:]*):[\t\s]*(.*)$/).slice(1, 3).map(decodeHtmlEntities))));

		tempoMap = metadataTrack.filter(event => event.name === "Set Tempo").reduce(
			(_tempoMap, { tick, data }) => {
				if (!_tempoMap.map(([,_data]) => _data).includes(data)) _tempoMap.push([tick, data]);
				return _tempoMap;
			},
			[]
		);
	});

	midiSamplePlayer.on("playing", ({ tick }) => {
		if (tick <= midiSamplePlayer.totalTicks) currentTick.set(tick);
	});

	midiSamplePlayer.on("midiEvent", ({ name, value, number, noteNumber, velocity, data }) => {
		if (name === "Note on") {
			if (velocity === 0) {
				stopNote(noteNumber);
				activeNotes.delete(noteNumber);
			} else {
				startNote(noteNumber, velocity);
				activeNotes.add(noteNumber);
			}
		} else if (name === "Controller Change" && $rollPedalingOnOff) {
			if (number === controllerChange.SUSTAIN_PEDAL) {
				if (value === controllerChange.PEDAL_ON) {
					piano.pedalDown();
					sustainOnOff.set(true);
				} else {
					piano.pedalUp();
					sustainOnOff.set(false);
				}
			} else if (number === controllerChange.SOFT_PEDAL) {
				softOnOff.set(value === controllerChange.PEDAL_ON);
			}
		} else if (name === "Set Tempo" && $useMidiTempoEventsOnOff) {
			midiSamplePlayer.setTempo(data * $tempoCoefficient);
		}
	});

	midiSamplePlayer.on("endOfFile", pausePlayback);

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sustainOnOff*/ 262144) {
			/* eslint-disable no-unused-expressions, no-sequences */
			$: $sustainOnOff ? piano.pedalDown() : piano.pedalUp();
		}

		if ($$self.$$.dirty & /*$tempoCoefficient*/ 2048) {
			$: ($tempoCoefficient, updatePlayer());
		}

		if ($$self.$$.dirty & /*$useMidiTempoEventsOnOff*/ 512) {
			$: ($useMidiTempoEventsOnOff, updatePlayer());
		}

		if ($$self.$$.dirty & /*$rollPedalingOnOff*/ 1048576) {
			$: if ($rollPedalingOnOff) {
				
			} else {
				sustainOnOff.set(false); // TODO: set roll pedalling according to (as yet unavailable) pedalMap
				softOnOff.set(false);
			}
		}
	};

	return [
		midiSamplePlayer,
		pianoReady,
		updatePlayer,
		startNote,
		stopNote,
		resetPlayback,
		pausePlayback,
		startPlayback
	];
}

class SamplePlayer extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance, null, safe_not_equal, {
			midiSamplePlayer: 0,
			pianoReady: 1,
			updatePlayer: 2,
			startNote: 3,
			stopNote: 4,
			resetPlayback: 5,
			pausePlayback: 6,
			startPlayback: 7
		});
	}

	get midiSamplePlayer() {
		return this.$$.ctx[0];
	}

	get pianoReady() {
		return this.$$.ctx[1];
	}

	get updatePlayer() {
		return this.$$.ctx[2];
	}

	get startNote() {
		return this.$$.ctx[3];
	}

	get stopNote() {
		return this.$$.ctx[4];
	}

	get resetPlayback() {
		return this.$$.ctx[5];
	}

	get pausePlayback() {
		return this.$$.ctx[6];
	}

	get startPlayback() {
		return this.$$.ctx[7];
	}
}

export default SamplePlayer;