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

  button {
    display: inline-block;
    padding: 0.35em 0.8em;
    border: 0.1em solid #ffffff;
    margin: 0;
    border-radius: 0.25em;
    color: #ffffff;
    transition: all 0.2s;
    background-color: var(--primary-accent);

    &:hover {
      color: var(--primary-accent);
      border-color: var(--primary-accent);
      background-color: #ffffff;
    }
  }
</style>

<script>
  import { fly } from "svelte/transition";
  import {
    sampleVolumes,
    sampleVelocities,
    reverbWetDry,
    velocitiesAdjust,
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
    <legend>C6-C8 Velocity Adjustments</legend>
    <div class="control">
      <span>Input Velocity 0-19%</span>
      <span>{$velocitiesAdjust["0"]}</span>
      <RangeSlider
        min="-1"
        max="1"
        step=".1"
        bind:value={$velocitiesAdjust["0"]}
        name="upper-velocity-adjust-0-19"
      />
    </div>
    <div class="control">
      <span>Input Velocity 20-39%</span>
      <span>{$velocitiesAdjust["1"]}</span>
      <RangeSlider
        min="-1"
        max="1"
        step=".1"
        bind:value={$velocitiesAdjust["1"]}
        name="upper-velocity-adjust-20-39"
      />
    </div>
    <div class="control">
      <span>Input Velocity 40-59%</span>
      <span>{$velocitiesAdjust["2"]}</span>
      <RangeSlider
        min="-1"
        max="1"
        step=".1"
        bind:value={$velocitiesAdjust["2"]}
        name="upper-velocity-adjust-40-59"
      />
    </div>
    <div class="control">
      <span>Input Velocity 60-79%</span>
      <span>{$velocitiesAdjust["3"]}</span>
      <RangeSlider
        min="-1"
        max="1"
        step=".1"
        bind:value={$velocitiesAdjust["3"]}
        name="upper-velocity-adjust-60-79"
      />
    </div>
    <div class="control">
      <span>Input Velocity 80-100%</span>
      <span>{$velocitiesAdjust["4"]}</span>
      <RangeSlider
        min="-1"
        max="1"
        step=".1"
        bind:value={$velocitiesAdjust["4"]}
        name="upper-velocity-adjust-80-100"
      />
    </div>
    <button
      type="button"
      on:click={() => {
        $velocitiesAdjust["0"] = 0;
        $velocitiesAdjust["1"] = 0;
        $velocitiesAdjust["2"] = 0;
        $velocitiesAdjust["3"] = 0;
        $velocitiesAdjust["4"] = 0;
      }}>Reset</button
    >
  </fieldset>
</div>
