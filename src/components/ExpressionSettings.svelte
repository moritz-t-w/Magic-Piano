<script>
    import {
    inAppExpressionsOnOff,
    expressionParameters,
    rollHasExpressions
    } from "../stores";
</script>

<div id="expression-panel">
  {#if $inAppExpressionsOnOff}
    <fieldset>
      <legend>Expression Settings</legend>
      {#each Object.keys($expressionParameters) as expressionParam}
        <label
          >{expressionParam}
          <input
            type="number"
            name={expressionParam}
            bind:value={$expressionParameters[expressionParam]}
          />
        </label>
      {/each}
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
