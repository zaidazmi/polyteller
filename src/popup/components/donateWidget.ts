import confetti from 'canvas-confetti';

export function createDonateWidget(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'donate-section';
  
  // Existing donate widget
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

  // Add footer with email and copyright
  const footer = document.createElement('div');
  footer.className = 'donate-footer';
  footer.innerHTML = `
    <a href="mailto:polytellerapp@gmail.com" class="footer-email">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
      polytellerapp@gmail.com
    </a>
    <div class="footer-copyright">
      © ${new Date().getFullYear()} Polyteller. All rights reserved.
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .donate-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
    }

    .donate-widget {
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
      background-color: var(--primary-color);
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
      background-color: var(--secondary-color);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(74, 79, 228, 0.3);
    }

    .donate-button:active {
      transform: scale(0.98);
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

    .donate-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      text-align: center;
    }

    .footer-email {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-light);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s ease;
    }

    .footer-email:hover {
      color: var(--primary-color);
    }

    .footer-email svg {
      transition: stroke 0.2s ease;
    }

    .footer-email:hover svg {
      stroke: var(--primary-color);
    }

    .footer-copyright {
      color: var(--text-light);
      font-size: 12px;
    }
  `;
  document.head.appendChild(style);

  // Combine widget and footer
  container.appendChild(widget);
  container.appendChild(footer);

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
    chrome.tabs.create({ url: 'https://polyteller.web.app' });
  });

  return container;
} 