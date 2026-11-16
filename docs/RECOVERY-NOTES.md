# v2 continuation

Preserves the existing browser design and separate Python edition.

Changes: rest precedes exercise; cold begins at 3:30 remaining; storm occurs earlier so hazards do not overlap; after cold passes, exploration can continue. Live games save their position, objectives, timers and battery once per second. Pause and hidden tabs stop simulation. Saved games resume from Mission Control. Outpost shielding reduces habitat oxygen/health and power losses after the surface expedition. Tunnel radioisotope power drains more slowly. An early tunnel exit can produce the incomplete ending; timeout is a failed return. Sample and camera counters are separate.

Assumption: hibernation must begin after reaching shelter because a hibernating rover cannot drive. Hazard timing is a fictional training scenario. NASA archive pictures remain reference images, not pictures taken by the fictional robot.

Run START-GAME.bat on Windows with Python installed, or run `py -m http.server 8000` from the folder containing index.html. Open http://localhost:8000.

## Navigation update
Visible sticky Back and Main Menu buttons appear above every non-title screen, including the live games. Back returns a mission to Mission Control; from reference pages it returns to the screen that opened them. Escape closes an open dialog first, otherwise acts as Back. Main Menu saves the current screen; Continue Mission resumes it. Live-game snapshots are retained, and card challenges resume at their saved stage.
