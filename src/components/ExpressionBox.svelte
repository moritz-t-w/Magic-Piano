<script>
  import WebMidi from "./WebMidi.svelte";
  import MidiPlayer from "midi-player-js";
  import IntervalTree from "node-interval-tree";
  import { createEventDispatcher } from "svelte";
  import { Piano } from "../lib/pianolatron-piano";
  import { notify } from "../ui-components/Notification.svelte";
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
    sustainFromExternalMidi,
    softFromExternalMidi,
    useMidiTempoEventsOnOff,
    activeNotes,
    currentTick,
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    noteVelocities,
    bassExpCurve,
    trebleExpCurve,
    expressionParameters,
    velocityCurveLow,
    velocityCurveMid,
    velocityCurveHigh,
    userSettings,
  } from "../stores";
  import { clamp, getHoleType, getKeyByValue, getKeyByValues } from "../lib/utils";
  import {
    getExpressionParams,
    getExpressionStateBox,
    rollProfile,
  } from "../config/roll-config";

  let webMidi;

  let midiTPQ;
  let tempoMap;
  let pedalingMap;
  let notesMap;
  let metadataTrack;
  let musicTracks;

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
  let HALF_BOUNDARY;

  const DEFAULT_NOTE_VELOCITY = 50.0;
  const DEFAULT_TEMPO = 60;
  const SOFT_PEDAL_RATIO = 0.67;
  const ACCENT_BUMP = 1.5;

  const dispatch = createEventDispatcher();

  const midiSamplePlayer = new MidiPlayer.Player();

  const piano = new Piano({
    url: "samples/",
    velocities: $sampleVelocities,
    release: true,
    pedal: true,
    maxPolyphony: Infinity,
    volume: {
      strings: $sampleVolumes.strings,
      harmonics: $sampleVolumes.harmonics,
      pedal: $sampleVolumes.pedal,
      keybed: $sampleVolumes.keybed,
    },
    reverbWet: $reverbWetDry,
  });

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

  const toggleSustain = (onOff, fromMidi) => {
    if (onOff) {
      piano.pedalDown();
    } else {
      piano.pedalUp();
    }
    if (fromMidi && $sustainFromExternalMidi) {
      $sustainOnOff = onOff;
    } else if (!fromMidi && !$sustainFromExternalMidi) {
      webMidi?.sendMidiMsg("CONTROLLER", "SUSTAIN", onOff);
    }
  };

  const toggleSoft = (onOff, fromMidi) => {
    if (fromMidi && $softFromExternalMidi) {
      $softOnOff = onOff;
    } else if (!fromMidi && !$softFromExternalMidi) {
      webMidi?.sendMidiMsg("CONTROLLER", "SOFT", onOff);
    }
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
      softOnOff.set(false);
    }

    if (notesMap) {
      activeNotes.reset(notesMap.search($currentTick, $currentTick));
    }
  };

  const updatePlayer = (fn = () => {}) => {
    if (midiSamplePlayer.isPlaying()) {
      midiSamplePlayer.pause();
      return Promise.resolve(fn()).then(() => {
        setPlayerStateAtTick($currentTick);
        midiSamplePlayer.play();
      });
    }
    return Promise.resolve(fn())
      .then(() => setPlayerStateAtTick($currentTick))
      .catch(() => {});
  };

  const loadSampleVelocities = () => {
    if ($sampleVelocities === piano.loadedVelocities) return;
    updatePlayer(() => {
      const loadingSamples = piano.updateVelocities($sampleVelocities);
      dispatch("loading", loadingSamples);
      // if samples are in the process of being loaded, the promise is
      //  rejected; update the UI to reflect the correct value
      loadingSamples
        .then(() => ($sampleVelocities = piano.loadedVelocities))
        .catch(
          ({ loadedVelocities }) => ($sampleVelocities = loadedVelocities),
        );
      return loadingSamples;
    });
  };

  const updateSampleVelocities = () => {
    if ($sampleVelocities > 4 && $sampleVelocities > piano.loadedVelocities) {
      notify({
        modal: true,
        title: "Please confirm your choice",
        message:
          "Increasing the sample count beyond four will consume large amounts " +
          "of your system's memory, and could result in crashing the browser " +
          "or even the entire system.  If you experience issues, please " +
          "lower the count to four or lower.",
        closable: false,
        actions: [
          {
            label: "okay",
            fn: loadSampleVelocities,
          },
          {
            label: "cancel",
            fn: () => ($sampleVelocities = piano.loadedVelocities),
          },
        ],
      });
      return;
    }
    loadSampleVelocities();
  };

  const startNote = (noteNumber, velocity, fromMidi) => {
    activeNotes.add(noteNumber);
    let baseVelocity =
      (($playExpressionsOnOff && velocity) || DEFAULT_NOTE_VELOCITY) / 100;
    [$velocityCurveLow, $velocityCurveMid, $velocityCurveHigh].forEach(
      (keyboardRegion) => {
        if (
          keyboardRegion.velocityCurve !== null &&
          noteNumber >= keyboardRegion.firstMidi &&
          noteNumber <= keyboardRegion.lastMidi
        ) {
          [, baseVelocity] =
            keyboardRegion.velocityCurve[
              parseInt(keyboardRegion.velocityCurve.length * baseVelocity, 10)
            ];
        }
      },
    );
    // Note: SOFT_PEDAL_RATIO is only applied when calling piano.keyDown() as
    //       @tonejs/piano has so built-in soft pedaling and so we emulate in
    //       software.  For WebMIDI outputs we send soft pedal controller
    //       events and note velocities that are not modified for softness.
    const modifiedVelocity = Math.min(
      baseVelocity *
        (($accentOnOff && ACCENT_BUMP) || 1) *
        $volumeCoefficient *
        (noteNumber < HALF_BOUNDARY
          ? $bassVolumeCoefficient
          : $trebleVolumeCoefficient),
      1,
    );
    if (modifiedVelocity) {
      piano.keyDown({
        midi: noteNumber,
        velocity: modifiedVelocity * (($softOnOff && SOFT_PEDAL_RATIO) || 1),
      });
    }
    if (!fromMidi) {
      webMidi?.sendMidiMsg("NOTE_ON", noteNumber, modifiedVelocity);
    }
  };

  const stopNote = (noteNumber, fromMidi) => {
    activeNotes.delete(noteNumber);
    piano.keyUp({ midi: noteNumber });
    if (!fromMidi) {
      webMidi?.sendMidiMsg("NOTE_OFF", noteNumber, 0);
    }
  };

  const stopAllNotes = () => {
    piano.pedalUp();
    $activeNotes.forEach((midiNumber) => stopNote(midiNumber));
    if ($sustainOnOff) piano.pedalDown();
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

  const buildPedalingMap = (eventsTrack) => {
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

  const buildExpressionMap = (musicTracks, reset) => {

    if (reset) {
      expressionParameters.reset();
    }

    if (!$expressionParameters || Object.keys($expressionParameters).length === 0) {
      $expressionParameters = getExpressionParams($rollMetadata.ROLL_TYPE);
    }

    if ($expressionParameters === null || musicTracks === null) return;

    const _expressionMap = {};

    const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs, adjust) => {
      const expState = getExpressionStateBox($rollMetadata.ROLL_TYPE);

      let expressionCurve = [];

      expState.velocity = $expressionParameters.welte_p;

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
            getVelocityAtTime(msgTime, expState, $expressionParameters) + adjust;

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
          const panVelocity = getVelocityAtTime(msgTime, expState, $expressionParameters);
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
    $bassExpCurve = buildPanExpMap(
      musicTracks[0],
      musicTracks[2],
      $expressionParameters.left_adjust,
    );

    // treble notes and control holes
    $trebleExpCurve = buildPanExpMap(musicTracks[1], musicTracks[3], 0);

    $noteVelocities = _expressionMap;
  };

  midiSamplePlayer.on("fileLoaded", () => {
    const decodeHtmlEntities = (string) =>
      string
        .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
        .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
          String.fromCodePoint(parseInt(num, 16)),
        );

    [metadataTrack, ...musicTracks] = midiSamplePlayer.events;

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

    SOFT_PEDAL_ON = getKeyByValues(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      ["soft_on", "soft"],
    );
    SOFT_PEDAL_OFF = getKeyByValue(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      "soft_off",
    );
    SUSTAIN_PEDAL_ON = getKeyByValue(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      ["sust_on", "sust"],
    );
    SUSTAIN_PEDAL_OFF = getKeyByValue(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      "sust_off",
    );
    HALF_BOUNDARY = getKeyByValue(
      rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap,
      "treble_notes_begin",
    );

    tempoMap = buildTempoMap(metadataTrack);

    pedalingMap = buildPedalingMap(musicTracks);

    notesMap = buildNotesMap(musicTracks);

    buildExpressionMap(musicTracks, true);
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
          } else {
            const noteVelocity =
              $playExpressionsOnOff && $noteVelocities !== null && tick in $noteVelocities
                ? $noteVelocities[tick][midiNumber]
                : DEFAULT_NOTE_VELOCITY;
            startNote(midiNumber, noteVelocity);
          }
        } else if (holeType === "pedal" && $rollPedalingOnOff) {
          if (velocity === 0) {
            if (
              rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber] ===
              "sust"
            ) {
              sustainOnOff.set(false);
            } else if (
              rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber] ===
              "soft"
            ) {
              softOnOff.set(false);
            }
          } else {
            if (
              ["sust_on", "sust"].includes(rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber])
            ) {
              sustainOnOff.set(true);
            } else if (
              rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber] ===
              "sust_off"
            ) {
              sustainOnOff.set(false);
            } else if (
              ["soft_on", "soft"].includes(rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber])
            ) {
              softOnOff.set(true);
            } else if (
              rollProfile[$rollMetadata.ROLL_TYPE].ctrlMap[midiNumber] ===
              "soft_off"
            ) {
              softOnOff.set(false);
            }
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
  $: $expressionParameters, buildExpressionMap(musicTracks, false);

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

{#if $userSettings.useWebMidi}
  <WebMidi
    bind:this={webMidi}
    {startNote}
    {stopNote}
    {toggleSustain}
    {toggleSoft}
  />
{/if}