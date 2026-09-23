/* ==========================================================================
   Waterwal — mock-up behaviour
   Plain ES2017, no dependencies. Every block guards on its own DOM.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------- language */
  var translations = {
    'How it works': { nl: 'Hoe het werkt', de: 'So funktioniert es', fr: 'Comment ça marche' },
    'The space it takes': { nl: 'De ruimte die het inneemt', de: 'Der benötigte Platz', fr: 'L’espace nécessaire' },
    "Where it's used": { nl: 'Waar het wordt gebruikt', de: 'Wo es eingesetzt wird', fr: 'Où il est utilisé' },
    'Specification': { nl: 'Specificaties', de: 'Spezifikation', fr: 'Caractéristiques' },
    'FAQ': { nl: 'Veelgestelde vragen', de: 'FAQ', fr: 'FAQ' },
    'Talk to us': { nl: 'Neem contact op', de: 'Kontakt aufnehmen', fr: 'Parlez-nous' },
    'Buy the product': { nl: 'Product kopen', de: 'Produkt kaufen', fr: 'Acheter le produit' },
    'Back to home': { nl: 'Terug naar home', de: 'Zur Startseite', fr: 'Retour à l’accueil' },
    'New': { nl: 'Nieuw', de: 'Neu', fr: 'Nouveau' },
    'Ready before the forecast is': { nl: 'Klaar voordat de voorspelling komt', de: 'Bereit, bevor die Vorhersage kommt', fr: 'Prêt avant les prévisions' },
    'Flood protection that lives in a drawer.': { nl: 'Waterbescherming die in een lade past.', de: 'Hochwasserschutz, der in eine Schublade passt.', fr: 'Une protection contre les inondations qui tient dans un tiroir.' },
    'See how it works': { nl: 'Bekijk hoe het werkt', de: 'So funktioniert es', fr: 'Voir comment ça marche' },
    'Ships flat · 10-year shelf life · Nothing to maintain': { nl: 'Plat geleverd · 10 jaar houdbaar · Geen onderhoud', de: 'Flach geliefert · 10 Jahre haltbar · Wartungsfrei', fr: 'Livré à plat · 10 ans de conservation · Aucun entretien' },
    'Dry weight of one bag': { nl: 'Drooggewicht van één zak', de: 'Trockengewicht eines Sacks', fr: 'Poids sec d’un sac' },
    'Weight once activated': { nl: 'Gewicht na activering', de: 'Gewicht nach Aktivierung', fr: 'Poids après activation' },
    'Average activation time': { nl: 'Gemiddelde activeringstijd', de: 'Durchschnittliche Aktivierungszeit', fr: 'Temps d’activation moyen' },
    'Shelf life, sealed': { nl: 'Houdbaarheid, ongeopend', de: 'Haltbarkeit, versiegelt', fr: 'Durée de conservation, scellé' },
    'The honest version': { nl: 'De eerlijke versie', de: 'Die ehrliche Version', fr: 'La version honnête' },
    "Most people find out their plan doesn't work at 2 a.m.": { nl: 'De meeste mensen ontdekken om twee uur ’s nachts dat hun plan niet werkt.', de: 'Die meisten merken um zwei Uhr nachts, dass ihr Plan nicht funktioniert.', fr: 'La plupart des gens découvrent à deux heures du matin que leur plan ne fonctionne pas.' },
    'The old way': { nl: 'De oude manier', de: 'Die alte Methode', fr: 'L’ancienne méthode' },
    'With Waterwal': { nl: 'Met Waterwal', de: 'Mit Waterwal', fr: 'Avec Waterwal' },
    'Three steps. No training.': { nl: 'Drie stappen. Geen training nodig.', de: 'Drei Schritte. Keine Schulung.', fr: 'Trois étapes. Aucune formation.' },
    'Lay them down': { nl: 'Leg ze neer', de: 'Auslegen', fr: 'Posez-les' },
    'Add water': { nl: 'Voeg water toe', de: 'Wasser hinzufügen', fr: 'Ajoutez de l’eau' },
    'Stack and walk away': { nl: 'Stapel ze en loop weg', de: 'Stapeln und gehen', fr: 'Empilez et partez' },
    'The unique bit': { nl: 'Het bijzondere', de: 'Das Besondere', fr: 'La différence' },
    'Where it’s used': { nl: 'Waar het wordt gebruikt', de: 'Wo es eingesetzt wird', fr: 'Où il est utilisé' },
    'At home': { nl: 'Thuis', de: 'Zu Hause', fr: 'À la maison' },
    'For business': { nl: 'Voor bedrijven', de: 'Für Unternehmen', fr: 'Pour les entreprises' },
    'In a response plan': { nl: 'In een noodplan', de: 'Im Notfallplan', fr: 'Dans un plan d’intervention' },
    'Everything, on one page.': { nl: 'Alles op één pagina.', de: 'Alles auf einer Seite.', fr: 'Tout sur une page.' },
    'In their words': { nl: 'Hun ervaringen', de: 'Ihre Worte', fr: 'Leurs témoignages' },
    'The relief is the product.': { nl: 'De opluchting is het product.', de: 'Die Erleichterung ist das Produkt.', fr: 'Le soulagement, c’est le produit.' },
    'Questions': { nl: 'Vragen', de: 'Fragen', fr: 'Questions' },
    'Sensible things to ask.': { nl: 'Logische vragen.', de: 'Sinnvolle Fragen.', fr: 'Les bonnes questions.' },
    'How high a barrier can I actually build?': { nl: 'Hoe hoog kan ik een barrière bouwen?', de: 'Wie hoch kann ich eine Barriere bauen?', fr: 'Quelle hauteur puis-je réellement atteindre ?' },
    'Do they stop water completely?': { nl: 'Houden ze water volledig tegen?', de: 'Halten sie Wasser vollständig auf?', fr: 'Arrêtent-ils complètement l’eau ?' },
    'What if the flood arrives before I do?': { nl: 'Wat als het water er eerder is dan ik?', de: 'Was, wenn das Hochwasser vor mir kommt?', fr: 'Et si l’inondation arrive avant moi ?' },
    'Can I reuse them?': { nl: 'Kan ik ze opnieuw gebruiken?', de: 'Kann ich sie wiederverwenden?', fr: 'Puis-je les réutiliser ?' },
    'How many do I need?': { nl: 'Hoeveel heb ik er nodig?', de: 'Wie viele brauche ich?', fr: 'Combien m’en faut-il ?' },
    'Read the specification': { nl: 'Bekijk de specificaties', de: 'Spezifikation lesen', fr: 'Lire les caractéristiques' },
    'Packs & pricing': { nl: 'Pakketten en prijzen', de: 'Pakete und Preise', fr: 'Packs et tarifs' },
    'Product': { nl: 'Product', de: 'Produkt', fr: 'Produit' },
    'Company': { nl: 'Bedrijf', de: 'Unternehmen', fr: 'Entreprise' },
    'Legal': { nl: 'Juridisch', de: 'Rechtliches', fr: 'Mentions légales' },
    'Choose a pack': { nl: 'Kies een pakket', de: 'Paket auswählen', fr: 'Choisir un pack' },
    'How many bags?': { nl: 'Hoeveel zakken?', de: 'Wie viele Säcke?', fr: 'Combien de sacs ?' },
    'How many packs': { nl: 'Hoeveel pakketten?', de: 'Wie viele Pakete?', fr: 'Combien de packs ?' },
    'Where should it go?': { nl: 'Waar moet het naartoe?', de: 'Wohin soll es geliefert werden?', fr: 'Où doit-il être livré ?' },
    'Your order': { nl: 'Jouw bestelling', de: 'Ihre Bestellung', fr: 'Votre commande' },
    'Packs': { nl: 'Pakketten', de: 'Pakete', fr: 'Packs' },
    'Bags in total': { nl: 'Zakken in totaal', de: 'Säcke insgesamt', fr: 'Sacs au total' },
    'Shipping': { nl: 'Verzending', de: 'Versand', fr: 'Livraison' },
    'Free': { nl: 'Gratis', de: 'Kostenlos', fr: 'Gratuit' },
    'Total, VAT included': { nl: 'Totaal, inclusief btw', de: 'Gesamt, inkl. MwSt.', fr: 'Total, TVA incluse' },
    'Place the order': { nl: 'Bestelling plaatsen', de: 'Bestellung aufgeben', fr: 'Passer la commande' },
    'Full name': { nl: 'Volledige naam', de: 'Vollständiger Name', fr: 'Nom complet' },
    'Email': { nl: 'E-mail', de: 'E-Mail', fr: 'E-mail' },
    'Address': { nl: 'Adres', de: 'Adresse', fr: 'Adresse' },
    'Postcode': { nl: 'Postcode', de: 'Postleitzahl', fr: 'Code postal' },
    'City': { nl: 'Plaats', de: 'Ort', fr: 'Ville' },
    'Country': { nl: 'Land', de: 'Land', fr: 'Pays' }
    , 'Doorway Kit': { nl: 'Deurkit', de: 'Tür-Kit', fr: 'Kit pour porte' }
    , 'Home Pack': { nl: 'Thuispakket', de: 'Hauspaket', fr: 'Pack maison' }
    , 'Business Pack': { nl: 'Bedrijfspakket', de: 'Geschäftspaket', fr: 'Pack professionnel' }
    , 'Most chosen': { nl: 'Meest gekozen', de: 'Am beliebtesten', fr: 'Le plus choisi' }
    , 'per bag': { nl: 'per zak', de: 'pro Sack', fr: 'par sac' }
    , 'Stores in a shoebox': { nl: 'Past in een schoenendoos', de: 'Passt in einen Schuhkarton', fr: 'Tient dans une boîte à chaussures' }
    , 'Covers ~1 m': { nl: 'Dekt ongeveer 1 m', de: 'Deckt ca. 1 m ab', fr: 'Couvre environ 1 m' }
    , '8.4 kg total': { nl: '8,4 kg totaal', de: '8,4 kg insgesamt', fr: '8,4 kg au total' }
    , 'Covers ~3 m': { nl: 'Dekt ongeveer 3 m', de: 'Deckt ca. 3 m ab', fr: 'Couvre environ 3 m' }
    , '25 kg total': { nl: '25 kg totaal', de: '25 kg insgesamt', fr: '25 kg au total' }
    , 'Covers ~10 m': { nl: 'Dekt ongeveer 10 m', de: 'Deckt ca. 10 m ab', fr: 'Couvre environ 10 m' }
  };
  var language = localStorage.getItem('waterwal-language') || 'en';
  var translate = function (text) {
    return language === 'en' || !translations[text] ? text : (translations[text][language] || text);
  };
  var translateStaticText = function () {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue.trim();
      if (value && translations[value]) node.nodeValue = node.nodeValue.replace(value, translate(value));
    }
    var heroTitle = $('.hero h1');
    if (heroTitle && language !== 'en') {
      var heroTitles = {
        nl: 'Waterbescherming die in een <em>lade</em> past.',
        de: 'Hochwasserschutz, der in eine <em>Schublade</em> passt.',
        fr: 'Une protection contre les inondations qui tient dans un <em>tiroir</em>.'
      };
      heroTitle.innerHTML = heroTitles[language];
    }
  };
  var languageSelect = $('#languageSelect');
  var applyLanguage = function (value) {
    language = value;
    localStorage.setItem('waterwal-language', language);
    document.documentElement.lang = language;
    if (languageSelect) languageSelect.value = language;
    translateStaticText();
  };
  if (languageSelect) {
    languageSelect.addEventListener('change', function () {
      localStorage.setItem('waterwal-language', languageSelect.value);
      window.location.reload();
    });
    languageSelect.value = language;
  }
  applyLanguage(language);

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
        return '<div class="fact"><dt>' + translate(pair[0]) + '</dt><dd>' + pair[1] + '</dd></div>';
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
        (t.best ? '<span class="pill-best">' + translate('Most chosen') + '</span>' : '') +
        '<span class="tier-radio" aria-hidden="true"></span>' +
        '<span>' +
          '<span class="tier-name">' + translate(t.name) + '</span>' +
          '<span class="tier-desc" style="display:block">' + t.desc + '</span>' +
          '<span class="tier-meta">' + t.meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</span>' +
        '</span>' +
        '<span class="tier-price"><span class="p" style="display:block">' + euro(t.price) + '</span>' +
        '<span class="u" style="display:block">€' + (t.price / t.bags).toFixed(2) + ' ' + translate('per bag') + '</span></span>' +
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
