"""Mission Laika: Across the Red Horizon — playable Python/Pygame edition."""
from __future__ import annotations

import math
import random
import struct
import sys
import json
from array import array
from pathlib import Path

import pygame

WIDTH, HEIGHT = 1100, 720
FPS = 60
TITLE = "MISSION LAIKA: ACROSS THE RED HORIZON"
SAVE_PATH = Path(__file__).resolve().with_name("savegame.json")

# A brighter mission-control palette: deep blue, teal, warm coral, and gold.
BG = (8, 14, 32)
PANEL = (17, 28, 54)
PANEL2 = (25, 42, 72)
WHITE = (242, 247, 255)
MUTED = (174, 194, 220)
TEAL = (72, 220, 202)
GOLD = (255, 205, 92)
CORAL = (255, 130, 112)
GREEN = (122, 226, 153)
RED = (255, 104, 119)
PURPLE = (184, 151, 255)

pygame.init()
try:
    pygame.mixer.init(frequency=22050, size=-16, channels=1, buffer=512)
except pygame.error:
    pass
screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
pygame.display.set_caption(TITLE)
clock = pygame.time.Clock()
FONT = pygame.font.SysFont("arial", 22)
SMALL = pygame.font.SysFont("arial", 17)
BODY = pygame.font.SysFont("arial", 25)
HEAD = pygame.font.SysFont("arial", 38, bold=True)
BIG = pygame.font.SysFont("arial", 54, bold=True)


def make_tone(freq: float, seconds: float, volume: float = 0.13) -> pygame.mixer.Sound | None:
    """Create a soft sound effect in memory; no audio files are needed."""
    if not pygame.mixer.get_init():
        return None
    rate = pygame.mixer.get_init()[0]
    samples = array("h")
    total = int(rate * seconds)
    for i in range(total):
        fade = min(1.0, i / max(1, int(rate * .025)), (total - i) / max(1, int(rate * .09)))
        sample = int(32767 * volume * fade * math.sin(2 * math.pi * freq * i / rate))
        samples.append(sample)
    if sys.byteorder == "big":
        samples.byteswap()
    return pygame.mixer.Sound(buffer=samples.tobytes())


SOUNDS = {"tap": make_tone(620, .07), "good": make_tone(880, .18),
          "warning": make_tone(235, .25), "launch": make_tone(440, .42, .10),
          "pickup": make_tone(1045, .12), "confirm": make_tone(660, .11),
          "alert": make_tone(300, .15, .16)}
SOUND_OFF = False


def make_ambient() -> pygame.mixer.Sound | None:
    """A quiet, seamless two-note electronic hum, synthesized in memory."""
    if not pygame.mixer.get_init():
        return None
    rate = pygame.mixer.get_init()[0]
    samples = array("h")
    for i in range(rate * 2):
        t = i / rate
        value = 0.022 * math.sin(2 * math.pi * 55 * t) + 0.012 * math.sin(2 * math.pi * 82.5 * t)
        samples.append(int(32767 * value))
    if sys.byteorder == "big":
        samples.byteswap()
    return pygame.mixer.Sound(buffer=samples.tobytes())


AMBIENT = make_ambient()
if AMBIENT and not SOUND_OFF:
    AMBIENT.play(loops=-1)


def sound(name: str) -> None:
    s = SOUNDS.get(name)
    if s and not SOUND_OFF:
        s.play()


STATE = {
    "screen": "title", "history": [], "name": "Cadet", "buddy": "Fox", "mode": "BASIC",
    "xp": 0, "energy": 100, "health": 100, "shield": 0, "power": "Solar",
    "warnings": 0, "photos": 0, "samples": 0, "completed": set(), "level": 1, "phase": 0,
    "mission_done": False, "storm_safe": False, "message": "", "message_color": TEAL,
    "name_edit": False, "sound_on": True, "phase_answered": False, "phase_started": 0,
}
STARS = [(random.randrange(0, WIDTH), random.randrange(0, HEIGHT), random.choice((1, 1, 2))) for _ in range(115)]


def go(where: str) -> None:
    if STATE["screen"] != "title":
        save_game(show_message=False)
    STATE["history"].append(STATE["screen"])
    STATE["screen"] = where
    sound("tap")


def back() -> None:
    if STATE["history"]:
        STATE["screen"] = STATE["history"].pop()
        sound("tap")
    elif STATE["screen"] != "title":
        STATE["screen"] = "title"
    save_game(show_message=False)


