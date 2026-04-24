/* neural.js — gkAgent Neural Network Background Animation
   Usage: <canvas id="neural-bg"></canvas> + <script src="../js/neural.js"></script>
*/
(function () {
  const canvas = document.getElementById('neural-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const GOLD  = { r: 212, g: 175, b: 55  };
  const BLUE  = { r:  59, g: 130, b: 246 };
  const WHITE = { r: 240, g: 244, b: 248 };

  const NODE_COUNT   = 85;
  const CONNECT_DIST = 155;
  const BASE_SPEED   = 0.28;
  const MOUSE_RADIUS = 170;
  const MOUSE_FORCE  = 0.055;

  let W, H, mouse = { x: -9999, y: -9999 };
  let nodes = [], pulses = [];

  class Node {
    constructor() { this.init(); }
    init() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - .5) * BASE_SPEED;
      this.vy = (Math.random() - .5) * BASE_SPEED;
      this.r  = Math.random() * 1.8 + .7;
      const roll = Math.random();
      this.col = roll < .65 ? GOLD : roll < .88 ? BLUE : WHITE;
      this.phase = Math.random() * Math.PI * 2;
      this.pSpeed = 0.003 + Math.random() * 0.004;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -20)   this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20)   this.y = H + 20;
      if (this.y > H + 20) this.y = -20;
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < MOUSE_RADIUS && d > 1) {
        const f = (1 - d / MOUSE_RADIUS) * MOUSE_FORCE;
        this.vx += dx / d * f;
        this.vy += dy / d * f;
      }
      const sp = Math.hypot(this.vx, this.vy);
      if (sp > BASE_SPEED * 3.5) { this.vx *= .94; this.vy *= .94; }
      this.phase += this.pSpeed;
    }
    draw() {
      const a = .3 + .45 * (.5 + .5 * Math.sin(this.phase));
      const { r, g, b } = this.col;
      const gr = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5);
      gr.addColorStop(0, `rgba(${r},${g},${b},${a * .55})`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 5, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fill();
    }
  }

  class Pulse {
    constructor(a, b) {
      this.ax = a.x; this.ay = a.y;
      this.bx = b.x; this.by = b.y;
      this.t  = 0;
      this.spd = .007 + Math.random() * .011;
      this.col = Math.random() < .6 ? GOLD : BLUE;
    }
    update() { this.t += this.spd; }
    done()   { return this.t >= 1; }
    draw() {
      const x = this.ax + (this.bx - this.ax) * this.t;
      const y = this.ay + (this.by - this.ay) * this.t;
      const { r, g, b } = this.col;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, 6);
      gr.addColorStop(0, `rgba(${r},${g},${b},.95)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  let pulseTimer = 0;
  function maybeSpawnPulse() {
    if (++pulseTimer < 8) return;
    pulseTimer = 0;
    if (Math.random() > .3) return;
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    for (let i = 0; i < 12; i++) {
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      if (b === a) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < CONNECT_DIST) {
        pulses.push(new Pulse(a, b)); break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > CONNECT_DIST) continue;
        const fade = 1 - d / CONNECT_DIST;
        const gr = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        const { r: ar, g: ag, b: ab } = a.col;
        const { r: br, g: bg, b: bb } = b.col;
        gr.addColorStop(0, `rgba(${ar},${ag},${ab},${fade * .22})`);
        gr.addColorStop(1, `rgba(${br},${bg},${bb},${fade * .22})`);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = gr;
        ctx.lineWidth   = fade * 1.1;
        ctx.stroke();
      }
    }
    pulses = pulses.filter(p => !p.done());
    pulses.forEach(p => { p.update(); p.draw(); });
    nodes.forEach(n => { n.update(); n.draw(); });
    maybeSpawnPulse();
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  resize();
  nodes = Array.from({ length: NODE_COUNT }, () => new Node());
  draw();
})();
