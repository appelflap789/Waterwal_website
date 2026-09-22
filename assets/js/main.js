/* ==========================================================================
   Waterwal — mock-up behaviour
   Plain ES2017, no dependencies. Every block guards on its own DOM.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- header */
  var header = $('#siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------------------ mobile nav */
  var navToggle = $('#navToggle');
  var mobileMenu = $('#mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      mobileMenu.classList.toggle('is-open', !open);
    });
    $$('a', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('is-open');
      });
    });
  }

  /* --------------------------------------------------------- scroll reveal */
  var reveals = $$('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || reduceMotion) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------- counting number */
  var counters = $$('[data-count]');
  if (counters.length) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (reduceMotion) { el.textContent = target; return; }
      var start = performance.now();
      var dur = 1100;
      var tick = function (now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCount);
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* -------------------------------------------------------------- accordion */
  $$('.faq-q').forEach(function (btn) {
    var item = btn.parentElement;
    var panel = $('.faq-a', item);
    btn.addEventListener('click', function () {
      var open = item.classList.contains('is-open');
      $$('.faq-item.is-open').forEach(function (other) {
        other.classList.remove('is-open');
        $('.faq-a', other).style.maxHeight = null;
      });
      if (!open) {
        item.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* --------------------------------------------- storage-space comparison */
  var volume = $('#volumeVisual');
  var facts  = $('#compareFacts');
  if (volume && facts) {
    var COLS = 10, ROWS = 8;
    var MODES = {
      sandbags: {
        units: 73,
        rows: [
          ['Storage space', '0.47 m&sup3; — a euro pallet'],
          ['Weight in storage', '420 kg (with sand)'],
          ['Needed beforehand', 'Sand, shovel, sacks'],
          ['Time to protect one door', '~45 min, two people']
        ]
      },
      waterwal: {
        units: 1,
        rows: [
          ['Storage space', '0.0064 m&sup3; — a shoebox'],
          ['Weight in storage', '8.4 kg'],
          ['Needed beforehand', 'Nothing but water'],
          ['Time to protect one door', '~6 min, one person']
        ]
      }
    };

    /* build the grid once */
    var cells = [];
    for (var r = 0; r < ROWS; r++) {
      var row = document.createElement('div');
      row.className = 'vol-row';
      for (var c = 0; c < COLS; c++) {
        var cell = document.createElement('i');
        cell.className = 'vol-unit';
        cell.style.transitionDelay = (reduceMotion ? 0 : (r * COLS + c) * 5) + 'ms';
        row.appendChild(cell);
        cells.push(cell);
      }
      volume.appendChild(row);
    }

    var paint = function (mode) {
      var conf = MODES[mode];
      cells.forEach(function (cell, i) {
        cell.classList.toggle('on', i < conf.units);
        cell.classList.toggle('lead', mode === 'waterwal' && i === 0);
      });
      facts.innerHTML = conf.rows.map(function (pair) {
        return '<div class="fact"><dt>' + pair[0] + '</dt><dd>' + pair[1] + '</dd></div>';
      }).join('');
    };

    $$('.segmented [data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.segmented [data-mode]').forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
        btn.setAttribute('aria-selected', 'true');
        volume.classList.add('fade');
        window.setTimeout(function () {
          paint(btn.getAttribute('data-mode'));
          volume.classList.remove('fade');
        }, reduceMotion ? 0 : 180);
      });
    });

    paint('waterwal');
  }

  /* ============================================================== BUY PAGE */
  var tiersEl = $('#tiers');
  if (!tiersEl) return;

  var TIERS = [
    {
      id: 'door', name: 'Doorway Kit', bags: 6, price: 59, best: false,
      desc: 'One standard door, three layers high. The sensible starting point.',
      meta: ['6 bags', 'Stores in a shoebox', 'Covers ~1 m']
    },
    {
      id: 'home', name: 'Home Pack', bags: 20, price: 179, best: true,
      desc: 'Front door, back door and a garage threshold, with spares for the air bricks.',
      meta: ['20 bags', '8.4 kg total', 'Covers ~3 m']
    },
    {
      id: 'biz', name: 'Business Pack', bags: 60, price: 449, best: false,
      desc: 'Shopfronts, loading bays and lift shafts. Splits neatly across three sites.',
      meta: ['60 bags', '25 kg total', 'Covers ~10 m']
    }
  ];

  var state = { tier: TIERS[1], qty: 1 };
  var euro = function (n) { return '€' + n.toLocaleString('en-GB'); };

  /* ---- render tiers ---- */
  tiersEl.innerHTML = TIERS.map(function (t) {
    return '' +
      '<div class="tier" role="radio" tabindex="0" data-id="' + t.id + '" aria-checked="false">' +
        (t.best ? '<span class="pill-best">Most chosen</span>' : '') +
        '<span class="tier-radio" aria-hidden="true"></span>' +
        '<span>' +
          '<span class="tier-name">' + t.name + '</span>' +
          '<span class="tier-desc" style="display:block">' + t.desc + '</span>' +
          '<span class="tier-meta">' + t.meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</span>' +
        '</span>' +
        '<span class="tier-price"><span class="p" style="display:block">' + euro(t.price) + '</span>' +
        '<span class="u" style="display:block">€' + (t.price / t.bags).toFixed(2) + ' per bag</span></span>' +
      '</div>';
  }).join('');

  var selectTier = function (id) {
    var found = TIERS.filter(function (t) { return t.id === id; })[0];
    if (found) state.tier = found;
    $$('.tier', tiersEl).forEach(function (el) {
      el.setAttribute('aria-checked', String(el.getAttribute('data-id') === state.tier.id));
    });
    render();
  };

  $$('.tier', tiersEl).forEach(function (el) {
    var pick = function () { selectTier(el.getAttribute('data-id')); };
    el.addEventListener('click', pick);
    el.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(); }
    });
  });

  /* ---- quantity ---- */
  var qtyOut = $('#qtyOut'), qtyNote = $('#qtyNote');
  $('#qtyMinus').addEventListener('click', function () { state.qty = Math.max(1, state.qty - 1); render(); });
  $('#qtyPlus').addEventListener('click',  function () { state.qty = Math.min(99, state.qty + 1); render(); });

  /* ---- calculator ---- */
  var calcWidth = $('#calcWidth'), calcHeight = $('#calcHeight');
  var calcBags = $('#calcBags'), calcNote = $('#calcNote'), calcApply = $('#calcApply');
  var recommended = { bags: 0, tier: TIERS[0], packs: 1 };

  var recalc = function () {
    var width = Math.max(0.3, Math.min(60, parseFloat(calcWidth.value) || 1));
    var height = parseInt(calcHeight.value, 10);
    var perLayer = Math.ceil((width * 100) / 62);
    var layers = Math.ceil(height / 11);
    var bags = perLayer * layers;

    /* smallest pack (or multiple of it) that covers the need, fewest bags wasted */
    var bestFit = TIERS[0], bestPacks = 1, bestWaste = Infinity;
    TIERS.forEach(function (t) {
      var packs = Math.ceil(bags / t.bags);
      var waste = packs * t.bags - bags;
      var cost = packs * t.price;
      var score = waste * 2 + cost / 10;
      if (score < bestWaste) { bestWaste = score; bestFit = t; bestPacks = packs; }
    });

    recommended = { bags: bags, tier: bestFit, packs: bestPacks };
    calcBags.textContent = bags;
    calcNote.innerHTML = '&mdash; ' + perLayer + ' across &times; ' + layers + ' layer' + (layers > 1 ? 's' : '') +
      '. That&rsquo;s ' + bestPacks + ' &times; ' + bestFit.name + '.';
  };

  calcWidth.addEventListener('input', recalc);
  calcHeight.addEventListener('change', recalc);
  calcApply.addEventListener('click', function () {
    state.qty = recommended.packs;
    selectTier(recommended.tier.id);
    $('#tiers').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  /* ---- summary ---- */
  var sumPack = $('#sumPack'), sumPackPrice = $('#sumPackPrice'), sumQty = $('#sumQty');
  var sumBags = $('#sumBags'), sumShip = $('#sumShip'), sumTotal = $('#sumTotal');

  function render() {
    var goods = state.tier.price * state.qty;
    var ship = goods >= 100 ? 0 : 6.95;
    var total = goods + ship;

    qtyOut.textContent = state.qty;
    qtyNote.textContent = state.qty + ' pack' + (state.qty > 1 ? 's' : '') +
      ' · ' + (state.tier.bags * state.qty) + ' bags in total';

    sumPack.textContent = state.tier.name;
    sumPackPrice.textContent = euro(state.tier.price);
    sumQty.textContent = state.qty;
    sumBags.textContent = state.tier.bags * state.qty;
    sumShip.textContent = ship === 0 ? 'Free' : '€6.95';
    sumTotal.textContent = '€' + (total % 1 === 0 ? String(total) : total.toFixed(2));
  }

  /* ---- place order ---- */
  var layout = $('#buyLayout'), confirm = $('#confirm');
  $('#placeOrder').addEventListener('click', function () {
    var name = ($('#fName').value || '').trim();
    var email = ($('#fEmail').value || '').trim();
    var first = name ? name.split(' ')[0] : 'there';

    if (!name || !email) {
      $('#fName').focus();
      $('#confirmDetail').textContent = '';
      var missing = !name ? $('#fName') : $('#fEmail');
      missing.style.borderColor = '#B4553F';
      missing.focus();
      window.setTimeout(function () { missing.style.borderColor = ''; }, 2200);
      return;
    }

    $('#confirmDetail').textContent =
      'Thanks, ' + first + '. ' + state.qty + ' × ' + state.tier.name +
      ' (' + state.tier.bags * state.qty + ' bags) would be on its way to you, flat-packed, within two working days.';
    layout.style.display = 'none';
    confirm.classList.add('is-on');
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  $('#againBtn').addEventListener('click', function () {
    confirm.classList.remove('is-on');
    layout.style.display = '';
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---- boot ---- */
  selectTier('home');
  recalc();
})();
