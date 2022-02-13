<style lang="scss">
  button {
    @include button;
  }
</style>

<script>
  import {
    inAppExpressionsOnOff,
    expressionParameters,
    rollHasExpressions,
    rollMetadata,
  } from "../stores";
  import {
    getExpressionParams,
  } from "../config/roll-config";

  let expressionParams = $expressionParameters;
</script>

<div id="expression-panel">
  {#if $inAppExpressionsOnOff}
    <fieldset>
      <legend>Expression Settings</legend>
      {#each Object.keys(expressionParams) as expressionParam}
        <div>
          <label
            >{expressionParam}
            <input
              type="number"
              name={expressionParam}
              bind:value={expressionParams[expressionParam]}
              on:change={() =>
                ($expressionParameters[expressionParam] =
                  expressionParams[expressionParam])}
            />
          </label>
        </div>
      {/each}
      <div id="reset-control">
        <button
          type="button"
          on:click={() => {
            $expressionParameters = getExpressionParams(
              $rollMetadata.ROLL_TYPE,
            );
            expressionParams = $expressionParameters;
          }}>Reset to Defaults</button
        >
      </div>
    </fieldset>
  {:else if !$rollHasExpressions}
    <fieldset>
      <legend>Expression emulation not available</legend>
      <p>This roll type does not have any controls for dynamics or pedaling.</p>
    </fieldset>
  {:else}
    <fieldset>
      <legend>In-app expression not enabled</legend>
      <p>
        Enable "In-App Expression" in the Roll Emulation Settings panel to be
        able to modify the expression parameters.
      </p>
    </fieldset>
  {/if}
</div>
