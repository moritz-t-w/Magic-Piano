<style lang="scss">
  div#audio-panel {
    @include background;
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    overflow-y: auto;

    div + div {
      margin-top: 1em;
    }
  }
  .control {
    align-items: center;
    display: grid;
    grid:
      "title value" auto
      "slider slider" auto / 1fr auto;

    :global(input[type="range"]) {
      grid-area: slider;
      width: 100%;
    }
  }

  fieldset {
    margin: 1.5em 0;
    padding: 0.5em 0.25em;

    div {
      display: flex;
      justify-content: space-between;
    }
  }

  legend {
    font-family: $primary-typeface;
    font-size: 1.4em;
  }
</style>

<script>
  import { fly } from "svelte/transition";
  import {
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    octaveVelocitiesAdjust,
  } from "../stores";

  import RangeSlider from "../ui-components/RangeSlider.svelte";

  let el;
</script>

<div
  id="audio-panel"
  bind:this={el}
  transition:fly|local={{
    delay: 0,
    duration: 300,
    x: parseInt(window.getComputedStyle(el).width, 10),
    y: 0,
    opacity: 1,
  }}
>
  <fieldset>
    <legend>Piano Sample Volumes</legend>
    <div class="control">
      <span>Strings</span>
      <span>{$sampleVolumes.strings}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$sampleVolumes.strings}
        name="strings-volume"
      />
    </div>
    <div class="control">
      <span>Harmonics</span>
      <span>{$sampleVolumes.harmonics}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$sampleVolumes.harmonics}
        name="harmonics-volume"
      />
    </div>
    <div class="control">
      <span>Pedals</span>
      <span>{$sampleVolumes.pedal}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$sampleVolumes.pedal}
        name="pedals-volume"
      />
    </div>
    <div class="control">
      <span>Keybed</span>
      <span>{$sampleVolumes.keybed}</span>
      <RangeSlider
        min="-60"
        max="10"
        step="1"
        bind:value={$sampleVolumes.keybed}
        name="keybed-volume"
      />
    </div>
  </fieldset>
  <fieldset>
    <legend>Audio Controls</legend>
    <div class="control">
      <span>Sample Count</span>
      <span>{$sampleVelocities}</span>
      <RangeSlider
        min="1"
        max="16"
        step="1"
        bind:value={$sampleVelocities}
        name="sample-velocities"
      />
    </div>
    <div class="control">
      <span>Reverb</span>
      <span>{$reverbWetDry}</span>
      <RangeSlider
        min="0"
        max="1"
        step=".05"
        bind:value={$reverbWetDry}
        name="reverb-wetdry"
      />
    </div>
  </fieldset>
  <fieldset>
    <legend>Octave Velocity Adjustments</legend>
    <div class="control">
      <span>A0-B1</span>
      <span>{$octaveVelocitiesAdjust["0"]}</span>
      <RangeSlider
        min="-10"
        max="10"
        step="1"
        bind:value={$octaveVelocitiesAdjust["0"]}
        name="a0-b1-velocity-adjust"
      />
    </div>
    <div class="control">
      <span>C2-B2</span>
      <span>{$octaveVelocitiesAdjust["1"]}</span>
      <RangeSlider
        min="-10"
        max="10"
        step="1"
        bind:value={$octaveVelocitiesAdjust["1"]}
        name="c2-b2-velocity-adjust"
      />
    </div>
    <div class="control">
      <span>C3-B3</span>
      <span>{$octaveVelocitiesAdjust["2"]}</span>
      <RangeSlider
        min="-10"
        max="10"
        step="1"
        bind:value={$octaveVelocitiesAdjust["2"]}
        name="c3-b3-velocity-adjust"
      />
    </div>
    <div class="control">
      <span>C4-B4</span>
      <span>{$octaveVelocitiesAdjust["3"]}</span>
      <RangeSlider
        min="-10"
        max="10"
        step="1"
        bind:value={$octaveVelocitiesAdjust["3"]}
        name="c4-b4-velocity-adjust"
      />
    </div>
    <div class="control">
      <span>C5-B5</span>
      <span>{$octaveVelocitiesAdjust["4"]}</span>
      <RangeSlider
        min="-10"
        max="10"
        step="1"
        bind:value={$octaveVelocitiesAdjust["4"]}
        name="c5-b5-velocity-adjust"
      />
    </div>
    <div class="control">
      <span>C6-B6</span>
      <span>{$octaveVelocitiesAdjust["5"]}</span>
      <RangeSlider
        min="-10"
        max="10"
        step="1"
        bind:value={$octaveVelocitiesAdjust["5"]}
        name="c6-b6-velocity-adjust"
      />
    </div>
    <div class="control">
      <span>C7-C8</span>
      <span>{$octaveVelocitiesAdjust["6"]}</span>
      <RangeSlider
        min="-10"
        max="10"
        step="1"
        bind:value={$octaveVelocitiesAdjust["6"]}
        name="c7-c8-velocity-adjust"
      />
    </div>
  </fieldset>
</div>
