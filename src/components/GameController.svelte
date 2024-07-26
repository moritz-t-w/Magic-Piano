<script>
  import { clamp } from "../lib/utils";
  import { defaultControlsConfig as controlsConfig } from "../config/controls-config";
  import {
    gameController,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    volumeCoefficient,
    softOnOff,
    sustainOnOff,
    userSustain,
    accentOnOff,
    volumeSensitivity,
    tempoSensitivity,
  } from "../stores";
  import { sustain, sliders } from "../../config.json";

  export let playPauseApp;
  export let updateTickByViewportIncrement;
  export let panHorizontal;
  export let adjustZoom;
  export let bookmarkRoll;

  let controllerLoop = null;
  let lastControllerState = null;
  let gamepad = null;
  let sustainTimeout = null;

  const buttonPressed = (b) => (typeof b === "object" ? b.pressed : b === 1.0);

  const buttonToggled = (buttonIndex) =>
    !lastControllerState ||
    buttonPressed(lastControllerState.buttons[buttonIndex]) !==
      buttonPressed(gamepad.buttons[buttonIndex]);

  const buttonToggledOn = (buttonIndex) =>
    !lastControllerState ||
    (!buttonPressed(lastControllerState.buttons[buttonIndex]) &&
      buttonPressed(gamepad.buttons[buttonIndex]));

  const pollController = () => {
    [gamepad] = navigator.getGamepads();

    function mapRange(value, outMin, outMid, outMax) {
      const { min: inMin, max: inMax } = sliders.inputBounds;

      if (sliders.mode === "linearClamped") {
        // Determine the largest distance from outMid
        const distToMin = Math.abs(outMid - outMin);
        const distToMax = Math.abs(outMax - outMid);
        const largestDistance = Math.max(distToMin, distToMax);

        // Calculate the total range
        const totalRange = largestDistance * 2;

        // Map the input value to the new range
        const mappedValue = (value - inMin) * totalRange / (inMax - inMin) - largestDistance;

        // Adjust the mapped value based on outMid
        const adjustedValue = mappedValue + outMid;

        // Clamp the result between outMin and outMax
        return Math.min(Math.max(adjustedValue, outMin), outMax);
      } else {
        // Normalize the input value to a range of 0 to 1
        let normalizedValue = (value - inMin) / (inMax - inMin);

        // Determine which half of the output range we're in
        if (normalizedValue <= 0.5) {
          // Map to the lower half (outMin to outMid)
          let lowerHalfRange = Math.abs(outMid - outMin);
          return outMin + normalizedValue * 2 * lowerHalfRange;
        } else {
          // Map to the upper half (outMid to outMax)
          let upperHalfRange = Math.abs(outMax - outMid);
          return outMid + (normalizedValue - 0.5) * 2 * upperHalfRange;
        }
      }
    }

    $volumeCoefficient = mapRange(
      gamepad.axes[1],
      controlsConfig.bassVolume.min,
      1,
      controlsConfig.bassVolume.max
    );

    $tempoCoefficient = mapRange(
      gamepad.axes[3],
      controlsConfig.tempo.min,
      1,
      controlsConfig.tempo.max
    );

    // For Play/Pause and Stop buttons, only trigger the function calls
    //  if they were previously up at the last state update and are now down
    if (buttonPressed(gamepad.buttons[2])) adjustZoom("zoomIn");
    if (buttonPressed(gamepad.buttons[3])) adjustZoom("zoomOut");

    if (buttonToggled(4, lastControllerState, gamepad))
      $softOnOff = buttonPressed(gamepad.buttons[4]);

    if (buttonToggled(5, lastControllerState, gamepad) || buttonPressed(gamepad.buttons[5])) {
      $sustainOnOff = buttonPressed(gamepad.buttons[5]);

      userSustain.set(true);
      if ($sustainOnOff) {
        clearTimeout(sustainTimeout);
      } else {
        sustainTimeout = setTimeout(() => {
          userSustain.set(false);
        }, sustain.userSustainTimeout * 1000);
      }
    }

    if (buttonPressed(gamepad.buttons[8])) adjustZoom("resetZoom");
    if (buttonPressed(gamepad.buttons[9])) bookmarkRoll();
    if (
      buttonToggled(10, lastControllerState, gamepad) ||
      buttonToggled(11, lastControllerState, gamepad)
    )
      $accentOnOff =
        buttonPressed(gamepad.buttons[10]) ||
        buttonPressed(gamepad.buttons[11]);

    if (buttonPressed(gamepad.buttons[12]))
      updateTickByViewportIncrement(/* up = */ true);
    if (buttonPressed(gamepad.buttons[13]))
      updateTickByViewportIncrement(/* up - */ false);
    if (buttonPressed(gamepad.buttons[14])) panHorizontal(/* left = */ true);
    if (buttonPressed(gamepad.buttons[15])) panHorizontal(/* left = */ false);

    lastControllerState = {
      timestamp: "timestamp" in gamepad ? gamepad.timestamp : undefined,
      axes: gamepad.axes,
      buttons: gamepad.buttons,
    };
  };

  if (navigator.getGamepads) {
    window.addEventListener("gamepadconnected", (event) => {
      $gameController = event.gamepad;
      gamepad = event.gamepad;
      controllerLoop = setInterval(pollController, 10);
    });

    window.addEventListener("gamepaddisconnected", () => {
      clearInterval(controllerLoop);
      controllerLoop = undefined;
      $gameController = undefined;
      gamepad = null;
    });
  }
</script>
