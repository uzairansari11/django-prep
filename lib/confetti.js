import confetti from 'canvas-confetti';

/**
 * Trigger a confetti explosion
 * @param {Object} options - Confetti options
 */
export function celebrate(options = {}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ea580c', '#fb923c', '#fdba74', '#fed7aa'],
  };

  confetti({
    ...defaults,
    ...options,
  });
}

/**
 * Trigger fireworks effect
 */
export function fireworks() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 999999,
    colors: ['#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#22c55e', '#60a5fa'],
  };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Since particles fall down, start a bit higher than random
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * Trigger realistic confetti cannon
 */
export function confettiCannon() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#22c55e', '#60a5fa'],
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Trigger snow effect
 */
export function snow() {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 1,
      startVelocity: 0,
      ticks: 200,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2,
      },
      colors: ['#ffffff'],
      shapes: ['circle'],
      gravity: 0.4,
      scalar: 0.8,
      drift: 0.4,
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Trigger confetti explosion on element click
 * @param {Event} e - Click event
 */
export function celebrateAtCursor(e) {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x, y },
    colors: ['#ea580c', '#fb923c', '#fdba74', '#fed7aa'],
  });
}
