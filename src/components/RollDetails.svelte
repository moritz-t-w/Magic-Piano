<style lang="scss">
  dl {
    display: block;
    overflow: auto;
    padding: 0.5em 1em 0em 1em;
  }

  dt {
    color: var(--cardinal-red-dark);
    font-family: SourceSerif4, serif;
    font-size: 0.9em;
    margin-top: 1em;
    margin-bottom: 0.2em;
    text-transform: uppercase;
    display: inline-block;
    width: 100%;

    &::first-letter {
      font-size: 1.3em;
    }

    &:not(.large)::after {
      content: ":";
    }
  }

  dd, dd *, dd * * {
    color: var(--black);
    font-family: SourceSans3, sans-serif;
    display: inline;
    overflow-wrap: anywhere;

    &.large {
      font-size: 1.6em;
      display: block;
    }
  }

  dd:not(:has(a)) {
    text-transform: capitalize;
  }

  dd :global(span) {
    opacity: 0.5;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    line-height: 1rem;
    padding: 0 0 10px;
  }

  li a {
    font-size: 1rem;
    text-decoration: none;
  }

  li a:hover {
    text-decoration: underline;
  }

  nav {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1em;
  }

 /*  nav a {
    background-color: var(--cardinal-red-dark);
    border: none;
    border-radius: 5px;
    color: white;
    cursor: pointer;
    font-size: 1.2em;
    padding: 0.5em 1em;
    text-align: center;
    text-decoration: none;
  }

  nav a.disabled {
    background-color: var(--black);
    cursor: not-allowed;
  } */

  select {
    background-color: var(--white);
    border-radius: 5px;
    border: none;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  select::selection {
    background-color: var(--cardinal-red-dark);
    color: var(--white);
  }
  .nav-link {
	 display: block;
	 background-color: var(--white);
	 color: var(--black);
	 text-decoration: none;
	 margin: 5px 0;
	 padding: 10px;
	 border-radius: 5px;
  }
  .nav-link:hover {
	 text-decoration: none;
	 background-color: var(--black);
	 color: var(--white);
  }
  .nav-link.active {
	 background-color: var(--cardinal-red-dark);
	 color: var(--white);
  }

#button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 164px;
  width: calc(100% - 164px);
  position: absolute;
  right: 0;
  top: 0;
}

#button-container button {
  background-color: var(--cardinal-red-dark);
  border: none;
  border-radius: 5px;
  color: var(--white);
  cursor: pointer;
  font-size: 2em;
  text-align: center;
  text-decoration: none;
  padding: 0.5em 1em;
}

#qrcode-and-button-container {
	position: relative;
}
</style>

<script>
  import catalog from "../config/catalog.json";
  import QRCode from "qrcode";
  import { tick as sweep } from "svelte";
  import { isPlaying } from "../stores";

  const deployment_url = "https://pianolatron-staging.netlify.app";
  const attachDruid = true;

  export let metadata;
  export const similarWorksByPerformer = catalog.filter(
    (w) => w.performer === metadata.performer && w.druid !== metadata.druid,
  );

  const index = catalog.findIndex((w) => w.druid === metadata.druid);
  export const neighbors = {};
  for (const direction of ["←", "→"]) {
    const offset = direction === "←" ? -1 : 1;
    if (index + offset >= 0 && index + offset < catalog.length)
      neighbors[direction] = catalog[index + offset];
    else
      neighbors[direction] = undefined;
  }

  const unavailable = "<span>Unavailable</span>";

  const url = `${deployment_url}${attachDruid ? `/?druid=${metadata.druid}` : ''}`
  QRCode.toDataURL(url).then((dataUrl) => {
    const qrCode = document.querySelector("img");
    qrCode.src = dataUrl;
    qrCode.alt = url;
  });

  export let playPauseApp;

  const togglePlayPause = async () => {
    playPauseApp();
    await sweep();
  };
</script>

<dl>
  <nav>
    <!-- {#each Object.entries(neighbors) as [direction, neighbor]}
      {#if neighbor}
        <a
          href={`/?druid=${neighbor.druid}`}
          >{direction}</a
        >
      {:else}
        <a class="disabled">{direction}</a>
      {/if}
    {/each} -->
  </nav>
  <dt>Rolle</dt>
  <dd class="large">
	<ul>
		{#each catalog as work}
				<li>
					<a href={`/?druid=${work.druid}`} class="{work.druid === metadata.druid ? 'active' : ''} nav-link">
						{@html work.title}
					</a>
				</li>
		{/each}
	</ul>
  </dd>
  <dt>Titel</dt>
  <dd class="large">
    {@html metadata.title || unavailable}
  </dd>
  {#if metadata.performer}
    <dt>Interpret</dt>
    <dd class="large">
      {@html metadata.performer || unavailable}
    </dd>
  {/if}
  <dt>Komponist</dt>
  <dd class="large">
    {@html metadata.composer || unavailable}
  </dd>
  {#if metadata.arranger}
    <dt>Arrangeur</dt>
    <dd class="large">
      {@html metadata.arranger || unavailable}
    </dd>
  {/if}
  <dt>Beschriftung</dt>
  <dd class="large">
    {@html metadata.label || unavailable}
  </dd>
  <dt>Verleger</dt>
  <dd class="large">
    {@html metadata.publisher || unavailable}
  </dd>
  {#if metadata.work}
    <dt>Werk</dt>
    <dd class="large">
      {@html metadata.work || unavailable}
    </dd>
  {/if}
  <dt>QR Code</dt>
  <div id="qrcode-and-button-container">
	<dd>
		<img alt="QR Code" />
	</dd>
	<div id="button-container">
    <button id="start" on:click={togglePlayPause}>
      {$isPlaying ? "Pause" : "Play"}
    </button>
	</div>
  </div>
</dl>
