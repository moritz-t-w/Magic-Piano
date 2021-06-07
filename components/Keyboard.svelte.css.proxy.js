// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "#keyboard.svelte-1lm3ox6.svelte-1lm3ox6.svelte-1lm3ox6{display:flow-root;margin:1vh 1vw;aspect-ratio:10/1;z-index:3;position:relative}#keyboard.svelte-1lm3ox6:hover .overlay-buttons{opacity:1}@supports not (aspect-ratio: 10/1){#keyboard.svelte-1lm3ox6.svelte-1lm3ox6.svelte-1lm3ox6{padding-top:10%}div#keys.svelte-1lm3ox6.svelte-1lm3ox6.svelte-1lm3ox6{top:0}}div#keys.svelte-1lm3ox6.svelte-1lm3ox6.svelte-1lm3ox6{position:absolute;display:flex;padding:0;height:100%;width:100%}div#keys.svelte-1lm3ox6.svelte-1lm3ox6.svelte-1lm3ox6::before{background-color:var(--primary-accent);background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAICAYAAADeM14FAAAAfUlEQVQYVyXMoQ3AIBBG4f92qEIiLkyAqmQBBmAChmgXqOwO1GHOMQEOhWQBJqhqQu2XvEelFL7vG601hBBA3ntWSuG6LjjnQDFGft8XtVZYa0HGGB5jYN/3haS15m3bcBzHD713Timt/jxPkIhwzhlzTsQY/+nzPGsoIvgAaMAzN5CzOpMAAAAASUVORK5CYII=);content:\"\";position:absolute;top:0;height:2%;left:0;right:0;box-shadow:0 1px 1px rgba(0, 0, 0, 0.7), 1px 0 1px rgba(0, 0, 0, 0.7), -1px 0 1px rgba(0, 0, 0, 0.7);z-index:1}div#keys.svelte-1lm3ox6 div.svelte-1lm3ox6.svelte-1lm3ox6{position:relative;flex:1 0 auto}div#keys.svelte-1lm3ox6 div.svelte-1lm3ox6 .svelte-1lm3ox6:first-child{background:linear-gradient(-30deg, #f5f5f5, #fff);border-radius:0 0 4% 4%;border:1px solid #ccc;box-shadow:inset 0 1px 0 #fff, inset 0 -1px 0 #fff, inset 1px 0 0 #fff, inset -1px 0 0 #fff, 0 4px 3px rgba(0, 0, 0, 0.7);display:block;height:100%}div#keys.svelte-1lm3ox6 div.svelte-1lm3ox6 :first-child.depressed{box-shadow:0 2px 2px rgba(0, 0, 0, 0.4);height:98%;position:relative;top:2px}div#keys.svelte-1lm3ox6 div.svelte-1lm3ox6 :first-child.depressed:before{background:rgba(0, 0, 0, 0.1);content:\"\";bottom:0;position:absolute;left:0;top:0;width:10%}div#keys.svelte-1lm3ox6 div.svelte-1lm3ox6 :first-child.depressed:after{background:rgba(0, 0, 0, 0.1);content:\"\";bottom:0;position:absolute;right:0;top:0;width:10%}div#keys.svelte-1lm3ox6 div.svelte-1lm3ox6 :first-child.depressed{background:#b5e2ff}div#keys.svelte-1lm3ox6 div.svelte-1lm3ox6 .svelte-1lm3ox6:nth-child(2){background:linear-gradient(-20deg, #333, #000, #333);border-color:#666 #222 #111 #555;border-radius:0 0 3% 3%;border-style:solid;border-width:1px 2px 7px;box-shadow:inset 0 -1px 2px rgba(255, 255, 255, 0.4), 0 2px 3px rgba(0, 0, 0, 0.4);height:56%;left:100%;position:absolute;top:2%;width:50%;z-index:1;transform:translateX(-50%)}div#keys.svelte-1lm3ox6 div.svelte-1lm3ox6 :nth-child(2).depressed{background:#b5e2ff;border-bottom-width:2px;box-shadow:inset 0 -1px 1px rgba(255, 255, 255, 0.4), 0 1px 0 rgba(0, 0, 0, 0.8), 0 2px 2px rgba(0, 0, 0, 0.4), 0 -1px 0 #000;height:57%}div.pedal.svelte-1lm3ox6.svelte-1lm3ox6.svelte-1lm3ox6{filter:drop-shadow(0px 8px 3px black) saturate(0.4);margin:0 4%;transform:rotate3d(1, 0, 0, 30deg);transform-origin:top;transition:all 0.1s ease;left:38%;position:relative;margin-top:-25px;cursor:pointer;width:3%;display:inline-block}div.pedal.depressed.svelte-1lm3ox6.svelte-1lm3ox6.svelte-1lm3ox6{filter:drop-shadow(0px 4px 2px black) saturate(0.6);transform:rotate3d(0, 0, 0, 0)}div.pedal.svelte-1lm3ox6 svg.svelte-1lm3ox6.svelte-1lm3ox6{width:100%}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}