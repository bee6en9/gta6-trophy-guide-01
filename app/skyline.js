export function drawViceCitySkyline(canvas) {
  const width = 1280;
  const height = 250;
  canvas.width = width * 2;
  canvas.height = height * 2;
  const g = canvas.getContext('2d');
  g.scale(2, 2);
  let seed = 6011986;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const sky = g.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#231143'); sky.addColorStop(0.46, '#8f275b'); sky.addColorStop(0.8, '#ff7a38'); sky.addColorStop(1, '#b8396d');
  g.fillStyle = sky; g.fillRect(0, 0, width, height);
  const sun = g.createLinearGradient(0, 16, 0, 198);
  sun.addColorStop(0, '#ffd8a0'); sun.addColorStop(1, '#ff5088');
  g.fillStyle = sun; g.beginPath(); g.arc(825, 110, 85, 0, Math.PI * 2); g.fill();
  for (let y = 115; y < 200; y += 12) { g.fillStyle = '#a639642b'; g.fillRect(735, y, 180, 4); }
  for (let layer = 0; layer < 3; layer++) {
    let x = 420;
    while (x < width) {
      const w = 16 + random() * 46;
      const h = 18 + random() * (65 + layer * 29);
      const bottom = 207 + layer * 13;
      g.fillStyle = ['#68294f', '#381c46', '#180f30'][layer];
      g.fillRect(x, bottom - h, w, h);
      if (random() > 0.6) g.fillRect(x + w * 0.48, bottom - h - 15, 2, 15);
      for (let wy = bottom - h + 8; wy < bottom - 5; wy += 10) {
        for (let wx = x + 5; wx < x + w - 4; wx += 9) {
          if (random() > 0.57) { g.fillStyle = random() > 0.5 ? '#ff975759' : '#00e5c044'; g.fillRect(wx, wy, 2, 3); }
        }
      }
      x += w + 3 + random() * 12;
    }
  }
  function palm(x, y, scale) {
    g.save(); g.translate(x, y); g.scale(scale, scale); g.strokeStyle = '#160c29'; g.lineCap = 'round';
    g.lineWidth = 8; g.beginPath(); g.moveTo(0, 95); g.quadraticCurveTo(8, 37, 0, 0); g.stroke();
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const endX = Math.cos(angle) * 52;
      const endY = Math.sin(angle) * 20 + 12;
      g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(endX * 0.55, endY - 32, endX, endY); g.stroke();
      for (let j = 0.3; j < 1; j += 0.15) { g.lineWidth = 2; g.beginPath(); g.moveTo(endX * j, (endY - 26) * j); g.lineTo(endX * j - 8, (endY - 26) * j + 13); g.stroke(); }
    }
    g.restore();
  }
  palm(1158, 87, 1.5); palm(1078, 139, 0.9); palm(564, 165, 0.65);
  const shade = g.createLinearGradient(0, 0, 900, 0);
  shade.addColorStop(0, '#160a2e'); shade.addColorStop(0.48, '#160a2eea'); shade.addColorStop(1, '#160a2e00');
  g.fillStyle = shade; g.fillRect(0, 0, width, height);
  g.fillStyle = '#140a25'; g.fillRect(0, 243, width, 7);
}
