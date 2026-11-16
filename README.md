# Mission Laika: Across the Red Horizon

A space-science adventure for ages 7–12. Run a Martian outpost and guide LAIKA, a robotic companion, through four missions about survival, power, shielding, communication and exploration.

**Primary submission:** the browser game at the repository root. It needs no login, build step or JavaScript dependencies. The separate `python_app/` contains an earlier, shorter Pygame edition.

**Game code by [@suly43](https://github.com/suly43).**

**[Play Mission Laika in your browser](https://suly43-mission-laika.mightycouch64.chatgpt.site/)** · [Six-slide demo](docs/MISSION-LAIKA-DEMO.pdf) · [NASA Space Apps project details](docs/SUBMISSION.md)

## Quick start for judges

1. Open **Play Mission Laika** above. The browser edition needs no download, install, or login.
2. Choose **Start Mission**, enter an astronaut name, and keep **Basic** selected for an untimed first run.
3. Click **Create Astronaut**, wait for the launch, then choose **Begin level 1**. Click or tap a choice to see its feedback.

Use **Data & Sources** at the bottom of the game to review the NASA references. The [mission guide](#mission-guide) lists controls and objectives for each level.

## Play locally

On Windows, double-click **START-GAME.bat** with Python installed. Keep the terminal open and visit http://localhost:8000.

On macOS/Linux:

```sh
python3 -m http.server 8000
```

## Mission guide

| Level | Activities | Controls |
|---|---|---|
| 1 · Station survival | Food, crumb cleanup, rest, harness and exercise | Click or tap choices; alternate pedals |
| 2 · Mission preparation | Landing kit, power, shield allocation and delayed communication | Click/tap; wait for the 30-second signal |
| 3 · Mars exploration | Collect six image records; manage storms and cold; enter the marked top-right exit | WASD/arrows, E photo, L low power, H hibernate/wake |
| 4 · Lava tunnel | Collect the rock sample and image record, then reach the far-right EXIT | Arrows/A/D, Space jump, E interact, F flashlight |

Touch buttons support both exploration games. Overall victory requires six surface records, both tunnel objectives and a safe return. Returning with incomplete science produces a retry ending. New Mission clears progress; Continue Mission resumes the saved session on the same device.

Basic mode has no decision or exploration deadline. Advanced adds decision and mission countdowns. Battery remains limited in both modes. Settings include mute, reduced motion, larger text and high contrast. Correct answers have feedback, a star animation and sound.

## Submission documents

- [Project description and judge demo](docs/SUBMISSION.md)
- [Science and asset credits](CREDITS.md)
- [Testing and known limitations](docs/PLAYTEST-AUDIT.md)
- [Authorship and AI assistance](TEAM.md)
- [Original supplied game script](docs/GAME-SCRIPT.md)

## Repository layout

| Path | Purpose |
|---|---|
| `index.html`, `css/` | Browser interface and styles |
| `js/main.js`, `js/state.js` | Screens, navigation and saved state |
| `js/levels/` | Lesson choices and progression |
| `js/games.js` | Surface exploration and tunnel physics |
| `js/audio.js` | Synthesized sound and countdown cues |
| `js/data.js`, `api/space-weather.js` | NASA requests, fallbacks and optional Vercel proxy |
| `assets/mission-photos/` | Three supplied reference maps |
| `tests/` | Automated game-rule regression tests |
| `.github/workflows/` | CI checks and GitHub Pages deployment |
| `docs/` | Submission material, design and review notes |
| `python_app/` | Separate legacy desktop edition |

## Checks

Requires Node.js 20+ and Python 3.11+ for the compilation check. No npm install is required.

```sh
npm test
npm run check
python3 -m py_compile python_app/main.py
```

The suite includes a complete tunnel traversal with movement inputs, the six-photo exit regression, and countdown sound cue checks. [View GitHub Actions results](https://github.com/suly43/mission-laika-across-the-red-horizon/actions).

## Hosting

**GitHub Pages:** in repository Settings → Pages, select GitHub Actions. Run the included deployment workflow manually from the Actions tab after configuring Pages. It publishes only the browser files. The public site URL appears in the deployment output; it is not live until deployment succeeds.

**Vercel:** import this repository, choose Other, and leave the build command empty. The optional server function uses `NASA_API_KEY` from server environment variables. Never place a personal key in frontend files. Static hosting uses the public DEMO_KEY with labeled fallback data when requests fail.

## Challenge fit and science

Mission Laika answers [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) by letting students balance health, ventilation, power, radiation shielding, and the needs of a surface mission. Its food lesson covers safety and handling.

NASA DONKI records supply a simplified recent-activity signal; this is not a Mars weather forecast. NASA Images provides archive references. The three supplied terrain images are illustrative reference maps, not live observations taken by LAIKA. Their original provenance still needs confirmation by the team.

Battery, health, atmospheric and shielding numbers are teaching rules, not physical simulations. In particular, the combined storm/shielding damage rule is a gameplay simplification; a dust storm is not itself a solar radiation event. The Python edition does not match the browser feature set. See the audit for remaining animation, accessibility and device-testing gaps.

## License

Project code retains the included [MIT license](LICENSE). Third-party imagery, fonts and reference materials retain their respective rights; the code license does not grant rights to those assets. See CREDITS.md.
