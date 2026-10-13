/* ==========================================================================
   STRANGERS CAMPING — interactions
   Vanilla JS, no dependencies.
   --------------------------------------------------------------------------
   EDIT THESE THREE VALUES FOR YOUR EVENT ↓
   ========================================================================== */
const CONFIG = {
  // Main booking number in international format, digits only (no + or spaces)
  waNumber:  '916238147823',
  // Second WhatsApp contact number
  waNumber2: '919544454298',
  // Countdown target — ISO date/time with your timezone offset.
  // 17 October, 4:00 PM, Saudi time (UTC+3) = 2026-10-17T16:00:00+03:00
  eventStart: '2026-10-17T16:00:00+03:00',
  eventLabel: '17 / 18 October 2026',
  // Fallback text used by any WhatsApp button that has no data-message of its own
  defaultMessage: "Hi! I'd like to know more about Strangers Camping (17/18 October)."
};
/* ========================================================================== */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- 1. mobile navigation ---------- */
(() => {
  const toggle = $('.nav__toggle');
  const links  = $('.nav__links');
  if (!toggle || !links) return;

  const close = () => {
    links.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  links.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* ---------- 2. sticky nav state ---------- */
(() => {
  const nav = $('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---------- 3. countdown ---------- */
(() => {
  const root = $('[data-countdown]');
  if (!root) return;
  const target = new Date(CONFIG.eventStart).getTime();
  const cells = {
    days:  $('[data-cd="days"]',  root),
    hours: $('[data-cd="hours"]', root),
    mins:  $('[data-cd="mins"]',  root),
    secs:  $('[data-cd="secs"]',  root)
  };
  const pad = n => String(n).padStart(2, '0');
  let timer = null;

  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      root.innerHTML = '<p class="cd-note" style="font-size:1.05rem;color:#FFF8EC">' +
        '🎉 It\'s camp time — see you around the fire!</p>';
      if (timer) clearInterval(timer);
      return;
    }
    const s = Math.floor(diff / 1000);
    if (cells.days)  cells.days.textContent  = String(Math.floor(s / 86400));
    if (cells.hours) cells.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    if (cells.mins)  cells.mins.textContent  = pad(Math.floor((s % 3600) / 60));
    if (cells.secs)  cells.secs.textContent  = pad(s % 60);
  };

  tick();
  timer = setInterval(tick, 1000);
})();

/* ---------- 4. scroll reveal ---------- */
(() => {
  const items = $$('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  items.forEach(el => io.observe(el));
})();

/* ---------- 5. day tabs (schedule) ---------- */
(() => {
  const tabs = $$('.tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    });
  });
})();

/* ---------- 6. gallery lightbox ---------- */
(() => {
  const shots = $$('.shot');
  const box   = $('.lightbox');
  if (!shots.length || !box) return;

  const img     = $('img', box);
  const shareBtn= $('[data-lb-share]', box);
  const dlBtn   = $('[data-lb-download]', box);
  let index = 0;

  const render = i => {
    index = (i + shots.length) % shots.length;
    const shot = shots[index];
    const src  = shot.dataset.full || $('img', shot).src;
    img.src = src;
    img.alt = $('img', shot).alt;
    if (shareBtn) shareBtn.dataset.src = src;
    if (dlBtn)    dlBtn.href = src;
  };

  const open = i => {
    render(i);
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $('.lightbox__close', box)?.focus();
  };
  const close = () => {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  shots.forEach((shot, i) => shot.addEventListener('click', () => open(i)));
  $('.lightbox__close', box)?.addEventListener('click', close);
  $('[data-lb-prev]', box)?.addEventListener('click', () => render(index - 1));
  $('[data-lb-next]', box)?.addEventListener('click', () => render(index + 1));
  box.addEventListener('click', e => { if (e.target === box) close(); });

  document.addEventListener('keydown', e => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowRight') render(index + 1);
    if (e.key === 'ArrowLeft')  render(index - 1);
  });

  shareBtn?.addEventListener('click', async () => {
    const url  = new URL(shareBtn.dataset.src, location.href).href;
    const text = 'STRANGERS CAMPING — 17/18 October 2026. Camp, bonfire, live music & mentalism. Join us!';
    if (navigator.share) {
      try { await navigator.share({ title: 'Strangers Camping', text, url }); return; } catch (_) {}
    }
    const shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
    let win = null;
    try { win = window.open(shareLink, '_blank'); } catch (_) { win = null; }
    if (win) { try { win.opener = null; } catch (_) {} } else { location.href = shareLink; }
  });
})();

/* ---------- 8. WhatsApp launcher (direct connect) ---------- */
const WA = (() => {
  const $modal   = $('.wa-modal');
  const $msgBox  = $('[data-wa-msg]', $modal || document);
  const $openBtn = $('[data-wa-open]', $modal || document);
  const $num     = $('[data-wa-num]', $modal || document);
  const $num2    = $('[data-wa-num2]', $modal || document);
  const $status  = $('[data-wa-status]', $modal || document);
  const $reason  = $('[data-wa-reason]', $modal || document);

  const isMobile = () => /Android|iPhone|iPad|iPod|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);

  // looks like: https://api.whatsapp.com/send?phone=916238147823&text=Hello
  const buildLink = (number, message) =>
    `https://api.whatsapp.com/send?phone=${number}` + (message ? `&text=${encodeURIComponent(message)}` : '');

  // show numbers exactly the way they appear on the posters
  const DISPLAY_NUMBERS = { '916238147823': '+91 6238 147 823', '919544454298': '95444 54298' };
  const prettyNumber = n => DISPLAY_NUMBERS[n] || ('+' + n);

  function copy(text, label) {
    const done = () => {
      if ($status) { $status.hidden = false; $status.textContent = `${label} copied — paste it in WhatsApp.`; }
    };
    const selectFallback = () => {
      if ($msgBox && text === $msgBox.value) { $msgBox.focus(); $msgBox.select(); }
      if ($status) { $status.hidden = false; $status.textContent = 'Select-all is done — press Ctrl/Cmd + C to copy.'; }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(selectFallback);
    } else {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? done() : selectFallback();
      } catch (_) { selectFallback(); }
    }
  }

  function showFallback(number, message, link) {
    if (!$modal) return;
    if ($num)  $num.textContent  = prettyNumber(number);
    if ($num2) $num2.href        = buildLink(CONFIG.waNumber2, message);
    if ($msgBox) $msgBox.value   = message;
    if ($openBtn) $openBtn.href  = link;
    if ($status) { $status.hidden = true; }
    if ($reason) {
      $reason.textContent = message
        ? 'Your browser blocked the pop-up window — your message is ready below.'
        : 'Your browser blocked the pop-up window. Use the options below.';
    }
    $modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.wa-modal__x', $modal)?.focus();
  }

  function closeFallback() {
    if (!$modal) return;
    $modal.hidden = true;
    document.body.style.overflow = '';
  }

  /**
   * Open WhatsApp directly.
   * · Phone / tablet → hands off to the WhatsApp app in the same tab (one tap, no blank tab)
   * · Desktop        → opens WhatsApp Desktop app or WhatsApp Web in a new tab
   * · Pop-up blocked → shows the fallback card with the number + ready-made message
   */
  function open(number, message) {
    const link = buildLink(number, message);
    if (isMobile()) {
      // hand off to the WhatsApp app in the same tab — one tap, no leftover blank tab
      window.location.href = link;
      return true;
    }
    let win = null;
    try { win = window.open(link, '_blank'); } catch (_) { win = null; }
    if (win) { try { win.opener = null; } catch (_) {} return true; }
    // null can mean "blocked" or "already open" — only treat it as blocked if a real page isn't loading
    showFallback(number, message, link);
    return false;
  }

  // --- wiring ---
  if ($modal) {
    $modal.addEventListener('click', e => { if (e.target === $modal) closeFallback(); });
    $('[data-wa-close]', $modal)?.addEventListener('click', closeFallback);
    // last resort: if a new tab is blocked too, open the chat in this tab
    $openBtn?.addEventListener('click', e => {
      e.preventDefault();
      const link = $openBtn.href;
      let w = null;
      try { w = window.open(link, '_blank'); } catch (_) { w = null; }
      if (w) { try { w.opener = null; } catch (_) {} } else { window.location.href = link; }
    });
    $$('[data-wa-copy]', $modal).forEach(btn => {
      btn.addEventListener('click', () => {
        const isNum = btn.dataset.waCopy === 'num';
        copy(isNum ? $num.textContent.replace(/\s/g, '') : ($msgBox?.value || ''), isNum ? 'Number' : 'Message');
      });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$modal.hidden) closeFallback(); });
  }

  // every [data-wa] link on the page connects directly
  $$('a[data-wa]').forEach(link => {
    const fromHref = (link.getAttribute('href') || '').match(/[?&]phone=(\d+)/);
    const number   = fromHref ? fromHref[1] : CONFIG.waNumber;
    const message  = (link.dataset.message || CONFIG.defaultMessage || '').trim();

    // keep hrefs correct even without JavaScript
    link.href   = buildLink(number, message);
    link.target = '_blank';
    link.rel    = 'noopener';

    link.addEventListener('click', e => {
      // let power users open it normally in a new tab
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      open(number, message);
    });
  });

  return { open, buildLink, showFallback };
})();

/* ---------- 9. footer year + dynamic data ---------- */
(() => {
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  $$('[data-event-label]').forEach(el => el.textContent = CONFIG.eventLabel);
})();
