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
  Object.assign(translations, {
    'Waterwal bags are 2 cm thin and weigh 420 grams. Add water and each one becomes an 18 kilo barrier in about three minutes. No sand. No shovel. No storage unit. Just a quiet answer to the question you\'d rather not think about.': {
      nl: 'Waterwal-zakken zijn 2 cm dun en wegen 420 gram. Voeg water toe en elke zak wordt in ongeveer drie minuten een barrière van 18 kilo. Geen zand. Geen schep. Geen opslagruimte. Gewoon een stil antwoord op een vraag waar je liever niet aan denkt.',
      de: 'Waterwal-Säcke sind 2 cm dünn und wiegen 420 Gramm. Mit Wasser wird jeder Sack in etwa drei Minuten zu einer 18-Kilo-Barriere. Kein Sand. Keine Schaufel. Kein Lagerraum. Einfach eine ruhige Antwort auf eine Frage, über die man lieber nicht nachdenkt.',
      fr: 'Les sacs Waterwal font 2 cm d’épaisseur et pèsent 420 grammes. Ajoutez de l’eau et chacun devient une barrière de 18 kilos en environ trois minutes. Pas de sable. Pas de pelle. Pas d’espace de stockage. Une réponse simple à une question à laquelle on préfère ne pas penser.'
    },
    'Floodwater': { nl: 'Overstromingswater', de: 'Hochwasser', fr: 'Eau d’inondation' },
    'Three layers · 33 cm': { nl: 'Drie lagen · 33 cm', de: 'Drei Lagen · 33 cm', fr: 'Trois couches · 33 cm' },
    'Floor, dry': { nl: 'Vloer, droog', de: 'Boden, trocken', fr: 'Sol, sec' },
    'One doorway · six bags · under four minutes': { nl: 'Eén deuropening · zes zakken · minder dan vier minuten', de: 'Eine Türöffnung · sechs Säcke · unter vier Minuten', fr: 'Une porte · six sacs · moins de quatre minutes' },
    'Heavy rain arrives faster than it used to, and the traditional answer — sandbags — asks for everything you don\'t have in that moment: sand, a shovel, a second pair of hands, and a warning that came early enough to matter. Waterwal was built the other way around. It asks for nothing until the day you need it.': {
      nl: 'Zware regen komt sneller dan vroeger, en het traditionele antwoord — zandzakken — vraagt om alles wat je op dat moment niet hebt: zand, een schep, een extra paar handen en een waarschuwing die vroeg genoeg kwam. Waterwal is precies andersom ontworpen. Het vraagt niets tot de dag dat je het nodig hebt.',
      de: 'Starker Regen kommt schneller als früher, und die traditionelle Lösung – Sandsäcke – verlangt in diesem Moment alles, was man nicht hat: Sand, eine Schaufel, ein zweites Paar Hände und eine rechtzeitige Warnung. Waterwal wurde genau andersherum entwickelt. Es verlangt nichts, bis man es braucht.',
      fr: 'Les fortes pluies arrivent plus vite qu’avant, et la solution traditionnelle — les sacs de sable — demande tout ce qui manque à ce moment-là : du sable, une pelle, une paire de mains supplémentaire et une alerte suffisamment précoce. Waterwal a été conçu à l’inverse. Il ne demande rien jusqu’au jour où vous en avez besoin.'
    },
    'Half a pallet of storage, all year round, for four nights of use': { nl: 'Het hele jaar een halve pallet opslag voor vier nachten gebruik', de: 'Das ganze Jahr eine halbe Palette Lagerplatz für vier Nächte Einsatz', fr: 'Une demi-palette de stockage toute l’année pour quatre nuits d’utilisation' },
    'Roughly 420 kg to move by hand, in the rain, in the dark': { nl: 'Ongeveer 420 kg met de hand verplaatsen, in de regen en het donker', de: 'Etwa 420 kg von Hand bewegen, im Regen und im Dunkeln', fr: 'Environ 420 kg à déplacer à la main, sous la pluie et dans le noir' },
    'You need sand on site before the water arrives — most people don\'t': { nl: 'Je hebt zand op locatie nodig voordat het water komt — de meeste mensen hebben dat niet', de: 'Man braucht Sand vor Ort, bevor das Wasser kommt – die meisten haben keinen', fr: 'Il faut du sable sur place avant l’arrivée de l’eau — la plupart des gens n’en ont pas' },
    'Filling and stacking a single doorway takes two people about 45 minutes': { nl: 'Een deuropening vullen en stapelen duurt met twee mensen ongeveer 45 minuten', de: 'Eine Türöffnung zu füllen und zu stapeln dauert zwei Personen etwa 45 Minuten', fr: 'Remplir et empiler une seule porte prend environ 45 minutes à deux' },
    'A pack of twenty fits in a shoebox, under the stairs or behind a filing cabinet': { nl: 'Een pakket van twintig past in een schoenendoos, onder de trap of achter een archiefkast', de: 'Ein Paket mit zwanzig Säcken passt in einen Schuhkarton, unter die Treppe oder hinter einen Aktenschrank', fr: 'Un pack de vingt sacs tient dans une boîte à chaussures, sous l’escalier ou derrière un classeur' },
    '8.4 kg for that same pack — one person carries it in one hand': { nl: '8,4 kg voor hetzelfde pakket — één persoon draagt het met één hand', de: '8,4 kg für dasselbe Paket – eine Person trägt es mit einer Hand', fr: '8,4 kg pour le même pack — une personne le porte d’une seule main' },
    'The floodwater itself activates them, so late warnings stop being fatal': { nl: 'Het overstromingswater activeert ze zelf, zodat late waarschuwingen niet langer fataal zijn', de: 'Das Hochwasser selbst aktiviert sie, sodass späte Warnungen nicht mehr entscheidend sind', fr: 'L’eau de crue les active elle-même, les alertes tardives ne sont donc plus fatales' },
    'One doorway, one person, about six minutes start to finish': { nl: 'Eén deuropening, één persoon, ongeveer zes minuten van begin tot eind', de: 'Eine Türöffnung, eine Person, etwa sechs Minuten von Anfang bis Ende', fr: 'Une porte, une personne, environ six minutes du début à la fin' },
    'Inside each bag is a cross-linked polymer core that binds water and holds it as a gel. That\'s the whole mechanism — and the reason it stays flat until the moment it\'s needed.': {
      nl: 'In elke zak zit een verknoopt polymeer dat water bindt en als gel vasthoudt. Dat is het hele mechanisme — en de reden waarom de zak plat blijft tot het moment dat hij nodig is.',
      de: 'In jedem Sack befindet sich ein vernetzter Polymerkern, der Wasser bindet und als Gel hält. Das ist der gesamte Mechanismus – und der Grund, warum er bis zum Einsatz flach bleibt.',
      fr: 'Chaque sac contient un polymère réticulé qui fixe l’eau et la retient sous forme de gel. C’est tout le mécanisme — et la raison pour laquelle il reste plat jusqu’au moment où vous en avez besoin.'
    },
    'Take the bags out of the pack and lay them flat across the doorway, vent, or loading bay. They arrive folded and ready — there\'s nothing to assemble.': { nl: 'Haal de zakken uit het pakket en leg ze plat over de deuropening, ventilatieopening of laadkade. Ze zijn gevouwen en klaar voor gebruik — er hoeft niets in elkaar gezet te worden.', de: 'Nehmen Sie die Säcke aus dem Paket und legen Sie sie flach über Türöffnung, Lüftung oder Laderampe. Sie kommen gefaltet und einsatzbereit – nichts muss montiert werden.', fr: 'Sortez les sacs du pack et posez-les à plat devant la porte, l’aération ou le quai de chargement. Ils arrivent pliés et prêts à l’emploi — rien à assembler.' },
    'A hose, a bucket, or the floodwater already at your door. The core binds the water and each bag swells to around 18 kg, moulding itself to the ground beneath it.': { nl: 'Een tuinslang, een emmer of het overstromingswater dat al bij je deur staat. De kern bindt het water en elke zak zwelt tot ongeveer 18 kg en vormt zich naar de ondergrond.', de: 'Ein Schlauch, ein Eimer oder das Hochwasser vor Ihrer Tür. Der Kern bindet das Wasser und jeder Sack quillt auf etwa 18 kg auf und passt sich dem Boden an.', fr: 'Un tuyau, un seau ou l’eau déjà présente devant votre porte. Le cœur fixe l’eau et chaque sac atteint environ 18 kg en épousant le sol.' },
    'Build up in layers, overlapping like brickwork. The weight and the seal do the rest. Afterwards the bags dry out slowly and go out with ordinary waste.': { nl: 'Bouw lagen op die elkaar overlappen als metselwerk. Het gewicht en de afdichting doen de rest. Daarna drogen de zakken langzaam en kunnen ze bij het gewone afval.', de: 'Stapeln Sie die Säcke in überlappenden Lagen wie Mauerwerk. Gewicht und Abdichtung erledigen den Rest. Danach trocknen die Säcke langsam und kommen in den normalen Hausmüll.', fr: 'Empilez les sacs en couches qui se chevauchent comme des briques. Le poids et l’étanchéité font le reste. Ensuite, les sacs sèchent lentement et vont avec les déchets ordinaires.' },
    'The protection is the easy part.': { nl: 'De bescherming is het makkelijke deel.', de: 'Der Schutz ist der einfache Teil.', fr: 'La protection est la partie facile.' },
    'The storage is why people never buy it.': { nl: 'De opslag is waarom mensen het nooit kopen.', de: 'Der benötigte Lagerplatz hält viele vom Kauf ab.', fr: 'Le stockage est la raison pour laquelle les gens ne l’achètent jamais.' },
    'Everybody agrees flood barriers are sensible. Almost nobody has room for them. Here is the same doorway, protected both ways — drawn to scale.': { nl: 'Iedereen vindt waterkeringen verstandig. Bijna niemand heeft er ruimte voor. Hier zie je dezelfde deuropening op schaal, op beide manieren beschermd.', de: 'Alle finden Hochwasserschutz sinnvoll. Fast niemand hat Platz dafür. Hier ist dieselbe Türöffnung maßstabsgetreu auf beide Arten geschützt.', fr: 'Tout le monde s’accorde sur l’utilité des barrières anti-inondation. Presque personne n’a de place pour elles. Voici la même porte protégée de deux façons, à l’échelle.' },
    'Protecting one standard front door — 20 units, three layers high': { nl: 'Eén standaard voordeur beschermen — 20 stuks, drie lagen hoog', de: 'Schutz einer Standard-Haustür – 20 Einheiten, drei Lagen hoch', fr: 'Protéger une porte d’entrée standard — 20 unités, trois couches' },
    'Traditional sandbags': { nl: 'Traditionele zandzakken', de: 'Herkömmliche Sandsäcke', fr: 'Sacs de sable traditionnels' },
    'Each square is the shelf space of one Waterwal pack — about a shoebox.': { nl: 'Elk vierkant is de plankruimte van één Waterwal-pakket — ongeveer een schoenendoos.', de: 'Jedes Quadrat entspricht dem Regalplatz eines Waterwal-Pakets – etwa einem Schuhkarton.', fr: 'Chaque carré représente l’espace en rayon d’un pack Waterwal — environ une boîte à chaussures.' },
    'Homes, businesses, and the people who plan for both.': { nl: 'Huizen, bedrijven en de mensen die op beide plannen.', de: 'Häuser, Unternehmen und Menschen, die für beides planen.', fr: 'Maisons, entreprises et ceux qui préparent les deux.' },
    'Front and back doors, garage thresholds, cellar lights and air bricks. A home pack lives in a cupboard and takes less room than a winter coat.': { nl: 'Voor- en achterdeuren, garagedrempels, kelderramen en ventilatieopeningen. Een thuispakket past in een kast en neemt minder ruimte in dan een winterjas.', de: 'Haus- und Hintertüren, Garagenschwellen, Kellerfenster und Lüftungsöffnungen. Ein Hauspaket passt in einen Schrank und braucht weniger Platz als ein Wintermantel.', fr: 'Portes avant et arrière, seuils de garage, soupiraux et briques d’aération. Un pack maison tient dans un placard et prend moins de place qu’un manteau d’hiver.' },
    'Shopfronts, loading bays, server rooms and lift shafts. Stock enough for the whole frontage without giving up a single pallet position.': { nl: 'Winkelpuien, laadkades, serverruimtes en liftschachten. Genoeg voorraad voor de hele gevel zonder ook maar één palletplaats op te geven.', de: 'Ladenfronts, Laderampen, Serverräume und Aufzugsschächte. Genug Vorrat für die gesamte Front, ohne einen Palettenplatz aufzugeben.', fr: 'Vitrines, quais de chargement, salles serveurs et cages d’ascenseur. Assez de stock pour toute la façade sans sacrifier une seule place de palette.' },
    'Facilities teams, housing associations and municipalities keep packs in every building rather than one depot — because the depot is never where the water is.': { nl: 'Facilitaire teams, woningcorporaties en gemeenten bewaren pakketten in elk gebouw in plaats van in één depot — want het depot staat nooit waar het water is.', de: 'Facility-Teams, Wohnungsbaugesellschaften und Kommunen lagern Pakete in jedem Gebäude statt in einem Depot – denn das Depot ist nie dort, wo das Wasser ist.', fr: 'Les équipes techniques, bailleurs et municipalités gardent des packs dans chaque bâtiment plutôt que dans un seul dépôt — car le dépôt n’est jamais là où l’eau se trouve.' },
    'One bag. Figures are typical values for the standard unit; the business unit is listed separately in the datasheet.': { nl: 'Eén zak. De cijfers zijn typische waarden voor de standaardeenheid; de bedrijfseenheid staat apart in het gegevensblad.', de: 'Ein Sack. Die Werte gelten typischerweise für die Standardeinheit; die Geschäftseinheit ist separat im Datenblatt aufgeführt.', fr: 'Un sac. Les chiffres sont des valeurs typiques pour l’unité standard ; l’unité professionnelle est détaillée séparément dans la fiche technique.' },
    'Dry weight': { nl: 'Drooggewicht', de: 'Trockengewicht', fr: 'Poids sec' }, 'Weight, activated': { nl: 'Gewicht, geactiveerd', de: 'Gewicht, aktiviert', fr: 'Poids, activé' }, 'Dry dimensions': { nl: 'Droge afmetingen', de: 'Trockene Maße', fr: 'Dimensions sèches' }, 'Activated dimensions': { nl: 'Geactiveerde afmetingen', de: 'Aktivierte Maße', fr: 'Dimensions activées' }, 'Activation time': { nl: 'Activeringstijd', de: 'Aktivierungszeit', fr: 'Temps d’activation' }, 'Absorbent core': { nl: 'Absorberende kern', de: 'Saugfähiger Kern', fr: 'Cœur absorbant' }, 'Outer': { nl: 'Buitenlaag', de: 'Außenmaterial', fr: 'Enveloppe extérieure' }, 'Working range': { nl: 'Temperatuurbereik', de: 'Einsatzbereich', fr: 'Plage d’utilisation' }, 'Disposal': { nl: 'Afvoer', de: 'Entsorgung', fr: 'Élimination' }, 'Salt water': { nl: 'Zout water', de: 'Salzwasser', fr: 'Eau salée' }, 'Reuse': { nl: 'Hergebruik', de: 'Wiederverwendung', fr: 'Réutilisation' },
    'Cross-linked sodium polyacrylate': { nl: 'Verknoopt natriumpolyacrylaat', de: 'Vernetztes Natriumpolyacrylat', fr: 'Polyacrylate de sodium réticulé' }, 'Woven polypropylene, UV-stabilised': { nl: 'Geweven polypropyleen, UV-gestabiliseerd', de: 'Gewebtes Polypropylen, UV-stabilisiert', fr: 'Polypropylène tissé, stabilisé aux UV' }, '10 years, sealed and dry': { nl: '10 jaar, ongeopend en droog', de: '10 Jahre, versiegelt und trocken', fr: '10 ans, scellé et au sec' }, 'Air-dries, then general waste': { nl: 'Luchtdrogen, daarna restafval', de: 'Lufttrocknen, danach Restmüll', fr: 'Séchage à l’air, puis déchets ménagers' }, 'Reduced swell — use one extra layer': { nl: 'Minder zwelling — gebruik één extra laag', de: 'Geringere Quellung – eine zusätzliche Lage verwenden', fr: 'Gonflement réduit — utiliser une couche supplémentaire' }, 'Single flood event; dry storage between drills': { nl: 'Eenmalige overstroming; droog bewaren tussen oefeningen', de: 'Ein Hochwasserereignis; trocken lagern zwischen Übungen', fr: 'Un seul épisode d’inondation ; stockage au sec entre les exercices' }, '3–5 min in fresh water': { nl: '3–5 min in zoet water', de: '3–5 Min. in Süßwasser', fr: '3–5 min dans l’eau douce' },
    'Work out what you need.': { nl: 'Bereken wat je nodig hebt.', de: 'Finden Sie heraus, was Sie brauchen.', fr: 'Calculez ce qu’il vous faut.' }, 'It\'s usually less than you think.': { nl: 'Het is meestal minder dan je denkt.', de: 'Es ist meist weniger als gedacht.', fr: 'C’est généralement moins que vous ne le pensez.' }, 'Every pack ships flat within two working days. Prices include VAT. If your frontage is awkward, send us a photo and we\'ll size it with you.': { nl: 'Elk pakket wordt binnen twee werkdagen plat geleverd. Prijzen zijn inclusief btw. Is je gevel lastig, stuur ons dan een foto en we bepalen samen de juiste maat.', de: 'Jedes Paket wird innerhalb von zwei Werktagen flach geliefert. Die Preise enthalten die Mehrwertsteuer. Bei einer schwierigen Front schicken Sie uns ein Foto und wir helfen bei der Größenbestimmung.', fr: 'Chaque pack est expédié à plat sous deux jours ouvrés. Les prix incluent la TVA. Si votre façade est complexe, envoyez-nous une photo et nous vous aiderons à choisir la taille.' },
    'Total width to protect (metres)': { nl: 'Totale te beschermen breedte (meter)', de: 'Zu schützende Gesamtbreite (Meter)', fr: 'Largeur totale à protéger (mètres)' }, 'Height you want to hold back': { nl: 'Hoogte die je wilt tegenhouden', de: 'Zurückzuhaltende Höhe', fr: 'Hauteur à retenir' }, 'Use this in my order': { nl: 'Gebruik dit voor mijn bestelling', de: 'Für meine Bestellung verwenden', fr: 'Utiliser pour ma commande' }, 'Anything we should know? (optional)': { nl: 'Moeten we nog iets weten? (optioneel)', de: 'Gibt es noch etwas zu wissen? (optional)', fr: 'Une information à nous communiquer ? (facultatif)' }, 'Mock-up only. No payment details are requested and no order is placed.': { nl: 'Alleen een demo. Er worden geen betaalgegevens gevraagd en er wordt geen bestelling geplaatst.', de: 'Nur eine Demo. Es werden keine Zahlungsdaten abgefragt und keine Bestellung aufgegeben.', fr: 'Démonstration uniquement. Aucun paiement n’est demandé et aucune commande n’est passée.' }, 'Ships flat in 2 working days': { nl: 'Plat geleverd binnen 2 werkdagen', de: 'Flachversand innerhalb von 2 Werktagen', fr: 'Expédié à plat sous 2 jours ouvrés' }, '60-day returns on unopened packs': { nl: '60 dagen retour voor ongeopende pakketten', de: '60 Tage Rückgabe für ungeöffnete Pakete', fr: 'Retour sous 60 jours pour les packs non ouverts' }, '10-year shelf-life guarantee': { nl: '10 jaar houdbaarheid gegarandeerd', de: '10 Jahre Haltbarkeitsgarantie', fr: 'Garantie de conservation de 10 ans' }, 'Free sizing advice from a photo': { nl: 'Gratis maatadvies op basis van een foto', de: 'Kostenlose Größenberatung anhand eines Fotos', fr: 'Conseils de dimensionnement gratuits sur photo' },
    'That\'s it — you\'re covered.': { nl: 'Dat is alles — je bent beschermd.', de: 'Das war’s – Sie sind geschützt.', fr: 'C’est tout — vous êtes protégé.' }, 'Your pack is on its way.': { nl: 'Je pakket is onderweg.', de: 'Ihr Paket ist unterwegs.', fr: 'Votre pack est en route.' }, 'This is a design mock-up. Nothing was charged, and nothing will be shipped.': { nl: 'Dit is een ontwerp-demo. Er is niets in rekening gebracht en er wordt niets verzonden.', de: 'Dies ist eine Design-Demo. Es wurde nichts berechnet und nichts wird versendet.', fr: 'Ceci est une maquette. Rien n’a été facturé et rien ne sera expédié.' }, 'Back to the homepage': { nl: 'Terug naar de homepage', de: 'Zur Startseite', fr: 'Retour à la page d’accueil' }, 'Start another order': { nl: 'Nieuwe bestelling starten', de: 'Neue Bestellung starten', fr: 'Commencer une nouvelle commande' }, 'Home': { nl: 'Home', de: 'Startseite', fr: 'Accueil' }, 'Homeowner · river valley': { nl: 'Huiseigenaar · rivierdal', de: 'Hausbesitzer · Flusstal', fr: 'Propriétaire · vallée fluviale' }, 'Facilities manager · retail group': { nl: 'Facilitymanager · winkelgroep', de: 'Facility Manager · Einzelhandel', fr: 'Responsable technique · groupe de magasins' }, 'Café owner · town centre': { nl: 'Caféeigenaar · stadscentrum', de: 'Cafébesitzer · Stadtzentrum', fr: 'Propriétaire de café · centre-ville' }, 'Placeholder testimonial': { nl: 'Voorbeeldtestimonial', de: 'Beispieltest', fr: 'Témoignage fictif' },
    'Flood barriers that take up no room until the day they matter.': { nl: 'Waterkeringen die geen ruimte innemen tot de dag dat ze nodig zijn.', de: 'Hochwasserschutz, der keinen Platz braucht, bis er wichtig wird.', fr: 'Des barrières anti-inondation qui ne prennent aucune place jusqu’au jour où elles comptent.' }, 'Stories': { nl: 'Ervaringen', de: 'Erfahrungen', fr: 'Témoignages' }, 'Contact': { nl: 'Contact', de: 'Kontakt', fr: 'Contact' }, 'Terms': { nl: 'Voorwaarden', de: 'Bedingungen', fr: 'Conditions' }, 'Privacy': { nl: 'Privacy', de: 'Datenschutz', fr: 'Confidentialité' }, 'Returns': { nl: 'Retourneren', de: 'Rückgabe', fr: 'Retours' }, 'design mock-up, not a live shop.': { nl: 'ontwerp-demo, geen echte winkel.', de: 'Design-Demo, kein echter Shop.', fr: 'maquette, pas une boutique active.' }, 'Figures shown are placeholders pending test data.': { nl: 'Getoonde cijfers zijn placeholders in afwachting van testdata.', de: 'Die Zahlen sind Platzhalter bis zu den Testdaten.', fr: 'Les chiffres affichés sont provisoires, en attente de données de test.' }
  });
  Object.assign(translations, {
    'One standard door, three layers high. The sensible starting point.': { nl: 'Eén standaarddeur, drie lagen hoog. Een verstandig begin.', de: 'Eine Standardtür, drei Lagen hoch. Der sinnvolle Einstieg.', fr: 'Une porte standard, trois couches. Le point de départ idéal.' },
    'Front door, back door and a garage threshold, with spares for the air bricks.': { nl: 'Voor- en achterdeur en een garagedrempel, met extra zakken voor ventilatieopeningen.', de: 'Haus- und Hintertür sowie eine Garagenschwelle, mit Ersatz für Lüftungsöffnungen.', fr: 'Porte avant, porte arrière et seuil de garage, avec des sacs de rechange pour les aérations.' },
    'Shopfronts, loading bays and lift shafts. Splits neatly across three sites.': { nl: 'Winkelpuien, laadkades en liftschachten. Netjes te verdelen over drie locaties.', de: 'Ladenfronts, Laderampen und Aufzugsschächte. Lässt sich sauber auf drei Standorte verteilen.', fr: 'Vitrines, quais de chargement et cages d’ascenseur. Se répartit facilement sur trois sites.' },
    '6 bags': { nl: '6 zakken', de: '6 Säcke', fr: '6 sacs' }, '20 bags': { nl: '20 zakken', de: '20 Säcke', fr: '20 sacs' }, '60 bags': { nl: '60 zakken', de: '60 Säcke', fr: '60 sacs' },
    'How high a barrier can I actually build?': { nl: 'Hoe hoog kan ik werkelijk een barrière bouwen?', de: 'Wie hoch kann ich tatsächlich eine Barriere bauen?', fr: 'Quelle hauteur puis-je réellement atteindre ?' },
    'Each activated bag is about 11 cm high. Stacked in overlapping layers, three layers give roughly 30 cm of protection, which covers the large majority of doorway flooding. Beyond about 50 cm you want an engineered barrier, and we\'ll tell you so rather than sell you more bags.': { nl: 'Elke geactiveerde zak is ongeveer 11 cm hoog. In overlappende lagen geven drie lagen ongeveer 30 cm bescherming, genoeg voor de meeste overstromingen bij deuren. Boven ongeveer 50 cm heb je een ontworpen barrière nodig; dat zullen we eerlijk zeggen in plaats van meer zakken te verkopen.', de: 'Jeder aktivierte Sack ist etwa 11 cm hoch. Drei überlappende Lagen bieten ungefähr 30 cm Schutz und reichen für die meisten Überflutungen an Türen. Oberhalb von etwa 50 cm brauchen Sie eine geplante Barriere – das sagen wir Ihnen, statt einfach mehr Säcke zu verkaufen.', fr: 'Chaque sac activé mesure environ 11 cm de haut. Empilés en couches qui se chevauchent, trois couches offrent environ 30 cm de protection, ce qui couvre la plupart des inondations de portes. Au-delà d’environ 50 cm, il faut une barrière conçue à cet effet, et nous vous le dirons plutôt que de vous vendre plus de sacs.' },
    'They divert and slow it. Like any sandbag-style barrier, a small amount will seep through and around; the point is to keep the bulk of it out of your rooms and buy you hours. Laying a plastic sheet under the first layer improves the seal considerably.': { nl: 'Ze leiden water om en vertragen het. Net als bij elke zandzakbarrière kan een kleine hoeveelheid erdoor en omheen sijpelen; het doel is het grootste deel uit je ruimtes te houden en tijd te winnen. Een plastic folie onder de eerste laag verbetert de afdichting aanzienlijk.', de: 'Sie leiten Wasser um und verlangsamen es. Wie bei jeder Sandsackbarriere kann eine kleine Menge durch und darum herum sickern; wichtig ist, den Großteil aus den Räumen fernzuhalten und Zeit zu gewinnen. Eine Plastikfolie unter der ersten Lage verbessert die Abdichtung deutlich.', fr: 'Ils détournent et ralentissent l’eau. Comme toute barrière de sacs de sable, une petite quantité peut passer à travers et autour ; le but est de garder l’essentiel hors des pièces et de gagner du temps. Une bâche plastique sous la première couche améliore fortement l’étanchéité.' },
    'That\'s the useful part. The bags activate on contact with the incoming water, so laying them dry in the path of a rising flood still works. You don\'t need a hose, and you don\'t need to have been early.': { nl: 'Dat is juist het handige. De zakken activeren bij contact met binnenstromend water, dus droog neerleggen op het pad van stijgend water werkt ook. Je hebt geen slang nodig en je hoefde niet vroeg te zijn.', de: 'Das ist der entscheidende Vorteil. Die Säcke aktivieren sich beim Kontakt mit einströmendem Wasser, daher funktioniert es auch, sie trocken in den Weg des steigenden Wassers zu legen. Sie brauchen keinen Schlauch und müssen nicht früh dran gewesen sein.', fr: 'C’est tout l’intérêt. Les sacs s’activent au contact de l’eau qui arrive, donc les poser secs sur le passage d’une crue montante fonctionne aussi. Vous n’avez pas besoin d’un tuyau ni d’avoir été prévoyant.' },
    'Treat them as single-event. After a flood the bags have absorbed whatever the water was carrying, so they go out with general waste once dried. Unused bags kept dry stay ready for ten years.': { nl: 'Beschouw ze als eenmalig gebruik. Na een overstroming hebben de zakken opgenomen wat het water bevatte, dus na het drogen gaan ze bij het gewone afval. Ongebruikte, droge zakken blijven tien jaar klaar voor gebruik.', de: 'Behandeln Sie sie als Einwegprodukt. Nach einer Überschwemmung haben die Säcke alles aufgenommen, was das Wasser mitführte; getrocknet kommen sie in den Restmüll. Unbenutzte, trocken gelagerte Säcke bleiben zehn Jahre einsatzbereit.', fr: 'Considérez-les comme un usage unique. Après une inondation, les sacs ont absorbé ce que l’eau transportait et vont donc, une fois secs, avec les déchets ménagers. Les sacs inutilisés conservés au sec restent prêts pendant dix ans.' },
    'The core is the same non-toxic super-absorbent polymer used in horticulture and hygiene products. It isn\'t food, but it isn\'t hazardous either. Follow local rules for disposal after contaminated floodwater.': { nl: 'De kern is hetzelfde niet-giftige superabsorberende polymeer dat in tuinbouw- en hygiëneproducten wordt gebruikt. Het is geen voedsel, maar ook niet gevaarlijk. Volg lokale regels voor afvoer na vervuild overstromingswater.', de: 'Der Kern besteht aus demselben ungiftigen, superabsorbierenden Polymer wie in Gartenbau- und Hygieneprodukten. Es ist kein Lebensmittel, aber auch nicht gefährlich. Befolgen Sie nach verunreinigtem Hochwasser die örtlichen Entsorgungsvorschriften.', fr: 'Le cœur est le même polymère superabsorbant non toxique que celui utilisé en horticulture et dans les produits d’hygiène. Ce n’est pas un aliment, mais ce n’est pas dangereux non plus. Respectez les règles locales après une inondation contaminée.' },
    'Roughly two bags per metre of opening, per layer. A 1 m front door at three layers is six bags. There\'s a calculator on the buy page that does this for you, and you can send us a photo of your frontage if you\'d rather we did it.': { nl: 'Reken op ongeveer twee zakken per meter opening, per laag. Een voordeur van 1 m met drie lagen vraagt zes zakken. Op de bestelpagina staat een calculator die dit voor je uitrekent. Je kunt ook een foto sturen als je wilt dat wij het doen.', de: 'Rechnen Sie mit etwa zwei Säcken pro Meter Öffnung und Lage. Eine 1 m breite Haustür mit drei Lagen benötigt sechs Säcke. Auf der Bestellseite gibt es einen Rechner, der das für Sie erledigt. Sie können uns auch ein Foto schicken, wenn wir es berechnen sollen.', fr: 'Comptez environ deux sacs par mètre d’ouverture et par couche. Une porte de 1 m avec trois couches nécessite six sacs. Le calculateur de la page de commande fait le calcul pour vous ; vous pouvez aussi nous envoyer une photo pour que nous le fassions.' },
    'Packs ship flat within two working days. Choose a size, or tell us your frontage and we\'ll work it out with you.': { nl: 'Pakketten worden binnen twee werkdagen plat verzonden. Kies een maat of vertel ons over je gevel en we rekenen het samen uit.', de: 'Pakete werden innerhalb von zwei Werktagen flach versendet. Wählen Sie eine Größe oder teilen Sie uns Ihre Front mit, dann berechnen wir es gemeinsam.', fr: 'Les packs sont expédiés à plat sous deux jours ouvrés. Choisissez une taille ou décrivez-nous votre façade et nous la calculerons avec vous.' },
    'We\'d been flooded twice. The third time we were ready in ten minutes and I slept through the night.': { nl: 'We waren twee keer overstroomd. De derde keer waren we in tien minuten klaar en sliep ik de hele nacht.', de: 'Wir waren zweimal überflutet worden. Beim dritten Mal waren wir in zehn Minuten bereit und ich schlief die ganze Nacht.', fr: 'Nous avions été inondés deux fois. La troisième fois, nous étions prêts en dix minutes et j’ai dormi toute la nuit.' },
    'Storage was the whole objection. Now every one of our sites holds its own kit in a cupboard.': { nl: 'Opslag was het hele probleem. Nu heeft elke locatie zijn eigen pakket in een kast.', de: 'Der Lagerplatz war das ganze Problem. Jetzt hat jeder unserer Standorte sein eigenes Set in einem Schrank.', fr: 'Le stockage était le principal obstacle. Maintenant, chacun de nos sites garde son kit dans un placard.' },
    'It\'s the first thing I\'ve bought that made the worry smaller instead of bigger.': { nl: 'Het is het eerste dat ik heb gekocht waardoor de zorgen kleiner in plaats van groter werden.', de: 'Es ist das erste, was ich gekauft habe und das die Sorge kleiner statt größer gemacht hat.', fr: 'C’est la première chose que j’ai achetée qui a réduit l’inquiétude au lieu de l’augmenter.' }
  });
  Object.assign(translations, {
    'Storage space': { nl: 'Opslagruimte', de: 'Lagerplatz', fr: 'Espace de stockage' }, 'Weight in storage': { nl: 'Gewicht in opslag', de: 'Gewicht gelagert', fr: 'Poids stocké' }, 'Needed beforehand': { nl: 'Vooraf nodig', de: 'Vorher benötigt', fr: 'Nécessaire avant' }, 'Time to protect one door': { nl: 'Tijd voor één deur', de: 'Zeit für eine Tür', fr: 'Temps pour une porte' }, '0.47 m³ — a euro pallet': { nl: '0,47 m³ — een europallet', de: '0,47 m³ – eine Europalette', fr: '0,47 m³ — une europalette' }, '420 kg (with sand)': { nl: '420 kg (met zand)', de: '420 kg (mit Sand)', fr: '420 kg (avec sable)' }, 'Sand, shovel, sacks': { nl: 'Zand, schep, zakken', de: 'Sand, Schaufel, Säcke', fr: 'Sable, pelle, sacs' }, '~45 min, two people': { nl: '~45 min, twee personen', de: '~45 Min., zwei Personen', fr: '~45 min, deux personnes' }, '0.0064 m³ — a shoebox': { nl: '0,0064 m³ — een schoenendoos', de: '0,0064 m³ – ein Schuhkarton', fr: '0,0064 m³ — une boîte à chaussures' }, '8.4 kg': { nl: '8,4 kg', de: '8,4 kg', fr: '8,4 kg' }, 'Nothing but water': { nl: 'Alleen water', de: 'Nichts außer Wasser', fr: 'Rien d’autre que de l’eau' }, '~6 min, one person': { nl: '~6 min, één persoon', de: '~6 Min., eine Person', fr: '~6 min, une personne' },
    'Language': { nl: 'Taal', de: 'Sprache', fr: 'Langue' }, 'Open menu': { nl: 'Menu openen', de: 'Menü öffnen', fr: 'Ouvrir le menu' }, 'Choose a pack': { nl: 'Kies een pakket', de: 'Paket auswählen', fr: 'Choisir un pack' }, 'Compare storage': { nl: 'Opslag vergelijken', de: 'Lagerplatz vergleichen', fr: 'Comparer le stockage' }, 'Cross-section of a doorway: floodwater outside is held back by three stacked layers of Waterwal bags, and the floor inside stays dry.': { nl: 'Dwarsdoorsnede van een deuropening: overstromingswater buiten wordt tegengehouden door drie gestapelde lagen Waterwal-zakken en de vloer binnen blijft droog.', de: 'Querschnitt einer Türöffnung: Hochwasser wird außen von drei gestapelten Lagen Waterwal-Säcken aufgehalten, der Boden innen bleibt trocken.', fr: 'Coupe d’une porte : l’eau d’inondation est retenue par trois couches de sacs Waterwal et le sol intérieur reste sec.' }
  });
  var normalizeText = function (text) {
    return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  };
  var language = localStorage.getItem('waterwal-language') || 'en';
  var translate = function (text) {
    var key = normalizeText(text);
    return language === 'en' || !translations[key] ? text : (translations[key][language] || text);
  };
  var translateStaticText = function () {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = normalizeText(node.nodeValue);
      if (value && translations[value]) node.nodeValue = translate(value);
    }
    $$('[aria-label], [placeholder]').forEach(function (el) {
      ['aria-label', 'placeholder'].forEach(function (attribute) {
        var value = el.getAttribute(attribute);
        if (value && translations[normalizeText(value)]) el.setAttribute(attribute, translate(value));
      });
    });
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
    var title = document.title;
    var titleTranslations = {
      'Waterwal — Flood protection that lives in a drawer': {
        nl: 'Waterwal — Waterbescherming in een lade', de: 'Waterwal — Hochwasserschutz in einer Schublade', fr: 'Waterwal — Protection contre les inondations dans un tiroir'
      },
      'Buy Waterwal — packs & pricing': {
        nl: 'Waterwal kopen — pakketten en prijzen', de: 'Waterwal kaufen — Pakete und Preise', fr: 'Acheter Waterwal — packs et tarifs'
      }
    };
    if (titleTranslations[title] && language !== 'en') document.title = titleTranslations[title][language];
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
          '<span class="tier-desc" style="display:block">' + translate(t.desc) + '</span>' +
          '<span class="tier-meta">' + t.meta.map(function (m) { return '<span>' + translate(m) + '</span>'; }).join('') + '</span>' +
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
    var bagsLabel = language === 'nl' ? 'Je hebt ongeveer ' : language === 'de' ? 'Sie benötigen etwa ' : language === 'fr' ? 'Il vous faut environ ' : 'You\'d want about ';
    var bagsWord = language === 'nl' ? ' zakken ' : language === 'de' ? ' Säcke ' : language === 'fr' ? ' sacs ' : ' bags ';
    calcBags.textContent = bags;
    $('.calc-out .r').firstChild.nodeValue = bagsLabel;
    calcBags.nextSibling.nodeValue = bagsWord;
    var layerText = language === 'nl' ? (layers > 1 ? 'lagen' : 'laag') : language === 'de' ? (layers > 1 ? 'Lagen' : 'Lage') : language === 'fr' ? (layers > 1 ? 'couches' : 'couche') : (layers > 1 ? 'layers' : 'layer');
    var acrossText = language === 'nl' ? 'naast elkaar' : language === 'de' ? 'nebeneinander' : language === 'fr' ? 'côte à côte' : 'across';
    var thatText = language === 'nl' ? 'Dat is' : language === 'de' ? 'Das sind' : language === 'fr' ? 'Soit' : 'That’s';
    calcNote.innerHTML = '&mdash; ' + perLayer + ' ' + acrossText + ' &times; ' + layers + ' ' + layerText + '. ' + thatText + ' ' + bestPacks + ' &times; ' + translate(bestFit.name) + '.';
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
    var packWord = language === 'nl' ? 'pakket' : language === 'de' ? 'Paket' : language === 'fr' ? 'pack' : 'pack';
    var packPlural = language === 'nl' ? 'pakketten' : language === 'de' ? 'Pakete' : language === 'fr' ? 'packs' : 'packs';
    var bagWord = language === 'nl' ? 'zakken in totaal' : language === 'de' ? 'Säcke insgesamt' : language === 'fr' ? 'sacs au total' : 'bags in total';
    qtyNote.textContent = state.qty + ' ' + (state.qty > 1 ? packPlural : packWord) + ' · ' + (state.tier.bags * state.qty) + ' ' + bagWord;

    sumPack.textContent = translate(state.tier.name);
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

    var confirmText = {
      en: 'Thanks, {name}. {qty} × {pack} ({bags} bags) would be on its way to you, flat-packed, within two working days.',
      nl: 'Bedankt, {name}. {qty} × {pack} ({bags} zakken) zou binnen twee werkdagen plat verpakt naar je onderweg zijn.',
      de: 'Danke, {name}. {qty} × {pack} ({bags} Säcke) wären innerhalb von zwei Werktagen flach verpackt unterwegs zu Ihnen.',
      fr: 'Merci, {name}. {qty} × {pack} ({bags} sacs) seraient expédiés à plat sous deux jours ouvrés.'
    }[language];
    $('#confirmDetail').textContent = confirmText.replace('{name}', first).replace('{qty}', state.qty).replace('{pack}', translate(state.tier.name)).replace('{bags}', state.tier.bags * state.qty);
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
