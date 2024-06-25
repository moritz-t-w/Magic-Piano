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

#start {
	position: absolute;
	font-size: 2em;
	color: var(--white);
	margin-left: 100px;
}

/** https://codepen.io/thierrymichel/pen/Pwzbmd */
$bg: #4f0000;
$push-color: #820000;

$push-size: 164px;

[class*="push"] {
  position: relative;
  display: inline-block;
  width: $push-size;
  height: $push-size;
  border: 0;
  outline: none;
  background-color: $push-color;
  border-radius: 50%;
  cursor: pointer;
  transition: box-shadow 200ms;
}
.push--flat {
  box-shadow:
    inset 0 $push-size/32 0 lighten($push-color, 5%),
    inset 0 (-$push-size/32) 0 darken($push-color, 5%),
    inset 0 0 0 $push-size/32 darken($push-color, 3%),
    inset 0 0 0 $push-size/12 $push-color,
    inset 0 0 0 $push-size/10 darken($push-color, 20%),
    inset 0 0 0 $push-size/9.2 darken($push-color, 50%),
    inset 0 0 0 $push-size/7.5 transparentize(lighten($push-color, 30%), .3),
    inset 0 0 0 $push-size/5.5 $push-color,
    inset 0 $push-size/2.5 $push-size/7.5 darken($push-color, 5%),
    inset 0 0 $push-size/10 $push-size/6 darken($push-color, 10%),
    0 $push-size/20 0 rgba(0, 0, 0, .3);

  &:after {
    content: '';
    position: absolute;
    bottom: $push-size/20;
    left: $push-size/10;
    display: block;
    width: $push-size/1.25;
    height: $push-size/1.25;
    border: $push-size/15 solid rgba(0, 0, 0, .3);
    border-width: 0 0 $push-size/15;
    border-radius: 50%;
    transition-duration: 200ms;
  }

  &:active,
  // &:hover,
  &.is-pushed {
    box-shadow:
      inset 0 $push-size/32 0 lighten($push-color, 5%),
      inset 0 (-$push-size/32) 0 darken($push-color, 5%),
      inset 0 0 0 $push-size/32 darken($push-color, 3%),
      inset 0 0 0 $push-size/12 $push-color,
      inset 0 0 0 $push-size/10 darken($push-color, 20%),
      inset 0 0 0 $push-size/8.5 darken($push-color, 40%),
      inset 0 0 0 $push-size/7.5 transparentize(lighten($push-color, 30%), .8),
      inset 0 0 0 $push-size/5.5 darken($push-color, 3%),
      inset 0 $push-size/2.5 $push-size/7.5 darken($push-color, 8%),
      inset 0 0 $push-size/10 $push-size/6 darken($push-color, 15%),
      0 $push-size/20 0 rgba(0, 0, 0, .3);
    background-color: darken($push-color, 2%);

    &:after {
      bottom: $push-size/20 + $push-size/15;
      border-width: 0;
    }
  }
}

.push--skeuo {
  box-shadow:
    inset 0 $push-size/24 0 lighten($push-color, 5%),
    inset 0 (-$push-size/24) $push-size/60 darken($push-color, 5%),
    0 0 $push-size/60 $push-color,
    inset 0 0 $push-size/30 darken($push-color, 15%),
    inset 0 0 $push-size/30 transparentize($bg, .5),
    inset 0 0 $push-size/60 $push-size/12 $push-color,
    inset 0 (-$push-size/30) $push-size/40 $push-size/10 transparentize($bg, .3),
    inset 0 0 $push-size/60 $push-size/10 darken($push-color, 20%),
    inset 0 0 $push-size/60 $push-size/10 transparentize($bg, .3),
    inset 0 0 $push-size/120 $push-size/9.2 darken($push-color, 50%),
    inset 0 0 $push-size/120 $push-size/8 transparentize(lighten($push-color, 30%), .3),
    inset 0 $push-size/20 0 $push-size/8.5 transparentize(lighten($push-color, 15%), .3),
    inset 0 (-$push-size/20) $push-size/60 $push-size/8.5 transparentize(darken($push-color, 10%), .8),
    inset 0 0 0 $push-size/5.5 $push-color,
    inset 0 $push-size/2.5 $push-size/7.5 darken($push-color, 5%),
    inset 0 0 $push-size/10 $push-size/6 darken($push-color, 10%),
    0 $push-size/40 $push-size/20 rgba(0, 0, 0, .5);

  &:active,
  // &:hover,
  &.is-pushed {
    box-shadow:
      inset 0 $push-size/24 0 lighten($push-color, 5%),
      inset 0 (-$push-size/24) $push-size/60 darken($push-color, 5%),
      0 0 $push-size/60 $push-color,
      inset 0 0 $push-size/30 darken($push-color, 15%),
      inset 0 0 $push-size/30 transparentize($bg, .5),
      inset 0 0 $push-size/60 $push-size/12 $push-color,
      inset 0 (-$push-size/30) $push-size/40 $push-size/10 transparentize($bg, .3),
      inset 0 0 $push-size/60 $push-size/10 darken($push-color, 20%),
      inset 0 0 $push-size/60 $push-size/10 transparentize($bg, .3),
      inset 0 0 $push-size/40 $push-size/8.5 darken($push-color, 40%),
      inset 0 0 $push-size/120 $push-size/7.5 transparentize(lighten($push-color, 30%), .8),
      inset 0 $push-size/20 0 28px transparentize(lighten($push-color, 15%), .5),
      inset 0 (-$push-size/20) $push-size/60 28px transparentize(darken($push-color, 20%), .8),
      inset 0 0 0 $push-size/5.5 darken($push-color, 3%),
      inset 0 $push-size/2.5 $push-size/7.5 darken($push-color, 8%),
      inset 0 0 $push-size/10 $push-size/6 darken($push-color, 15%),
      0 $push-size/40 $push-size/20 rgba(0, 0, 0, .5);
    background-color: darken($push-color, 2%);

    &:before {
      opacity: .5;
    }
  }

  &:before {
    content: '';
    position: absolute;
    bottom: $push-size/4.5;
    left: $push-size/3.6;
    display: block;
    width: $push-size/2.2;
    height: $push-size/3.3;
    background: transparentize(lighten($push-color, 30%), .8);
    background: linear-gradient(to top, transparentize(lighten($push-color, 40%), .7) 0%, transparentize($push-color, .9) 100%);
    border-radius: 40% 40% 60% 60%;
    transition: opacity 200ms;
  }
}

