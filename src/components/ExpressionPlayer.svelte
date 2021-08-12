<script>
  import MidiPlayer from "midi-player-js";
  import { Piano } from "@tonejs/piano";
  import IntervalTree from "node-interval-tree";

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
    currentTick,
  } from "../stores";
  import { clamp, getHolePan, getHoleType } from "../utils";
  import {
    getExpressionParams,
    getExpressionStateBox,
    rollProfile,
  } from "../roll-config";

  let midiTPQ;
  let tempoMap;
  let pedalingMap;
  let notesMap;
  let expParams;
  let expressionMap;
  let expState;

  const TRACKERBAR_DIAMETER = 16.7; // try AVG_HOLE_WIDTH instead?
  const PUNCH_EXTENSION_FRACTION = 0.75;
  const TRACKER_EXTENSION = parseInt(
    TRACKERBAR_DIAMETER * PUNCH_EXTENSION_FRACTION,
  );

  const SOFT_PEDAL = 67;
  const SUSTAIN_PEDAL = 64;

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const DEFAULT_TEMPO = 60;
  const SOFT_PEDAL_RATIO = 0.67;
  const ACCENT_BUMP = 1.5;

  const midiSamplePlayer = new MidiPlayer.Player();

  //const TPQ = 591.0; // XXX The MIDI player should provide this, but it can't,
  // so we'll have to read it from another source

  const piano = new Piano({
    url: "assets/samples/",
    velocities: 4,
    release: true,
    pedal: true,
    maxPolyphony: 64,
    volume: {
      strings: -15,
      harmonics: -10,
      pedal: -10,
      keybed: -10,
    },
  }).toDestination();

  const pianoReady = piano.load();

  const getTempoAtTick = (tick) => {
    if (!tempoMap || !$useMidiTempoEventsOnOff) return DEFAULT_TEMPO;
    let tempo;
    let i = 0;
    while (tempoMap[i][0] <= tick) {
      [, tempo] = tempoMap[i];
      i += 1;
      if (i >= tempoMap.length) break;
    }
    return tempo;
  };

  const setPlayerStateAtTick = (tick = $currentTick) => {
    if (midiSamplePlayer.tracks[0])
      midiSamplePlayer.tracks[0].enabled = $useMidiTempoEventsOnOff;
    midiSamplePlayer.setTempo(getTempoAtTick(tick) * $tempoCoefficient);

    if (pedalingMap && $rollPedalingOnOff) {
      const pedals = pedalingMap.search($currentTick, $currentTick);
      sustainOnOff.set(pedals.includes(SUSTAIN_PEDAL));
      softOnOff.set(pedals.includes(SOFT_PEDAL));
    } else {
      sustainOnOff.set(false);
      piano.pedalUp();
      softOnOff.set(false);
    }

    if (notesMap) {
      activeNotes.reset(notesMap.search($currentTick, $currentTick));
    }
  };

  const updatePlayer = (fn = () => {}) => {
    if (midiSamplePlayer.isPlaying()) {
      midiSamplePlayer.pause();
      fn();
      setPlayerStateAtTick($currentTick);
      midiSamplePlayer.play();
      return;
    }
    fn();
    setPlayerStateAtTick($currentTick);
  };

  const startNote = (noteNumber, velocity) => {
    const modifiedVelocity =
      ((($playExpressionsOnOff && velocity) || DEFAULT_NOTE_VELOCITY) / 100) *
      (($softOnOff && SOFT_PEDAL_RATIO) || 1) *
      (($accentOnOff && ACCENT_BUMP) || 1) *
      $volumeCoefficient *
      (noteNumber <= rollProfile[$rollMetadata.ROLL_TYPE].bassNotesEnd
        ? $bassVolumeCoefficient
        : $trebleVolumeCoefficient);
    if (modifiedVelocity) {
      piano.keyDown({
        midi: noteNumber,
        velocity: Math.min(modifiedVelocity, 1),
      });
    }
  };

  const stopNote = (noteNumber, timeDelta) =>
    piano.keyUp({ midi: noteNumber, time: timeDelta });

  const stopAllNotes = () => {
    piano.pedalUp();
    if ($sustainOnOff) piano.pedalDown();
    $activeNotes.forEach(stopNote);
  };

  const resetPlayback = () => {
    currentTick.reset();
    midiSamplePlayer.stop();
    activeNotes.reset();
    softOnOff.reset();
    sustainOnOff.reset();
    accentOnOff.reset();
  };

  const pausePlayback = () => {
    midiSamplePlayer.pause();
    stopAllNotes();
  };

  const startPlayback = () => {
    if ($currentTick < 0) resetPlayback();
    updatePlayer();
    midiSamplePlayer.play();
  };

  const buildTempoMap = (metadataTrack) =>
    metadataTrack
      .filter((event) => event.name === "Set Tempo")
      .reduce((_tempoMap, { tick, data }) => {
        if (!_tempoMap.map(([, _data]) => _data).includes(data))
          _tempoMap.push([tick, data]);
        return _tempoMap;
      }, []);

  const buildPedalingMap = (eventsTrack) => {
    const _pedalingMap = new IntervalTree();
    const controllerEvents = eventsTrack.filter(
      (event) => event.name === "Controller Change",
    );

    const enterEvents = (eventNumber) => {
      let tickOn = false;
      controllerEvents
        .filter(({ number }) => number === eventNumber)
        .forEach(({ value, tick }) => {
          if (value === 0) {
            if (tickOn) _pedalingMap.insert(tickOn, tick, eventNumber);
            tickOn = false;
          } else if (value === 127) {
            if (!tickOn) tickOn = tick;
          }
        });
    };

    enterEvents(SOFT_PEDAL);
    enterEvents(SUSTAIN_PEDAL);

    return _pedalingMap;
  };

  const buildNotesMap = (musicTracks) => {
    const _notesMap = new IntervalTree();
    musicTracks.forEach((track) => {
      const tickOn = {};
      track
        .filter((event) => event.name === "Note on")
        .forEach(({ noteNumber, velocity, tick }) => {
          if (velocity === 0) {
            if (noteNumber in tickOn) {
              _notesMap.insert(tickOn[noteNumber], tick, noteNumber);
              delete tickOn[noteNumber];
            }
          } else if (!(noteNumber in tickOn)) tickOn[noteNumber] = tick;
        });
    });
    return _notesMap;
  };

  const getPanVelocity = (holePan) => {
    let newVelocity = expState[holePan].velocity;
    const msFromLastDynamic = expState.time - expState[holePan].time;

    const isFastCrescOn =
      (expState[holePan].fast_cresc_start !== null &&
        expState[holePan].fast_cresc_stop === null) ||
      (expState[holePan].fast_cresc_start !== null &&
        expState[holePan].fast_cresc_stop !== null &&
        expState[holePan].fast_cresc_stop > expState.time);
    const isFastDecrescOn =
      (expState[holePan].fast_decresc_start !== null &&
        expState[holePan].fast_decresc_stop === null) ||
      (expState[holePan].fast_decresc_start !== null &&
        expState[holePan].fast_decresc_stop !== null &&
        expState[holePan].fast_decresc_stop > expState.time);

    if (
      expState[holePan].slow_cresc_start === null &&
      !isFastCrescOn &&
      !isFastDecrescOn
    ) {
      newVelocity -= msFromLastDynamic * expParams.slow_step;
    } else {
      newVelocity +=
        expState[holePan].slow_cresc_start !== null
          ? msFromLastDynamic * expParams.slow_step
          : 0;
      newVelocity += isFastCrescOn
        ? msFromLastDynamic * expParams.fastC_step
        : 0;
      newVelocity += isFastDecrescOn
        ? msFromLastDynamic * expParams.fastD_step
        : 0;
    }

    const velocityDelta = newVelocity - expState[holePan].velocity;

    if (expState[holePan].mf_start !== null) {
      if (expState[holePan].velocity > expParams.welte_mf) {
        newVelocity =
          velocityDelta < 0
            ? Math.max(expParams.welte_mf + 0.001, newVelocity)
            : Math.min(expParams.welte_f, newVelocity);
      } else if (expState[holePan].velocity < expParams.welte_mf) {
        newVelocity =
          velocityDelta > 0
            ? Math.min(expParams.welte_mf - 0.001, newVelocity)
            : Math.max(expParams.welte_p, newVelocity);
      }
    } else {
      if (
        expState[holePan].slow_cresc_start !== null &&
        !isFastCrescOn &&
        expState[holePan].velocity < expParams.welte_loud
      ) {
        newVelocity = Math.min(newVelocity, expParams.welte_loud - 0.001);
      }
    }

    newVelocity = clamp(newVelocity, expParams.welte_p, expParams.welte_f);

    return newVelocity;
  };

  midiSamplePlayer.on("fileLoaded", () => {
    const decodeHtmlEntities = (string) =>
      string
        .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
        .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
          String.fromCodePoint(parseInt(num, 16)),
        );

    const [metadataTrack, ...musicTracks] = midiSamplePlayer.events;

    rollMetadata.set(
      Object.fromEntries(
        metadataTrack
          .filter((event) => event.name === "Text Event")
          .map((event) =>
            event.string
              .match(/^@([^:]*):[\t\s]*(.*)$/)
              .slice(1, 3)
              .map(decodeHtmlEntities),
          ),
      ),
    );

    midiTPQ = midiSamplePlayer.getDivision().division;

    //console.log($rollMetadata);

    //console.log(midiSamplePlayer.tracks);

    tempoMap = buildTempoMap(metadataTrack);

    // where two or more "music tracks" exist, pedal events are expected to have
    //  been duplicated across tracks, so we read only from the first one.
    pedalingMap = buildPedalingMap(musicTracks[0]);

    notesMap = buildNotesMap(musicTracks);

    expParams = getExpressionParams($rollMetadata.ROLL_TYPE);

    expState = {
      bass: {
        velocity: expParams.welte_p, // Velocity at last cresc/decresc event
        time: 0, // Time (in ms) at last cresc/decresc event
        mf_start: null,
        slow_cresc_start: null,
        slow_decresc_start: null,
        fast_cresc_start: null,
        fast_cresc_stop: null, // Can be in the future due to tracker extension
        fast_decresc_start: null,
        fast_decresc_stop: null,
      },
      treble: {
        velocity: expParams.welte_p,
        time: 0,
        mf_start: null,
        slow_cresc_start: null,
        slow_decresc_start: null,
        fast_cresc_start: null,
        fast_cresc_stop: null,
        fast_decresc_start: null,
        fast_decresc_stop: null,
      },
      tempo: DEFAULT_TEMPO,
      tick: 0,
      time: 0, // In milliseconds
    };
  });

  midiSamplePlayer.on("playing", ({ tick }) => {
    if (tick <= midiSamplePlayer.totalTicks) currentTick.set(tick);
  });

  midiSamplePlayer.on(
    "midiEvent",
    ({
      name: msgType,
      noteNumber: midiNumber,
      velocity,
      data,
      tick,
      value: ctrlrVal,
      number: ctrlrNumber,
      //noteName,
    }) => {
      if (msgType === "Note on") {
        const holeType = getHoleType(
          { m: midiNumber },
          $rollMetadata.ROLL_TYPE,
        );
        const ticksPerSecond = (parseFloat(expState.tempo) * midiTPQ) / 60.0;
        expState.time +=
          (parseFloat(tick - expState.tick) / ticksPerSecond) * 1000;
        expState.tick = tick;
        if (holeType === "note") {
          if (velocity === 0) {
            // At 591 TPQ & 60bpm, this is ~.02s, drops slowly due to accel
            const trackerExtensionSeconds = TRACKER_EXTENSION / ticksPerSecond;
            stopNote(midiNumber, `+${trackerExtensionSeconds}`);
            activeNotes.delete(midiNumber);
          } else {
            const notePan = getHolePan(
              { m: midiNumber },
              $rollMetadata.ROLL_TYPE,
            );
            let velocity = getPanVelocity(notePan);
            if (notePan == "bass") {
              velocity += expParams.left_adjust;
            }
            // console.log(
            //   notePan,
            //   noteName,
            //   expState.tempo,
            //   trackerExtensionSeconds,
            //   expState.time,
            //   tick,
            //   velocity,
            // );
            startNote(midiNumber, velocity);
            activeNotes.add(midiNumber);
          }
        } else if (holeType === "control" && $playExpressionsOnOff) {
          const ctrlFunc =
            rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber];

          if (velocity === 0 && !["sf_on", "sf_off"].includes(ctrlFunc)) {
            return;
          }
          const holePan = getHolePan(
            { m: midiNumber },
            $rollMetadata.ROLL_TYPE,
          );
          const panVelocity = getPanVelocity(holePan);

          if (ctrlFunc === "mf_on" && velocity > 0) {
            expState[holePan].mf_start = expState.time;
          } else if (ctrlFunc === "mf_off" && velocity > 0) {
            expState[holePan].mf_start = null;
          } else if (ctrlFunc === "cresc_on" && velocity > 0) {
            expState[holePan].slow_cresc_start = expState.time;
            expState[holePan].slow_decresc_start = null;
          } else if (ctrlFunc === "cresc_off" && velocity > 0) {
            expState[holePan].slow_cresc_start = null;
            expState[holePan].slow_decresc_start = expState.time;
          } else if (ctrlFunc === "sf_on") {
            if (velocity > 0) {
              expState[holePan].fast_cresc_start = expState.time;
              expState[holePan].fast_cresc_stop = null;
            } else {
              expState[holePan].fast_cresc_stop =
                expState.time + trackerExtensionSeconds * 1000.0;
            }
          } else if (ctrlFunc === "sf_off") {
            if (velocity > 0) {
              expState[holePan].fast_decresc_start = expState.time;
              expState[holePan].fast_decresc_stop = null;
            } else {
              expState[holePan].fast_decresc_stop =
                expState.time + trackerExtensionSeconds * 1000.0;
            }
          }
          expState[holePan].velocity = panVelocity;
          expState[holePan].time = expState.time;
        } else if (holeType === "pedal" && $rollPedalingOnOff) {
          if (velocity === 0) {
            // Length of pedal control holes doesn't matter for red Welte
            // (but it does for green Welte...)
            return;
          }
          if (
            rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber] ===
            "sust_on"
          ) {
            sustainOnOff.set(true);
          } else if (
            rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber] ===
            "sust_off"
          ) {
            sustainOnOff.set(false);
          } else if (
            rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber] ===
            "soft_on"
          ) {
            softOnOff.set(true);
          } else if (
            rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber] ===
            "soft_off"
          ) {
            softOnOff.set(false);
          }
        }
      } else if (msgType === "Set Tempo" && $useMidiTempoEventsOnOff) {
        const newTempo = data * $tempoCoefficient;
        midiSamplePlayer.setTempo(newTempo);
        expState.tempo = newTempo;
      } else if (msgType === "Controller Change" && $rollPedalingOnOff) {
        // This shouldn't happen with note MIDI input
        if (ctrlrNumber === SUSTAIN_PEDAL) {
          sustainOnOff.set(!!ctrlrVal);
        } else if (ctrlrNumber === SOFT_PEDAL) {
          softOnOff.set(!!ctrlrVal);
        }
      }
    },
  );

  midiSamplePlayer.on("endOfFile", pausePlayback);

  /* eslint-disable no-unused-expressions, no-sequences */
  $: $sustainOnOff ? piano.pedalDown() : piano.pedalUp();
  $: $tempoCoefficient, updatePlayer();
  $: $useMidiTempoEventsOnOff, updatePlayer();
  $: $rollPedalingOnOff, updatePlayer();

  export {
    midiSamplePlayer,
    pianoReady,
    updatePlayer,
    startNote,
    stopNote,
    pausePlayback,
    startPlayback,
    resetPlayback,
  };
</script>
