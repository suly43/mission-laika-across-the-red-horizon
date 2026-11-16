# Mission Laika: Across the Red Horizon — Python Edition

A kid-friendly, keyboard and mouse playable Pygame version of the Mars outpost game.

## Run in VS Code on Windows

1. Install Python 3.10 or newer.
2. Open this `python_app` folder in VS Code.
3. Open **Terminal → New Terminal** and run:

   ```powershell
   py -m pip install -r requirements.txt
   py main.py
   ```

   If Windows does not recognize `py`, use `python -m pip install -r requirements.txt` and `python main.py`.

## Controls

- Click buttons with a mouse or touchscreen. Choices show feedback and change mission resources and progress.
- Press **Escape** or click **← BACK** to return to the previous screen.
- Click **SAVE GAME** at the bottom of a mission screen or press **Ctrl+S** to save. The game also saves after choices, when changing screens, and when you close it.
- Choose **RESUME SAVED MISSION** on the title screen to continue. The save stays on this computer in `savegame.json` inside `python_app`.
- On the astronaut setup screen, click the call-sign field and type a name; press Enter when done.
- Use **SOUND: ON/OFF** to toggle the synthesized sound effects and quiet ambient music.

## What is included

- Astronaut call sign and Space Buddy selection.
- Basic and Advanced modes. Advanced adds a 60-second timer to each choice.
- Four connected levels with persistent energy, health, power, shielding, and science progress.
- Choice feedback, checkpoint cards, a final debrief, glossary, and NASA source list.
- An original teal-and-coral mission-control look, animated stars, synthesized button/choice/alert sounds, and quiet ambient music. No sound or image files are required.

## Science note

This is an educational model. Resource costs and outcomes are simplified game rules, not mission predictions or real NASA telemetry. The game does not fetch live space-weather data. The Data & Sources screen credits NASA references for the concepts.

## Files

- `main.py` — complete game
- `requirements.txt` — Pygame Community Edition dependency
