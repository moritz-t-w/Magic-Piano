<script>
  import MidiPlayer from "midi-player-js";
  import IntervalTree from "node-interval-tree";
  import { Piano } from "../lib/tonejs-piano";

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
    noteVelocities,
    bassExpCurve,
    trebleExpCurve,
    expressionParameters,
  } from "../stores";
  import { clamp, getHoleType, getKeyByValue } from "../lib/utils";
  import {
    getExpressionParams,
    getExpressionStateBox,
    rollProfile,
  } from "../config/roll-config";

  let midiTPQ;
  let tempoMap;
  let pedalingMap;
  let notesMap;

  const TRACKERBAR_DIAMETER = 16.7; // try AVG_HOLE_WIDTH instead?
  const PUNCH_EXTENSION_FRACTION = 0.75;
  // const TRACKER_EXTENSION = parseInt(
  //   TRACKERBAR_DIAMETER * PUNCH_EXTENSION_FRACTION,
  // );
  const TRACKER_EXTENSION = 0;

  let SOFT_PEDAL_ON;
  let SOFT_PEDAL_OFF;
  let SUSTAIN_PEDAL_ON;
  let SUSTAIN_PEDAL_OFF;

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const DEFAULT_TEMPO = 60;
  const SOFT_PEDAL_RATIO = 0.67;
  const ACCENT_BUMP = 1.5;

  const midiSamplePlayer = new MidiPlayer.Player();

  const piano = new Piano({
    url: "samples/",
    velocities: 4,
    release: true,
    pedal: true,
    maxPolyphony: Infinity,
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
      sustainOnOff.set(pedals.includes(SUSTAIN_PEDAL_ON));
      softOnOff.set(pedals.includes(SOFT_PEDAL_ON));
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

  // XXX Eventually this should be computed via the acceleration algorithm
  const buildTempoMap = (metadataTrack) =>
    metadataTrack
      .filter((event) => event.name === "Set Tempo")
      .reduce((_tempoMap, { tick, data }) => {
        if (!_tempoMap.map(([, _data]) => _data).includes(data))
          _tempoMap.push([tick, data]);
        return _tempoMap;
      }, []);

  // Get pedal events from track 0 (bass control = soft pedal) and
  // track 1 (treble control = sustain pedal)
  const buildPedalingMap = (musicTracks) => {
    const _pedalingMap = new IntervalTree();

    // For 65-note rolls, or any weird MIDI input file with only 1 note track
    if (musicTracks.length == 1) return _pedalingMap;

    const registerPedalEvents = (track, pedal_on, pedal_off) => {
      let tickOn = false;
      track
        // Only want beginning of note holes for lock & cancel type expression
        // mechanisms (works for Welte red and Licensee, not 88 or Welte green)
        .filter(({ name, velocity }) => name === "Note on" && velocity === 1)
        .forEach(({ noteNumber, tick }) => {
          if (noteNumber === pedal_off) {
            if (tickOn) _pedalingMap.insert(tickOn, tick, pedal_on);
            tickOn = false;
          } else if (noteNumber === pedal_on) {
            if (!tickOn) tickOn = tick;
          }
        });
    };

    registerPedalEvents(musicTracks[0], SOFT_PEDAL_ON, SOFT_PEDAL_OFF);
    registerPedalEvents(musicTracks[1], SUSTAIN_PEDAL_ON, SUSTAIN_PEDAL_OFF);

    return _pedalingMap;
  };

  const buildNotesMap = (musicTracks) => {
    const _notesMap = new IntervalTree();

    const registerNoteEvents = (track) => {
      const tickOn = {};
      track
        // The beginning of a note has velocity=1, end is velocty=0
        .filter(
          ({ name, noteNumber }) =>
            name === "Note on" &&
            getHoleType(noteNumber, $rollMetadata.ROLL_TYPE) === "note",
        )
        .forEach(({ noteNumber, velocity, tick }) => {
          if (velocity === 0) {
            if (noteNumber in tickOn) {
              _notesMap.insert(tickOn[noteNumber], tick, noteNumber);
              delete tickOn[noteNumber];
            }
          } else if (!(noteNumber in tickOn)) tickOn[noteNumber] = tick;
        });
    };

    // For 65-note rolls, or any weird MIDI input file with only 1 note track
    if (musicTracks.length == 1) registerNoteEvents(musicTracks[0]);
    else {
      registerNoteEvents(musicTracks[2]);
      registerNoteEvents(musicTracks[3]);
    }

    return _notesMap;
  };

  const getMillisecondsAtTick = (tick) => {
    if (!tempoMap || !$useMidiTempoEventsOnOff)
      return (parseFloat(tick) / midiTPQ) * 1000;
    let lastTime = 0.0;
    let lastTick = 0;
    let lastTempo = DEFAULT_TEMPO;
    let tempo;
    let i = 0;
    while (tempoMap[i][0] <= tick) {
      [, tempo] = tempoMap[i];
      if (i !== 0) {
        const lastTicksPerSecond = (parseFloat(lastTempo) * midiTPQ) / 60.0;
        const ticksAtLastTempo = parseFloat(tempoMap[i][0] - lastTick);
        const timeAtLastTempo = (ticksAtLastTempo / lastTicksPerSecond) * 1000;
        lastTime += timeAtLastTempo;
      }
      lastTempo = tempo;
      lastTick = tempoMap[i][0];
      i += 1;
      if (i >= tempoMap.length) break;
    }
    const lastTicksPerSecond = (parseFloat(lastTempo) * midiTPQ) / 60.0;
    const ticksAtLastTempo = parseFloat(tick - lastTick);
    const timeAtLastTempo = (ticksAtLastTempo / lastTicksPerSecond) * 1000;
    lastTime += timeAtLastTempo;

    return lastTime;
  };

  const getVelocityAtTime = (time, expState, expParams) => {
    let newVelocity = expState.velocity;
    // XXX What if this crosses an acceleration tempo change?
    const msFromLastDynamic = time - expState.time;

    const isFastCrescOn =
      (expState.fast_cresc_start !== null &&
        expState.fast_cresc_stop === null) ||
      (expState.fast_cresc_start !== null &&
        expState.fast_cresc_stop !== null &&
        expState.fast_cresc_stop > time);
    const isFastDecrescOn =
      (expState.fast_decresc_start !== null &&
        expState.fast_decresc_stop === null) ||
      (expState.fast_decresc_start !== null &&
        expState.fast_decresc_stop !== null &&
        expState.fast_decresc_stop > time);

    if (
      expState.slow_cresc_start === null &&
      !isFastCrescOn &&
      !isFastDecrescOn
    ) {
      newVelocity -= msFromLastDynamic * expParams.slow_step;
    } else {
      newVelocity +=
        expState.slow_cresc_start !== null
          ? msFromLastDynamic * expParams.slow_step
          : 0;
      newVelocity += isFastCrescOn
        ? msFromLastDynamic * expParams.fastC_step
        : 0;
      newVelocity += isFastDecrescOn
        ? msFromLastDynamic * expParams.fastD_step
        : 0;
    }

    const velocityDelta = newVelocity - expState.velocity;

    if (expState.mf_start !== null) {
      if (expState.velocity > expParams.welte_mf) {
        newVelocity =
          velocityDelta < 0
            ? Math.max(expParams.welte_mf + 0.001, newVelocity)
            : Math.min(expParams.welte_f, newVelocity);
      } else if (expState.velocity < expParams.welte_mf) {
        newVelocity =
          velocityDelta > 0
            ? Math.min(expParams.welte_mf - 0.001, newVelocity)
            : Math.max(expParams.welte_p, newVelocity);
      }
    } else {
      if (
        expState.slow_cresc_start !== null &&
        !isFastCrescOn &&
        expState.velocity < expParams.welte_loud
      ) {
        newVelocity = Math.min(newVelocity, expParams.welte_loud - 0.001);
      }
    }

    newVelocity = clamp(newVelocity, expParams.welte_p, expParams.welte_f);

    return newVelocity;
  };

  const buildExpressionMap = (musicTracks) => {

    const expParams = getExpressionParams($rollMetadata.ROLL_TYPE);

    if (expParams === null) return [null, null, null];

    $expressionParameters = expParams;

    const _expressionMap = {};

    const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs, adjust) => {
      const expState = getExpressionStateBox($rollMetadata.ROLL_TYPE);

      let expressionCurve = [];

      expState.velocity = expParams.welte_p;

      const panMsgs = ctrlTrackMsgs
        .filter(({ name }) => name === "Note on")
        .concat(
          noteTrackMsgs.filter(
            ({ name, velocity }) => name === "Note on" && !!velocity,
          ),
        )
        .sort((a, b) => (a.tick > b.tick ? 1 : -1));

      panMsgs.forEach(({ noteNumber: midiNumber, velocity, tick }) => {
        const ticksPerSecond =
          (parseFloat(getTempoAtTick(tick)) * midiTPQ) / 60.0;
        const msgTime =
          expState.time +
          (parseFloat(tick - expState.tick) / ticksPerSecond) * 1000;
        //const msgTime = getMillisecondsAtTick(tick);

        const holeType = getHoleType(
          { m: midiNumber },
          $rollMetadata.ROLL_TYPE,
        );

        if (holeType === "note") {
          // Only apply adjustment (if at all) on the external (played)
          // velocities, not the interally stored/computed expressions
          const noteVelocity =
            getVelocityAtTime(msgTime, expState, expParams) + adjust;

          if (tick in _expressionMap) {
            _expressionMap[tick][midiNumber] = noteVelocity;
          } else {
            _expressionMap[tick] = new Object();
            _expressionMap[tick][midiNumber] = noteVelocity;
          }
        } else if (holeType === "control") {
          const ctrlFunc =
            rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber];
          if (velocity === 0 && !["sf_on", "sf_off"].includes(ctrlFunc)) {
            return;
          }
          const panVelocity = getVelocityAtTime(msgTime, expState, expParams);
          const trackerExtensionSeconds = TRACKER_EXTENSION / ticksPerSecond;
          if (ctrlFunc === "mf_on" && velocity > 0) {
            expState.mf_start = msgTime;
          } else if (ctrlFunc === "mf_off" && velocity > 0) {
            expState.mf_start = null;
          } else if (ctrlFunc === "cresc_on" && velocity > 0) {
            expState.slow_cresc_start = msgTime;
            expState.slow_decresc_start = null;
          } else if (ctrlFunc === "cresc_off" && velocity > 0) {
            expState.slow_cresc_start = null;
            expState.slow_decresc_start = msgTime;
          } else if (ctrlFunc === "sf_on") {
            if (velocity > 0) {
              expState.fast_cresc_start = msgTime;
              expState.fast_cresc_stop = null;
            } else {
              expState.fast_cresc_stop =
                msgTime + trackerExtensionSeconds * 1000.0;
            }
          } else if (ctrlFunc === "sf_off") {
            if (velocity > 0) {
              expState.fast_decresc_start = msgTime;
              expState.fast_decresc_stop = null;
            } else {
              expState.fast_decresc_stop =
                msgTime + trackerExtensionSeconds * 1000.0;
            }
          }
          expState.tick = tick;
          expState.time = msgTime;
          expState.velocity = panVelocity;
          expressionCurve.push([tick, panVelocity]);
        }
      });
      return expressionCurve;
    };

    // bass notes and control holes
    const bassExpCurve = buildPanExpMap(
      musicTracks[0],
      musicTracks[2],
      expParams.left_adjust,
    );
    // treble notes and control holes
    const trebleExpCurve = buildPanExpMap(musicTracks[1], musicTracks[3], 0);

    return [_expressionMap, bassExpCurve, trebleExpCurve];
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

    SOFT_PEDAL_ON = getKeyByValue(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      "soft_on",
    );
    SOFT_PEDAL_OFF = getKeyByValue(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      "soft_off",
    );
    SUSTAIN_PEDAL_ON = getKeyByValue(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      "sust_on",
    );
    SUSTAIN_PEDAL_OFF = getKeyByValue(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      "sust_off",
    );

    midiTPQ = midiSamplePlayer.getDivision().division;

    tempoMap = buildTempoMap(metadataTrack);

    pedalingMap = buildPedalingMap(musicTracks);

    notesMap = buildNotesMap(musicTracks);

    [$noteVelocities, $bassExpCurve, $trebleExpCurve] =
      buildExpressionMap(musicTracks);
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
      noteName,
    }) => {
      if (msgType === "Note on") {
        const holeType = getHoleType(
          { m: midiNumber },
          $rollMetadata.ROLL_TYPE,
        );
        if (holeType === "note") {
          const tempo = getTempoAtTick(tick);
          //const thisTime = getMillisecondsAtTick(tick);
          if (velocity === 0) {
            const ticksPerSecond = (parseFloat(tempo) * midiTPQ) / 60.0;
            // At 591 TPQ & 60bpm, this is ~.02s, drops slowly due to accel
            const trackerExtensionSeconds = TRACKER_EXTENSION / ticksPerSecond;
            stopNote(midiNumber, `+${trackerExtensionSeconds}`);
            activeNotes.delete(midiNumber);
          } else {
            const noteVelocity =
              $playExpressionsOnOff && $noteVelocities !== null
                ? $noteVelocities[tick][midiNumber]
                : DEFAULT_NOTE_VELOCITY;

            // console.log(
            //   noteName,
            //   noteVelocity,
            // );

            startNote(midiNumber, noteVelocity);
            activeNotes.add(midiNumber);
          }
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
        // XXX Recalculate expressions when user changes the tempo coefficient?
        const newTempo = data * $tempoCoefficient;
        midiSamplePlayer.setTempo(newTempo);
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
