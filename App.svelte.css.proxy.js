// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#app.svelte-4jntzw.svelte-4jntzw{display:grid;grid-template-rows:1fr auto;grid-template-columns:auto 1fr auto;grid-template-areas:\"left roll right\" \"keyboard keyboard keyboard\";height:100vh}#roll-details.svelte-4jntzw.svelte-4jntzw{grid-area:left;max-width:calc(348px + 2em)}#roll-details.svelte-4jntzw p.svelte-4jntzw{margin:1em;opacity:0.5;padding:0.5em 1em}#roll.svelte-4jntzw.svelte-4jntzw{grid-area:roll;position:relative}#audio-controls.svelte-4jntzw.svelte-4jntzw{grid-area:right}#keyboard-container.svelte-4jntzw.svelte-4jntzw{grid-area:keyboard}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}