def save_game(show_message: bool = True) -> None:
    """Persist mission state locally; the completion set is stored as a JSON list."""
    try:
        data = dict(STATE)
        data["completed"] = sorted(STATE.get("completed", set()))
        data["history"] = list(STATE.get("history", []))
        data["name_edit"] = False
        SAVE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        if show_message:
            message("Mission saved on this computer.", GREEN)
            sound("confirm")
    except OSError:
        if show_message:
            message("Could not save. Check that this folder is writable.", CORAL)
            sound("warning")


def load_saved_game() -> None:
    """Restore a saved game from this computer and resume its last screen."""
    global SOUND_OFF
    try:
        data = json.loads(SAVE_PATH.read_text(encoding="utf-8"))
        STATE.update(data)
        STATE["completed"] = set(data.get("completed", []))
        STATE["history"] = list(data.get("history", []))
        STATE["phase_started"] = pygame.time.get_ticks()
        STATE["name_edit"] = False
        STATE["message"] = "Saved mission loaded. Continue where you left off."
        STATE["message_color"] = GREEN
        SOUND_OFF = not STATE.get("sound_on", True)
        if AMBIENT:
            AMBIENT.stop()
            if not SOUND_OFF:
                AMBIENT.play(loops=-1)
        sound("confirm")
    except (OSError, ValueError, json.JSONDecodeError):
        STATE["message"] = "The saved mission could not be loaded."
        STATE["message_color"] = CORAL


def resume_saved_game() -> None:
    load_saved_game()


def reset_game() -> None:
    for k, v in {"xp": 0, "energy": 100, "health": 100, "shield": 0, "power": "Solar",
                 "warnings": 0, "photos": 0, "samples": 0, "completed": set(),
                 "mission_done": False, "storm_safe": False}.items():
        STATE[k] = v
    STATE["level"], STATE["phase"] = 1, 0


def wrap_lines(text: str, font: pygame.font.Font, width: int) -> list[str]:
    lines, line = [], ""
    for word in text.split():
        test = f"{line} {word}".strip()
        if font.size(test)[0] > width and line:
            lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    return lines


