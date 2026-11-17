# Tap & Tally

A local student behavior tally. Classes, seats, and points stay in this browser's localStorage. Nothing is uploaded.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## GitHub Pages

Pushes to `main` build the app and publish it:

https://kpaekn.github.io/TapAndTally/

Paths are relative, so the same build works from that project site.

Each browser keeps its own copy of the data under the key `tap-tally-v1`. Clearing site data, or opening the app on another computer, starts from an empty roster. Use Reports → Download spreadsheet when you want a copy outside the browser.
