# Architecture

The browser edition uses ES modules and a single saved state in localStorage (`jam-trainer-save-v1`). Screen rendering is in main.js; each level exports view and answer functions. games.js separates movement/physics models from canvas and input wiring. Live snapshots preserve coordinates, objectives, timers and resources. Navigation stops active loops before changing screens.

Audio is generated with Web Audio and uses one master mute gain. Countdown cues are deduplicated per displayed second. CSS shooting-star animation events trigger swooshes.

NASA calls have timeouts and archive fallbacks. The optional Vercel function keeps a personal NASA key server-side; the static site uses the public demo key. Neither setup requires a player account or a database.

The desktop Pygame edition is independent; it does not share code or saves with the browser game.