def draw_text(text: str, x: int, y: int, font: pygame.font.Font = FONT,
              color=WHITE, width: int = 940, center: bool = False, line_gap: int = 7) -> int:
    for line in wrap_lines(text, font, width):
        image = font.render(line, True, color)
        rect = image.get_rect()
        rect.center = (x, y) if center else (x, y + rect.height // 2)
        if not center:
            rect.topleft = (x, y)
        screen.blit(image, rect)
        y += rect.height + line_gap
    return y


def draw_background() -> None:
    screen.fill(BG)
    # Faint teal horizon glow and a slow, twinkling starfield.
    glow = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    pygame.draw.ellipse(glow, (30, 135, 145, 22), (-150, 400, WIDTH + 300, 420))
    screen.blit(glow, (0, 0))
    tick = pygame.time.get_ticks()
    for i, (x, y, r) in enumerate(STARS):
        alpha = 120 + int(100 * (0.5 + 0.5 * math.sin(tick / 650 + i)))
        pygame.draw.circle(screen, (min(255, 155 + alpha // 3), min(255, 175 + alpha // 3), 220), (x, y), r)
    # Decorative orbit rings.
    pygame.draw.ellipse(screen, (22, 42, 71), (WIDTH - 270, -100, 410, 250), 2)
    pygame.draw.ellipse(screen, (24, 50, 78), (WIDTH - 245, -70, 350, 205), 1)


def panel(rect: pygame.Rect, color=PANEL, border=TEAL, radius=18) -> None:
    pygame.draw.rect(screen, color, rect, border_radius=radius)
    pygame.draw.rect(screen, border, rect, 2, border_radius=radius)


BUTTONS: list[tuple[pygame.Rect, str, object]] = []
# Buttons that Enter/Space may press (never BACK, SAVE, SOUND, or an answer choice).
PRIMARY_LABELS = {"START MISSION", "CONTINUE", "NEXT", "OPEN MISSION CONTROL", "NEXT CHALLENGE",
                  "RETURN TO MISSION CONTROL", "PLAY AGAIN"}


def button(label: str, x: int, y: int, w: int, h: int, action, color=PANEL2,
           border=TEAL, text_color=WHITE) -> pygame.Rect:
    rect = pygame.Rect(x, y, w, h)
    BUTTONS.append((rect, label, action))
    hovered = rect.collidepoint(pygame.mouse.get_pos())
    fill = tuple(min(255, c + (15 if hovered else 0)) for c in color)
    pygame.draw.rect(screen, fill, rect, border_radius=13)
    pygame.draw.rect(screen, GOLD if hovered else border, rect, 2, border_radius=13)
    label_img = FONT.render(label, True, text_color)
    screen.blit(label_img, label_img.get_rect(center=rect.center))
    return rect


def header(title: str, subtitle: str = "") -> None:
    draw_text(title, 55, 34, HEAD, WHITE, 970)
    if subtitle:
        draw_text(subtitle, 58, 82, SMALL, MUTED, 970)
    # Persistent back control appears on every non-title screen.
    if STATE["screen"] != "title":
        button("← BACK", 900, 34, 145, 45, back, border=PURPLE)


def footer() -> None:
    y = HEIGHT - 43
    draw_text(f"{STATE['name']}  •  ENERGY {STATE['energy']}%  •  HEALTH {STATE['health']}%  •  XP {STATE['xp']}",
              38, y, SMALL, MUTED, 830)
    if STATE.get("message"):
        draw_text(STATE["message"], 38, HEIGHT - 76, SMALL, STATE.get("message_color", TEAL), 650)
    button("💾 SAVE GAME", WIDTH - 350, HEIGHT - 51, 150, 38, save_game, border=GREEN)
    label = "SOUND: ON" if not SOUND_OFF else "SOUND: OFF"
    button(label, WIDTH - 185, HEIGHT - 51, 150, 38, toggle_sound, border=GOLD)


def toggle_sound() -> None:
    global SOUND_OFF
    SOUND_OFF = not SOUND_OFF
    STATE["sound_on"] = not SOUND_OFF
    if AMBIENT:
        if SOUND_OFF:
            AMBIENT.stop()
        else:
            AMBIENT.play(loops=-1)
    if not SOUND_OFF:
        sound("good")


def message(text: str, color=TEAL) -> None:
    STATE["message"] = text
    STATE["message_color"] = color


def on_mission_complete(level: int, points: int = 25) -> None:
    STATE["completed"].add(level)
    STATE["xp"] += points
    STATE["screen"] = "level_complete"
    save_game(show_message=False)
    sound("good")


def start_level(level: int) -> None:
    STATE["history"].append("map")
    STATE["level"], STATE["phase"] = level, 0
    STATE["phase_started"] = pygame.time.get_ticks()
    STATE["phase_answered"] = False
    STATE["screen"] = "level"
    save_game(show_message=False)
    sound("launch")


def advance_phase() -> None:
    STATE["phase"] += 1
    STATE["message"] = ""
    STATE["phase_answered"] = False
    STATE["phase_started"] = pygame.time.get_ticks()
    save_game(show_message=False)


def answer(ok: bool, text: str, energy: int = 0, health: int = 0, xp: int = 0) -> None:
    STATE["energy"] = max(0, min(100, STATE["energy"] + energy))
    STATE["health"] = max(0, min(100, STATE["health"] + health))
    STATE["xp"] += xp
    if ok:
        message(text, GREEN)
        sound("good")
    else:
        STATE["warnings"] += 1
        message(text, CORAL)
        sound("warning")
    save_game(show_message=False)


def draw_title() -> None:
    draw_text("MISSION LAIKA:", WIDTH // 2, 126, BIG, WHITE, 900, center=True)
    draw_text("ACROSS THE RED HORIZON", WIDTH // 2, 192, HEAD, TEAL, 900, center=True)
    draw_text("A friendly Mars mission about smart choices, science, and keeping Laika safe.",
              WIDTH // 2, 270, BODY, MUTED, 790, center=True)
    # Friendly robot pup and planet artwork drawn in Pygame.
    pygame.draw.circle(screen, (234, 111, 94), (WIDTH // 2 + 260, 390), 67)
    pygame.draw.circle(screen, (250, 164, 119), (WIDTH // 2 + 238, 370), 13)
    pygame.draw.circle(screen, (250, 164, 119), (WIDTH // 2 + 282, 412), 18)
    pygame.draw.ellipse(screen, (229, 236, 248), (WIDTH // 2 - 92, 354, 150, 100))
    pygame.draw.circle(screen, (229, 236, 248), (WIDTH // 2 - 8, 362), 45)
    pygame.draw.ellipse(screen, (255, 174, 133), (WIDTH // 2 - 48, 324, 35, 45))
    pygame.draw.ellipse(screen, (255, 174, 133), (WIDTH // 2 + 11, 326, 35, 43))
    pygame.draw.circle(screen, (29, 48, 75), (WIDTH // 2 + 5, 356), 5)
    pygame.draw.circle(screen, (29, 48, 75), (WIDTH // 2 + 28, 356), 5)
    button("START MISSION", WIDTH // 2 - 155, 490, 310, 58, lambda: go("intro"), border=GOLD)
    lower_y = 616 if SAVE_PATH.exists() else 575
    if SAVE_PATH.exists():
        button("▶ RESUME SAVED MISSION", WIDTH // 2 - 190, 555, 380, 48, resume_saved_game, border=GREEN)
    button("HOW TO PLAY", WIDTH // 2 - 155, lower_y, 150, 42, lambda: go("howto"), border=PURPLE)
    button("DATA & SOURCES", WIDTH // 2 + 5, lower_y, 150, 42, lambda: go("sources"), border=PURPLE)


def draw_intro() -> None:
    header("MISSION BRIEFING", "Meet the team before leaving Earth.")
    panel(pygame.Rect(65, 145, 970, 340), border=PURPLE)
    draw_text("Your base is a Martian outpost. You will help the team study radiation, dust storms, the environment, and possible signs of life. Laika is a robotic dog who explores outside.",
              100, 180, BODY, WHITE, 890)
    draw_text("Your choices affect power, health, safety, and the science you bring home. There is no perfect choice: good missions balance risks and rewards.",
              100, 280, BODY, MUTED, 890)
    draw_text("A real dog named Laika became the first animal to orbit Earth in 1957. Our Laika is a robot, named in her memory.",
              100, 380, FONT, GOLD, 890)
    button("CONTINUE", 750, 530, 250, 58, lambda: go("creator"), border=GOLD)


def draw_creator() -> None:
    header("CREATE YOUR ASTRONAUT", "Choose a call sign and a Space Buddy.")
    panel(pygame.Rect(70, 140, 960, 390), border=PURPLE)
    draw_text("CALL SIGN (type letters after clicking the name box)", 115, 174, FONT, MUTED)
    rect = pygame.Rect(115, 212, 380, 58)
    panel(rect, PANEL2, GOLD)
    draw_text(STATE["name"] + ("|" if STATE["name_edit"] else ""), 135, 228, BODY, WHITE)
    BUTTONS.append((rect, "NAME", lambda: STATE.update(name_edit=True)))
    draw_text("PICK YOUR SPACE BUDDY", 115, 305, FONT, MUTED)
    for i, buddy in enumerate(("Panda", "Bunny", "Fox", "Bear", "Cat", "Dog")):
        col, row = i % 3, i // 3
        selected = STATE["buddy"] == buddy
        button(("★ " if selected else "") + buddy, 115 + col * 245, 345 + row * 73, 210, 54,
               lambda b=buddy: STATE.update(buddy=b), border=GOLD if selected else TEAL)
    draw_text("TECHNICAL  ★★★   ENDURANCE  ★★★   TEAMWORK  ★★★", 115, 505, SMALL, GOLD)
    button("NEXT", 790, 560, 220, 58, lambda: go("mode"), border=GOLD)


def draw_mode() -> None:
    header("CHOOSE YOUR MISSION MODE", "You can change this when you start again.")
    options = [("BASIC", "No timers. Helpful hints. Smaller setbacks."),
               ("ADVANCED", "60-second choices. Bigger consequences. Hints are off.")]
    for i, (mode, desc) in enumerate(options):
        rect = pygame.Rect(100 + i * 470, 200, 420, 230)
        panel(rect, PANEL, GOLD if STATE["mode"] == mode else TEAL)
        draw_text(mode, rect.centerx, rect.y + 55, HEAD, GOLD if mode == "BASIC" else CORAL, 380, center=True)
        draw_text(desc, rect.centerx, rect.y + 120, FONT, WHITE, 340, center=True)
        button("CHOOSE " + mode, rect.x + 80, rect.y + 165, 260, 50,
               lambda m=mode: STATE.update(mode=m), border=GOLD if STATE["mode"] == mode else TEAL)
    button("OPEN MISSION CONTROL", 350, 520, 400, 60, lambda: go("map"), border=GOLD)


LEVEL_NAMES = {1: "Life on the Outpost", 2: "Prepare for Mars", 3: "Explore the Surface", 4: "Return Through the Night"}


def draw_map() -> None:
    header("MISSION CONTROL", "Choose an unlocked mission. Complete them in order.")
    for i in range(1, 5):
        x = 54 + (i - 1) * 257
        unlocked = i == 1 or i - 1 in STATE["completed"]
        done = i in STATE["completed"]
        color = GREEN if done else TEAL if unlocked else (85, 99, 122)
        panel(pygame.Rect(x, 225, 230, 220), PANEL, color)
        draw_text(f"LEVEL {i}", x + 115, 265, HEAD, color, 210, center=True)
        draw_text(LEVEL_NAMES[i], x + 115, 330, FONT, WHITE, 185, center=True)
        button("REPLAY" if done else "START" if unlocked else "LOCKED", x + 20, 390, 190, 45,
               lambda n=i: start_level(n) if (n == 1 or n - 1 in STATE["completed"]) else None,
               border=color)
    button("GLOSSARY", 300, 505, 205, 52, lambda: go("glossary"), border=PURPLE)
    button("DATA & SOURCES", 595, 505, 205, 52, lambda: go("sources"), border=PURPLE)


def build_levels() -> dict:
    """Build level content on demand so costs follow the current power choice."""
    return {
        1: [
            ("FOOD SAFETY", "Choose supplies for a microgravity mission. Crumbs can float into equipment, and fizzy drinks behave differently without normal gravity.",
             [("Sealed drink + treated chicken", True, "Good choice. Irradiation is one method used to make some foods safer. Crumb-free meals protect equipment.", 0, 0, 15),
              ("Soda + loose cookies", False, "Crumbs and bubbles can float around the cabin. Try sealed, low-crumb food.", -8, -5, 0)]),
            ("EXERCISE SAFELY", "Astronauts exercise to help protect muscles and bones. In microgravity, Laika needs a harness to stay on the treadmill.",
             [("Attach the safety harness", True, "Harness secured. Exercise can help reduce muscle and bone loss.", -4, 0, 15),
              ("Start the treadmill without it", False, "Laika could drift away from the belt. Secure the harness first.", -8, -7, 0)]),
            ("REST AND AIRFLOW", "In microgravity, carbon dioxide does not simply rise away. Choose a secured resting station near moving air.",
             [("Rest near the ventilation grille", True, "Good airflow helps carry exhaled CO₂ away. The fan uses a little power.", -3, 0, 15),
              ("Sleep in the exercise area", False, "Warmth, vibration, and weak airflow make this a poor rest spot.", -5, -8, 0)]),
        ],
        2: [
            ("POWER CHOICE", "Solar panels are lighter but can lose output when dusty or dark. Radioisotope power works through night and dust, but adds mass and complexity.",
             [("Solar panels", True, "Solar selected. Save power during the storm and long night.", 0, 0, 15),
              ("Radioisotope power", True, "Steady power selected. The generator is heavier and needs careful handling.", -6, 0, 15)]),
            ("COMMUNICATION DELAY", "Radio messages between Earth and Mars can take several minutes one way. What should the team do if Laika does not answer right away?",
             [("Wait for the reply", True, "Correct. Wait for the signal; repeated commands could arrive together.", -1, 0, 15),
              ("Send the same command over and over", False, "The repeated commands can pile up. Wait for the signal to travel.", -5, -4, 0)]),
            ("SHIELDING TRADE-OFF", "Mars has a thin atmosphere and no global magnetic field like Earth’s. Spend limited shielding material where it helps the mission most.",
             [("Protect Laika and the habitat", True, "Balanced shielding chosen. More shielding helps, but adds mass.", -5, 0, 20),
              ("Use all material on the rover", False, "Laika is protected, but the habitat has less cover for the team.", -2, -3, 8),
              ("Skip shielding to save mass", False, "Less mass helps movement, but leaves less protection available.", 2, -12, 0)]),
        ],
        3: [
            ("SCIENCE PHOTOS", "Guide Laika to collect science images. Each site adds data; an optional extra site uses time and energy.",
             [("Collect 3 essential photos", True, "Three useful science records collected.", -12, 0, 25),
              ("Collect 3 photos plus a bonus", True, "Bonus image collected. More data costs more energy.", -20, 0, 35)]),
            ("DUST STORM!", "A dust storm is moving in. Laika can shelter now or risk staying out longer for one more observation.",
             [("Head for the rocks", True, "Laika is sheltered. You give up a chance for extra data, but reduce storm risk.", -8 if STATE["power"] == "Solar" else -4, 0, 10),
              ("Stay out for one more photo", False, "The extra data came at a cost. The storm lowered Laika’s energy and health.", -19 if STATE["power"] == "Solar" else -11, -18, 20)]),
        ],
        4: [
            ("SAMPLES OR BATTERY?", "Night is approaching and temperatures can become extremely cold. Samples add science value but use time and battery.",
             [("Collect one sample, then return", True, "A sample is secured. Returning early protects battery for the trip home.", -12 if STATE["power"] == "Solar" else -7, 0, 15),
              ("Collect every sample", False, "More samples, less battery. The return trip is now harder.", -26 if STATE["power"] == "Solar" else -17, -5, 30)]),
            ("HIBERNATION MODE", "Hibernation slows some activity to conserve energy during the cold night. It also pauses science work.",
             [("Hibernate now and return to shelter", True, "Laika conserves energy and reaches shelter.", 10, 0, 20),
              ("Keep collecting data", False, "More science data, but the battery drops before shelter.", -17, -16, 25)]),
        ],
    }


def level_dialogue(level: int, phase: int) -> tuple[str, str]:
    title, desc, choices = build_levels()[level][phase]
    return title, desc


def draw_level() -> None:
    level, phase = STATE["level"], STATE["phase"]
    title, desc = level_dialogue(level, phase)
    header(f"LEVEL {level}: {LEVEL_NAMES[level].upper()}", f"Challenge {phase + 1} of {len(build_levels()[level])}  •  Mode: {STATE['mode']}")
    if STATE["mode"] == "ADVANCED" and not STATE["phase_answered"]:
        remaining = max(0, 60 - (pygame.time.get_ticks() - STATE["phase_started"]) // 1000)
        draw_text(f"DECISION TIMER  {remaining:02d}s", 770, 102, SMALL, CORAL if remaining < 15 else GOLD, 250)
        if remaining == 0:
            answer(False, "Time ran out. Laika had to wait while the team lost a little energy.", -8, -5, 0)
            STATE["phase_answered"] = True
    panel(pygame.Rect(70, 145, 960, 215), border=PURPLE)
    draw_text(title, 105, 173, HEAD, GOLD)
    draw_text(desc, 105, 232, BODY, WHITE, 880)
    # Laika's little companion badge.
    pygame.draw.circle(screen, (242, 244, 247), (120, 420), 43)
    pygame.draw.ellipse(screen, (255, 171, 138), (83, 379, 25, 39))
    pygame.draw.ellipse(screen, (255, 171, 138), (133, 379, 25, 39))
    pygame.draw.circle(screen, (18, 32, 54), (111, 416), 4)
    pygame.draw.circle(screen, (18, 32, 54), (130, 416), 4)
    draw_text("LAIKA", 120, 475, SMALL, TEAL, center=True)
    choices = build_levels()[level][phase][2]
    btn_h, gap = 58, 14
    y = 390
    for i, (label, ok, reply, energy, health, xp) in enumerate(choices):
        button(label, 205, y + i * (btn_h + gap), 690, btn_h,
               lambda args=(ok, reply, energy, health, xp): select_choice(args), border=TEAL)
    if STATE["message"]:
        panel(pygame.Rect(210, 610, 680, 54), PANEL, STATE["message_color"], radius=12)
        draw_text(STATE["message"], 235, 623, SMALL, STATE["message_color"], 630)
        if STATE["message_color"] == GREEN:
            button("NEXT CHALLENGE", 875, 610, 165, 54, finish_phase, border=GOLD)
        else:
            button("CONTINUE", 875, 610, 165, 54, finish_phase, border=GOLD)


def select_choice(args) -> None:
    if STATE["screen"] != "level" or STATE["phase_answered"]:
        return
    ok, reply, energy, health, xp = args
    answer(ok, reply, energy, health, xp)
    sound("pickup" if ok else "alert")
    STATE["phase_answered"] = True
    # Track useful outcomes and ending conditions.
    if STATE["level"] == 2 and STATE["phase"] == 0:
        chosen = "Solar" if "Solar" in reply else "Radioisotope"
        STATE["power"] = chosen
    if STATE["level"] == 2 and STATE["phase"] == 2 and ok:
        STATE["shield"] = 2
    if STATE["level"] == 3 and STATE["phase"] == 0:
        STATE["photos"] += 3 if "3 photos plus" in reply else 2
        STATE["mission_done"] = STATE["photos"] >= 2
    if STATE["level"] == 3 and STATE["phase"] == 1:
        STATE["storm_safe"] = ok
    if STATE["level"] == 4 and STATE["phase"] == 0:
        STATE["samples"] += 1 if "one sample" in reply else 3


def finish_phase() -> None:
    if STATE["level"] == 1 and STATE["phase"] < 2:
        advance_phase()
    elif STATE["level"] == 2 and STATE["phase"] < 2:
        advance_phase()
    elif STATE["level"] == 3 and STATE["phase"] < 1:
        advance_phase()
    elif STATE["level"] == 4 and STATE["phase"] < 1:
        advance_phase()
    else:
        on_mission_complete(STATE["level"])


def draw_level_complete() -> None:
    level = STATE["level"]
    header("MISSION CHECKPOINT", "The team reviews the science and gets ready for the next challenge.")
    panel(pygame.Rect(125, 155, 850, 385), border=GOLD)
    draw_text("★  GREAT JOB, " + STATE["name"].upper() + "!  ★", WIDTH // 2, 206, HEAD, GOLD, 760, center=True)
    facts = {
        1: "Real astronauts use exercise equipment and plan airflow and food carefully. Microgravity changes how crumbs and air move.",
        2: "Mars missions balance power, mass, radiation protection, and communication delay. No single choice removes every risk.",
        3: "Rovers use cameras and instruments to study Mars. Storm shelter protects hardware but can limit science time.",
        4: "Rover teams plan for cold and limited energy. Hibernation can save power, while stopping science work for a while.",
    }
    draw_text(f"LEVEL {level} COMPLETE  •  +25 XP", WIDTH // 2, 285, BODY, TEAL, 700, center=True)
    draw_text("WHAT REAL MISSIONS DO", 215, 355, FONT, GOLD)
    draw_text(facts[level], 215, 395, FONT, WHITE, 680)
    if level < 4:
        button("RETURN TO MISSION CONTROL", 315, 570, 470, 58, lambda: go("map"), border=GOLD)
    else:
        STATE["screen"] = "ending"
        draw_ending()


def draw_ending() -> None:
    safe = STATE["health"] > 0 and STATE["energy"] > 0 and STATE["storm_safe"]
    title = "MISSION COMPLETE!" if safe and STATE["mission_done"] else "LAIKA MADE IT HOME!" if safe else "MISSION DEBRIEF"
    header(title, "Every result teaches the team how to plan a stronger next mission.")
    panel(pygame.Rect(90, 150, 920, 445), border=GOLD if safe else CORAL)
    draw_text(("LAIKA IS SAFE. The science team has new data." if safe else "The team reviews what happened and plans a safer return."),
              WIDTH // 2, 200, BODY, GREEN if safe else CORAL, 810, center=True)
    grade = "A" if safe and STATE["mission_done"] and STATE["warnings"] < 2 else "B" if safe else "C"
    draw_text(f"GRADE {grade}     •     {STATE['xp']} XP     •     {STATE['photos']} photos     •     {STATE['samples']} samples",
              WIDTH // 2, 270, FONT, GOLD, 820, center=True)
    draw_text(f"Energy {STATE['energy']}%   |   Health {STATE['health']}%   |   Power: {STATE['power']}   |   Buddy: {STATE['buddy']}",
              WIDTH // 2, 325, FONT, TEAL, 820, center=True)
    draw_text("YOU LEARNED", 205, 385, FONT, GOLD)
    draw_text("• Power, safety, and science goals compete.  • Mars messages take time.  • Shelter and airflow matter.",
              205, 425, SMALL, WHITE, 720)
    button("PLAY AGAIN", 255, 520, 240, 55, replay, border=GOLD)
    button("DATA & SOURCES", 605, 520, 240, 55, lambda: go("sources"), border=PURPLE)


def replay() -> None:
    reset_game()
    STATE["history"] = []
    STATE["screen"] = "intro"


def draw_howto() -> None:
    header("HOW TO PLAY", "Use your mouse or touchscreen. Press Escape to go back.")
    panel(pygame.Rect(80, 150, 940, 430), border=PURPLE)
    tips = ["1. Pick choices to guide Laika and the Mars outpost.",
            "2. Energy and health carry from one level to the next.",
            "3. Choices have trade-offs: read Laika’s feedback before continuing.",
            "4. Use the ← BACK button or Escape to return to the previous screen.",
            "5. Basic mode has no countdown; Advanced is a challenge setting in this edition.",
            "6. This game uses simplified teaching models, not real mission forecasts."]
    y = 205
    for tip in tips:
        y = draw_text(tip, 125, y, BODY, WHITE, 840) + 18
    button("BACK TO TITLE", 400, 600, 300, 54, back, border=GOLD)


def draw_sources() -> None:
    header("DATA & SOURCES", "Facts are educational references. Values in the game are simplified, not live mission data.")
    panel(pygame.Rect(70, 145, 960, 480), border=PURPLE)
    entries = [
        ("NASA Space Place — Mars facts", "https://spaceplace.nasa.gov/all-about-mars/en/"),
        ("NASA — Mars Exploration: Communication", "https://mars.nasa.gov/mars2020/spacecraft/rover/communications/"),
        ("NASA — Curiosity Radiation Assessment Detector", "https://science.nasa.gov/mission/msl-curiosity/"),
        ("NASA — Food in Space", "https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-food-like-in-space-grades-5-8/"),
        ("NASA — Human Research Program: spaceflight hazards", "https://www.nasa.gov/hrp/"),
        ("NASA/JPL-Caltech — Mars rover imagery archive", "https://images.nasa.gov/"),
    ]
    y = 175
    for title, url in entries:
        draw_text(title, 105, y, FONT, GOLD)
        draw_text(url, 105, y + 30, SMALL, TEAL, 850)
        y += 65
    draw_text("The game does not currently request live DONKI data. The risk and resource numbers are game rules, not NASA telemetry.",
              105, y + 3, SMALL, MUTED, 850)


def draw_glossary() -> None:
    header("QUICK GLOSSARY", "Tap a word to learn what it means during the mission.")
    glossary = [("Microgravity", "A very weak feeling of weight, like astronauts experience while orbiting."),
                ("Radiation", "Energy that travels through space. Some kinds can harm living things."),
                ("Carbon dioxide (CO₂)", "A gas we breathe out. Airflow helps move it away in a spacecraft."),
                ("Communication delay", "The time a radio message takes to travel between Earth and Mars."),
                ("Hibernation mode", "A low-power state that pauses some rover activity to save energy.")]
    y = 165
    for term, desc in glossary:
        panel(pygame.Rect(90, y, 920, 75), PANEL, TEAL, 12)
        draw_text(term, 115, y + 10, FONT, GOLD)
        draw_text(desc, 390, y + 15, SMALL, WHITE, 590)
        y += 87


def draw() -> None:
    global BUTTONS
    draw_background()
    BUTTONS = []
    name = STATE["screen"]
    if name == "title": draw_title()
    elif name == "intro": draw_intro()
    elif name == "creator": draw_creator()
    elif name == "mode": draw_mode()
    elif name == "map": draw_map()
    elif name == "level": draw_level()
    elif name == "level_complete": draw_level_complete()
    elif name == "ending": draw_ending()
    elif name == "howto": draw_howto()
    elif name == "sources": draw_sources()
    elif name == "glossary": draw_glossary()
    if name not in ("title", "ending", "level_complete"):
        footer()
    pygame.display.flip()


running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            save_game(show_message=False)
            running = False
        elif event.type == pygame.VIDEORESIZE:
            # Keep the designed layout proportions; allow users to resize the window.
            screen = pygame.display.set_mode((max(820, event.w), max(620, event.h)), pygame.RESIZABLE)
            WIDTH, HEIGHT = screen.get_size()
            STARS = [(random.randrange(0, WIDTH), random.randrange(0, HEIGHT), random.choice((1, 1, 2))) for _ in range(115)]
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_s and (event.mod & pygame.KMOD_CTRL):
                save_game()
            elif STATE["name_edit"] and event.key == pygame.K_RETURN:
                STATE["name_edit"] = False
            elif STATE["name_edit"] and event.key == pygame.K_BACKSPACE:
                STATE["name"] = STATE["name"][:-1]
            elif STATE["name_edit"] and event.unicode.isprintable() and len(STATE["name"]) < 18:
                STATE["name"] += event.unicode
            elif event.key == pygame.K_ESCAPE:
                back()
            elif event.key in (pygame.K_RETURN, pygame.K_SPACE):
                for _rect, _label, _action in BUTTONS:
                    if _label in PRIMARY_LABELS:
                        _action()
                        break
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for rect, label, action in reversed(BUTTONS):
                if rect.collidepoint(event.pos):
                    action()
                    break
    draw()
    clock.tick(FPS)

pygame.quit()
