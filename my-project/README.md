# Three.js Cube Demo

A very small demo using raw HTML/CSS/JS and Three.js (CDN). Open `index.html` in your browser to see a rotating cube.

How to run:

- Quick (open file):

  - Double-click `index.html` or open it in your browser (some browsers restrict local file access for modules, but this demo uses the non-module build so it should work).

- Recommended (local server):

  Run a simple HTTP server from the project root to avoid any file restrictions. Example (macOS / zsh):

  ```bash
  python3 -m http.server 8000
  # then open http://127.0.0.1:8000 in your browser
  ```

Files added:

- `index.html` — demo page
- `css/style.css` — layout and minimal styling
- `js/script.js` — Three.js scene setup and animation

If you'd like OrbitControls, a UI, or an ES module version, I can add that next.
