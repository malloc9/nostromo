# Nostromo Improvement Plan: Project MU-TH-UR 6000

This document outlines a comprehensive plan to elevate the Nostromo Monitoring System into a fully immersive, authentic replica of the MU-TH-UR 6000 interface from the 1979 film *Alien*.

## 1. Visual Overhaul (The "Retro-Future" Aesthetic)

The goal is to move away from "webpage that looks like a terminal" to "simulated CRT monitor from 1979".

### 1.1. Advanced CRT Emulation
*   **Curvature & Bezel:** Implement a CSS-based curved screen effect with a subtle vignette to mimic the physical curvature of old monitors. Add a CSS border that looks like the physical bezel of the terminal.
*   **Chromatic Aberration:** Add a slight RGB split (color bleeding) at the edges of the screen to simulate electron beam misalignment.
*   **Phosphor Persistence (Ghosting):** When text changes or screens switch, leave a faint "ghost" of the previous content that fades out slowly, mimicking the slow decay of green phosphor.
*   **Scanlines & Interlacing:** Refine the current scanline effect to be more prominent but less interfering with readability. Add a subtle "rolling bar" effect.
*   **Bloom/Glow:** Increase the text-shadow glow effect, specifically making it "bleed" more on brighter elements (like headers or active cursors).

### 1.2. Typography & Layout
*   **Font:** Ensure the font is a pixel-perfect bitmap font or a vector font designed to look like a specific 70s terminal (e.g., "Glass TTY VT220" or similar).
*   **Grid System:** The movie interface relies heavily on strict grid layouts. Data should be presented in blocky tables, not fluid divs.
*   **"Breathing" Interface:** Elements should not just sit there; they should have subtle idle animations (blinking cursors, shifting numbers) to make the system feel "alive" and processing.

### 1.3. Specific Screen Recreations
*   **Boot Sequence:** Recreate the exact boot sequence text from the movie (if visible) or a highly plausible "Weyland-Yutani" mainframe boot process (Memory checks, Tape drive initialization).
*   **"Mother" Interface:** A dedicated screen that is just a blinking cursor on a black background, waiting for text input.
*   **Emergency Destruct System:** A red-themed screen (rare in the movie, but iconic) for the self-destruct sequence, complete with the cooling unit instructions.

## 2. Functional Enhancements (Interaction & Depth)

Make the system feel like a real operating system, not just a display.

### 2.1. Interactive Console (CLI)
*   **Command Input:** Implement a working command line where the user can type specific commands.
*   **Natural Language Processing (Fake):** Allow users to type questions like "WHAT'S THE STORY MOTHER?" or "REPORT STATUS".
*   **Hidden Commands:**
    *   `INTERFACE 2037`: Opens the secret "Special Order 937" file.
    *   `OVERRIDE`: Attempts to override system locks (with "ACCESS DENIED" responses).
    *   `DESTRUCT`: Initiates the self-destruct simulation.

### 2.2. System Simulations
*   **Hyper-sleep Monitoring:** A screen showing the crew's vital signs with realistic, rhythmic graphs.
*   **Motion Tracker:** A radar-like screen that "pings" occasionally. If we want to be spooky, have a random "blip" appear and get closer.
*   **Planet Landing:** A wireframe terrain map simulation of LV-426.

### 2.3. "Game" Elements
*   **Login Persistence:** Save the user's "session" so if they reload, they don't have to boot again (unless they choose to).
*   **Unlockable Data:** Start with limited access. As the user explores (or types correct commands), they unlock "Classified" sections.

## 3. Audio Immersion (The Sound of Space)

The sound design is 50% of the atmosphere.

### 3.1. Ambient Soundscape
*   **Ship Hum:** A layered, low-frequency drone that is always present. It should change slightly based on the screen (e.g., louder "engine" hum in Engineering).
*   **Hard Drive/Tape Sounds:** Random "chattering" or "whirring" sounds to simulate data being read from magnetic tapes.

### 3.2. Interface Sounds
*   **Typing:** The movie features very loud, mechanical solenoid keyboard sounds. Each keypress should trigger a distinct "clack".
*   **Data Stream:** High-pitched, rapid-fire beeps when text is being auto-typed on the screen (the "telemetry" sound).
*   **Alarms:** The specific "whoop-whoop" alarm for critical status (e.g., Self Destruct).

### 3.3. Voice Synthesis (Optional)
*   **TTS Integration:** Use the Web Speech API to have "Mother" read out specific responses, but process the audio to sound robotic and slightly lo-fi.

## 4. Implementation Roadmap

### Phase 1: Visual Polish (The "Look")
1.  **Update `terminal.css`:** Implement advanced CRT effects (curvature, ghosting).
2.  **Font Standardization:** Replace current fonts with a more authentic 1979 terminal font.
3.  **Layout Refactor:** Tighten up the CSS grids to match the movie's utilitarian aesthetic.

### Phase 2: Audio Engine (The "Feel")
1.  **Enhance `audio-manager.js`:** Add the "chattering" tape sounds and specific alarm samples.
2.  **Typing Engine:** Sync the "data stream" sound exactly with the text appearing on screen.

### Phase 3: Interactive Core (The "Brain")
1.  **Build `console.js`:** A new module to handle text input and command parsing.
2.  **Implement "Mother" Logic:** Simple pattern matching for user queries.
3.  **Add "Special Order 937":** The ultimate Easter egg.

## 5. Technical Requirements
*   **Performance:** CRT effects can be heavy. Ensure `requestAnimationFrame` is used efficiently. Add a "Low Quality" toggle for slower devices.
*   **Assets:** Need high-quality audio samples (or synthesized equivalents) for the specific Alien SFX.
