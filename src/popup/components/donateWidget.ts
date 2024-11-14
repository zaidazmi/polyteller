import confetti from 'canvas-confetti';

export function createDonateWidget(): HTMLElement {
  const widget = document.createElement('div');
  widget.className = 'donate-widget';
  widget.innerHTML = `
    <div class="donate-card">
      <div class="donate-content">
        <div class="donate-text">
          <h3>Support Polyteller</h3>
          <p>Help us keep building awesome features and keep this extension free!</p>
        </div>
        <button class="donate-button">
          <span class="donate-icon">❤️</span>
          <span>Donate</span>
        </button>
      </div>
    </div>
  `;

  // Create full-screen canvas for confetti
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(canvas);

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .donate-widget {
      margin-top: 16px;
      position: relative;
    }

    .donate-card {
      background-color: var(--card-background);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
      transition: transform 0.3s ease;
    }

    .donate-card:hover {
      transform: translateY(-2px);
    }

    .donate-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1;
      position: relative;
    }

    .donate-text h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: var(--text-color);
    }

    .donate-text p {
      font-size: 14px;
      color: var(--text-light);
      margin: 0;
      max-width: 220px;
    }

    .donate-button {
      background: linear-gradient(45deg, #4A4FE4, #8086FF);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .donate-button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(74, 79, 228, 0.3);
    }

    .donate-icon {
      font-size: 16px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);

  // Add confetti effect on hover
  const button = widget.querySelector('.donate-button');
  let confettiInstance: confetti.CreateTypes | null = null;

  button?.addEventListener('mouseenter', () => {
    if (!confettiInstance) {
      confettiInstance = confetti.create(canvas, {
        resize: true,
        useWorker: true
      });
    }

    // Fire confetti
    const end = Date.now() + 200;

    // Polymarket purple colors
    const colors = ['#4A4FE4', '#8086FF', '#E4E5FF'];
    
    (function frame() {
      // Single origin from bottom center with wider spread
      confettiInstance!({
        particleCount: 5,        // Increased particle count
        angle: 90,              // Straight up
        spread: 120,            // Wider spread for better coverage
        origin: { x: 0.5, y: 1.0 }, // Bottom center
        colors: colors,
        gravity: 0.8,           // Slightly reduced gravity for higher rise
        scalar: 0.9,            // Slightly smaller particles
        drift: 0,               // No horizontal drift
        ticks: 200,             // Longer particle lifetime
        shapes: ['circle', 'square'],  // Mixed shapes
        zIndex: 9999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  });

  button?.addEventListener('mouseleave', () => {
    if (confettiInstance) {
      confettiInstance.reset();
    }
  });

  button?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://polyteller.com/donate' });
  });

  return widget;
} 