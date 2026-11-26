// Alpine Courier — keyboard and mouse input. One object holds the live state;
// the game reads it every frame and never touches the DOM events itself.

export function makeInput() {
  return {
    pitchUp: false, // ArrowUp / W — nose up
    pitchDown: false, // ArrowDown / S — nose down
    throttleUp: false, // ArrowRight / D — more power
    throttleDown: false, // ArrowLeft / A — less power
    airbrake: false, // Space — bleed speed for a ring or a landing
    pause: false, // P — toggles, consumed by the game
    restart: false, // R — consumed by the game
    confirm: false, // Enter or click — start / continue
    mouseY: null, // steer by mouse: hold the button and the nose follows
    mouseDown: false,
  };
}

const KEYMAP = {
  ArrowUp: 'pitchUp',
  KeyW: 'pitchUp',
  ArrowDown: 'pitchDown',
  KeyS: 'pitchDown',
  ArrowRight: 'throttleUp',
  KeyD: 'throttleUp',
  ArrowLeft: 'throttleDown',
  KeyA: 'throttleDown',
  Space: 'airbrake',
  Enter: 'confirm',
};

export function bindInput(input, element) {
  const down = (event) => {
    const field = KEYMAP[event.code];
    if (!field) {
      if (event.code === 'KeyP') input.pause = true;
      if (event.code === 'KeyR') input.restart = true;
      return;
    }
    input[field] = true;
    // The game scrolls with the arrows; never let the page steal them.
    if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();
  };
  const up = (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', () => {
    for (const key of Object.keys(KEYMAP)) input[KEYMAP[key]] = false;
    input.mouseDown = false;
  });

  element.addEventListener('pointerdown', (event) => {
    input.mouseDown = true;
    input.mouseY = event.clientY;
    input.confirm = true;
  });
  element.addEventListener('pointermove', (event) => {
    if (input.mouseDown) input.mouseY = event.clientY;
  });
  element.addEventListener('pointerup', () => {
    input.mouseDown = false;
    input.mouseY = null;
  });
  element.addEventListener('pointercancel', () => {
    input.mouseDown = false;
    input.mouseY = null;
  });
}

// The game consumes one-shot flags each frame so a single press fires once.
export function consume(input, field) {
  const value = input[field];
  input[field] = false;
  return value;
}