.push--skeuo {
  box-shadow:
    inset 0 $push-size/24 0 lighten($push-color, 5%),
    inset 0 (-$push-size/24) $push-size/60 darken($push-color, 5%),
    0 0 $push-size/60 $push-color,
    inset 0 0 $push-size/30 darken($push-color, 15%),
    inset 0 0 $push-size/30 transparentize#F3F9FF
    inset 0 0 $push-size/60 $push-size/12 $push-color,
    inset 0 (-$push-size/30) $push-size/40 $push-size/10 transparentize#F3F9FF
    inset 0 0 $push-size/60 $push-size/10 darken($push-color, 20%),
    inset 0 0 $push-size/60 $push-size/10 transparentize#F3F9FF
    inset 0 0 $push-size/120 $push-size/9.2 darken($push-color, 50%),
    inset 0 0 $push-size/120 $push-size/8 transparentize(lighten($push-color, 30%), .3),
    inset 0 $push-size/20 0 $push-size/8.5 transparentize(lighten($push-color, 15%), .3),
    inset 0 (-$push-size/20) $push-size/60 $push-size/8.5 transparentize(darken($push-color, 10%), .8),
    inset 0 0 0 $push-size/5.5 $push-color,
    inset 0 $push-size/2.5 $push-size/7.5 darken($push-color, 5%),
    inset 0 0 $push-size/10 $push-size/6 darken($push-color, 10%),
    0 $push-size/40 $push-size/20 rgba(0, 0, 0, .5);

  &:active,
  // &:hover,
  &.is-pushed {
    box-shadow:
      inset 0 $push-size/24 0 lighten($push-color, 5%),
      inset 0 (-$push-size/24) $push-size/60 darken($push-color, 5%),
      0 0 $push-size/60 $push-color,
      inset 0 0 $push-size/30 darken($push-color, 15%),
      inset 0 0 $push-size/30 transparentize#F3F9FF
      inset 0 0 $push-size/60 $push-size/12 $push-color,
      inset 0 (-$push-size/30) $push-size/40 $push-size/10 transparentize#F3F9FF
      inset 0 0 $push-size/60 $push-size/10 darken($push-color, 20%),
      inset 0 0 $push-size/60 $push-size/10 transparentize#F3F9FF
      inset 0 0 $push-size/40 $push-size/8.5 darken($push-color, 40%),
      inset 0 0 $push-size/120 $push-size/7.5 transparentize(lighten($push-color, 30%), .8),
      inset 0 $push-size/20 0 28px transparentize(lighten($push-color, 15%), .5),
      inset 0 (-$push-size/20) $push-size/60 28px transparentize(darken($push-color, 20%), .8),
      inset 0 0 0 $push-size/5.5 darken($push-color, 3%),
      inset 0 $push-size/2.5 $push-size/7.5 darken($push-color, 8%),
      inset 0 0 $push-size/10 $push-size/6 darken($push-color, 15%),
      0 $push-size/40 $push-size/20 rgba(0, 0, 0, .5);
    background-color: darken($push-color, 2%);

    &:before {
      opacity: .5;
    }
  }

  &:before {
    content: '';
    position: absolute;
    bottom: $push-size/4.5;
    left: $push-size/3.6;
    display: block;
    width: $push-size/2.2;
    height: $push-size/3.3;
    background: transparentize(lighten($push-color, 30%), .8);
    background: linear-gradient(to top, transparentize(lighten($push-color, 40%), .7) 0%, transparentize($push-color, .9) 100%);
    border-radius: 40% 40% 60% 60%;
    transition: opacity 200ms;
  }
}

</style>

<script>
  import catalog from "../config/catalog.json";
  import QRCode from "qrcode";

  const deployment_url = "https://pianolatron-staging.netlify.app";

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

  const url = `${deployment_url}/?druid=${metadata.druid}`
  QRCode.toDataURL(url).then((dataUrl) => {
    const qrCode = document.querySelector("img");
    qrCode.src = dataUrl;
    qrCode.alt = url;
  });

  function navigateToDruid(event) {
    const selectedDruid = event.target.value;
    if (selectedDruid) {
      window.location.href = `/?druid=${selectedDruid}`;
    }
  }
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
  {#if similarWorksByPerformer.length > 0}
    <dt>Similar Works By This Performer</dt>
    <dd class="large">
      <ul>
        {#each similarWorksByPerformer as work}
          <li>
            <a href={`/?druid=${work.druid}`} target="_blank"
              >{@html work.title}</a
            >
          </li>
        {/each}
      </ul>
    </dd>
  {/if}
  {#if metadata.work}
    <dt>Werk</dt>
    <dd class="large">
      {@html metadata.work || unavailable}
    </dd>
  {/if}
  <dt>QR Code</dt>
  <dd>
    <img alt="QR Code" />
  </dd>
  <button class="push--skeuo" id="start">Start</button>
</dl>
