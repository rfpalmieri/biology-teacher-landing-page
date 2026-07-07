// FUNDO ANIMADO - IA

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'bio-canvas';
  Object.assign(canvas.style, {
    position: 'absolute',
    top: '0', left: '0',
    width: '100%', height: '100%',
    zIndex: '0',
    pointerEvents: 'none',
  });

  const hero = document.getElementById('hero-total');
  if (!hero) return;
  hero.style.position = 'relative';
  hero.style.overflow = 'hidden';
  hero.insertBefore(canvas, hero.firstChild);

  const content = document.getElementById('hero-conteudo-container');
  if (content) content.style.position = 'relative';

  const ctx = canvas.getContext('2d');
  const GREEN = '#2D7A4F';
  const GREEN_LIGHT = '#3EA96B';

  // ── resize ──────────────────────────────────────────────
  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
    // redistribui partículas que ficaram fora da área
    particles.forEach(p => {
      if (p.x > canvas.width)  p.x = Math.random() * canvas.width;
      if (p.y > canvas.height) p.y = Math.random() * canvas.height;
    });
  }

  // ── FORMAS ──────────────────────────────────────────────
  function drawMolecule(cx, cy, r, angle, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.rotate(angle);
    const bonds = [
      { a: 0,                  len: r * 2.2 },
      { a: Math.PI * 2 / 3,   len: r * 1.8 },
      { a: Math.PI * 4 / 3,   len: r * 2.0 },
    ];
    ctx.strokeStyle = GREEN; ctx.lineWidth = 1.2;
    bonds.forEach(b => {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(b.a) * b.len, Math.sin(b.a) * b.len); ctx.stroke();
    });
    ctx.fillStyle = GREEN_LIGHT;
    bonds.forEach(b => {
      ctx.beginPath();
      ctx.arc(Math.cos(b.a) * b.len, Math.sin(b.a) * b.len, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = GREEN;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawDNA(cx, cy, w, h, phase, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    const amp = w / 2;
    ctx.lineWidth = 1.4;
    for (let s = 0; s < 2; s++) {
      ctx.beginPath(); ctx.strokeStyle = s === 0 ? GREEN : GREEN_LIGHT;
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const y = -h / 2 + t * h;
        const x = Math.sin(t * Math.PI * 4 + phase + s * Math.PI) * amp;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = GREEN; ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = -h / 2 + t * h;
      const x1 = Math.sin(t * Math.PI * 4 + phase) * amp;
      const x2 = Math.sin(t * Math.PI * 4 + phase + Math.PI) * amp;
      ctx.globalAlpha = alpha * Math.abs(Math.sin(t * Math.PI * 4 + phase)) * 0.8;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawCell(cx, cy, r, angle, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.strokeStyle = GREEN; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.28, 0, Math.PI * 2);
    ctx.strokeStyle = GREEN_LIGHT; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.35, r * 0.2, r * 0.18, r * 0.09, Math.PI / 4, 0, Math.PI * 2);
    ctx.strokeStyle = GREEN_LIGHT; ctx.stroke();
    ctx.restore();
  }

  function drawHexagon(cx, cy, r, angle, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.strokeStyle = GREEN_LIGHT; ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
              : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // ── PARTÍCULAS ───────────────────────────────────────────
  const SHAPES = ['molecule', 'dna', 'cell', 'hexagon'];
  function rand(a, b) { return a + Math.random() * (b - a); }

  function createParticle(forceInside) {
    const type = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return {
      type,
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      size:   type === 'dna' ? rand(24, 46) : rand(10, 26),
      vx:     rand(-0.18, 0.18),
      vy:     rand(-0.22, 0.22),
      angle:  rand(0, Math.PI * 2),
      vAngle: rand(-0.003, 0.003),
      alpha:  rand(0.06, 0.18),
      phase:  rand(0, Math.PI * 2),
      vPhase: rand(0.004, 0.012),
    };
  }

  // Inicializa canvas ANTES de criar partículas — garante dimensões corretas já no primeiro frame
  canvas.width  = hero.offsetWidth;
  canvas.height = hero.offsetHeight;

  const COUNT = 28;
  const particles = Array.from({ length: COUNT }, createParticle);

  // ResizeObserver cobre tanto redimensionamento de janela
  // quanto mudanças internas do hero (ex: conteúdo dinâmico)
  const ro = new ResizeObserver(() => resize());
  ro.observe(hero);
  // fallback para navegadores sem ResizeObserver
  window.addEventListener('resize', resize);

  // ── LOOP ─────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.angle  += p.vAngle;
      p.phase  += p.vPhase;

      // wrap usando dimensões ATUAIS do canvas
      const W = canvas.width;
      const H = canvas.height;
      if (p.x < -60)    p.x = W + 60;
      if (p.x > W + 60) p.x = -60;
      if (p.y < -80)    p.y = H + 80;
      if (p.y > H + 80) p.y = -80;

      switch (p.type) {
        case 'molecule': drawMolecule(p.x, p.y, p.size * 0.4, p.angle, p.alpha); break;
        case 'dna':      drawDNA(p.x, p.y, p.size * 0.6, p.size * 2.2, p.phase, p.alpha); break;
        case 'cell':     drawCell(p.x, p.y, p.size, p.angle, p.alpha); break;
        case 'hexagon':  drawHexagon(p.x, p.y, p.size * 0.7, p.angle, p.alpha); break;
      }
    });

    requestAnimationFrame(draw);
  }

  draw();
})();

// REVEAL

const elementos = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => { //fica monitorando se um elemento entrou ou saiu da área visível da tela
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visivel');
        }
    });
}, {
    threshold: 0.15
});

elementos.forEach(el => observer.observe(el));

// MENU

const menuIcon = document.querySelector("#menu-icon");
const nav = document.querySelector("#nav-container");

menuIcon.addEventListener("click", () => {
    nav.classList.toggle("invisivel");
    menuIcon.classList.toggle("fa-x");
    menuIcon.classList.toggle("fa-bars");
});

const navItems = nav.querySelectorAll("a");

navItems.forEach(item => {
    item.addEventListener("click", () => {
        nav.classList.add("invisivel");
        menuIcon.classList.remove("fa-x");
        menuIcon.classList.add("fa-bars");
    });
});

// CARROSSEL

new Swiper(".depoimentos-swiper", {

    loop: true,

    autoHeight: true,

    slidesPerView: 1,

    spaceBetween: 20,

    autoplay:{
        delay:3000,
        disableOnInteraction:false,
    },

    pagination:{
        el:".swiper-pagination",
        clickable:true,
    },

    navigation:{
        nextEl:".swiper-button-next",
        prevEl:".swiper-button-prev",
    },

    breakpoints:{

        768:{
            slidesPerView:2,
            spaceBetween:20,
        },

        1024:{
            slidesPerView:3,
            spaceBetween:30,
        }

    }

});


// WHATSAPP

function agendarAula() {
    const numero = "5521990428072"; // Coloque seu número aqui
    const mensagem = encodeURIComponent(
        "Olá! Tenho interesse nas aulas de Biologia e gostaria de agendar uma aula experimental gratuita. Se possível, gostaria de saber os dias e horários disponíveis. Obrigado(a)!"
    );

    window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
}