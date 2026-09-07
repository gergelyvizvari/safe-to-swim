import { outlookMessages } from './outlookMessages.js'

export const DEFAULT_LANGUAGE = 'en'

export const LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en-GB' },
  { code: 'fr', label: 'Français', locale: 'fr-FR' },
  { code: 'it', label: 'Italiano', locale: 'it-IT' },
  { code: 'es', label: 'Español', locale: 'es-ES' },
  { code: 'hu', label: 'Magyar', locale: 'hu-HU' },
]

const translations = {
  en: {
    header: { home: 'Safe to Swim home', location: 'Coastal location', chooseLocation: 'Choose a European bathing site', locate: 'Use my current location', locating: 'Finding the nearest beach…', locationFound: 'Nearest supported beach: {location}', locationDenied: 'Location access was not allowed.', locationError: 'Your location could not be found.', refresh: 'Refresh data', language: 'Language' },
    locationPicker: { timeZone: 'Times in your time zone: {zone}', title: 'Choose a beach', subtitle: 'Search {count} European bathing sites', searchLabel: 'Search beaches', searchPlaceholder: 'Search beach, town or area…', useLocation: 'Find the nearest beach', current: 'Selected beach', suggested: 'Popular beaches', results: '{count} results', empty: 'No beaches match this search.', refine: 'Showing the first {count} results. Refine your search to narrow it down.', selected: 'Selected', close: 'Close beach picker', viewLabel: 'Choose beach view', listView: 'List', mapView: 'Map', mapAria: 'Map of European bathing sites', mapLoading: 'Loading map…', mapEmpty: 'No beaches match this search.', resetMap: 'Europe', selectMapLocation: 'Select beach', clusterLabel: '{count} beaches — zoom in', previewLoading: 'Loading conditions…', previewUnavailable: 'Preview unavailable', previewAria: 'Beach condition preview', distanceAway: '{distance} km away' },
    explorer: {
      eyebrow: 'European bathing waters', title: 'Explore the whole coast', count: '{count} official bathing sites', searchLabel: 'Search bathing sites', searchPlaceholder: 'Search beach, town or area…', filterLabel: 'Filter by nation', results: '{count} matching locations', empty: 'No bathing sites match this search.', refine: 'Refine your search to see more results.', reset: 'Europe', mapLabel: 'Map of official European bathing waters', classification: 'Water quality: {value}', modelLocation: 'Model conditions available', selectedLocation: 'Selected location', excellent: 'Excellent', good: 'Good', sufficient: 'Sufficient', poor: 'Poor',
      nations: { all: 'All', england: 'England', wales: 'Wales', scotland: 'Scotland', ni: 'Northern Ireland' },
    },
    waterQuality: {
      eyebrow: 'Official monitoring', title: 'Bathing water quality', official: 'Official data', annual: '{year} annual classification', monitoringSite: 'Monitoring site', nearest: 'Nearest official site · {distance} km away', provider: 'Data provider', snapshot: 'Snapshot updated {date}', shortTerm: 'Short-term pollution risk', riskNormal: 'No increased risk is shown in the current official feed.', riskElevated: 'The official feed indicates an increased short-term risk.', noPrediction: 'No short-term prediction is included for this site.', afterRain: 'After heavy rain', rainAdvice: 'Water quality at this site can be affected by rainfall. Check the latest official notice before swimming.', note: 'Annual classifications describe monitored water quality, not wave, current or on-site safety. Follow current warnings and local signs.', openSource: 'Open official record',
      shortTitle: 'Water quality', annualShort: 'Annual water quality', summaryNormal: 'No increased short-term risk shown', summaryElevated: 'Increased short-term risk shown', summaryAnnual: 'Annual official classification',
      classes: { excellent: 'Excellent', good: 'Good', sufficient: 'Sufficient', poor: 'Poor', unclassified: 'Unclassified' },
    },
    safety: {
      unknownEyebrow: 'Data unavailable', unknownTitle: 'Check conditions on site.', unknownDescription: 'The marine model has no reliable data for this location and time, so no swim rating is shown.',
      dangerEyebrow: 'Not recommended', dangerTitle: 'Stay on shore.', dangerDescription: 'Because of {reasons}, swimming is not recommended. Follow local warnings.',
      cautionEyebrow: 'Use extra caution', cautionTitle: 'Experienced swimmers only.', cautionDescription: 'Because of {reasons}, conditions may become tiring quickly. Do not swim alone.',
      goodEyebrow: 'Favourable conditions', goodTitle: 'Wind and waves look favourable.', goodDescription: 'Wind and waves are moderate. Still check the flags on the beach.',
      waveReason: '{value} m strong waves', gustReason: '{value} mph gusts', offshoreReason: 'offshore wind',
      updatedAt: 'Updated at {time}', updating: 'Updating…', liveData: 'Live model data', partialData: 'Partial model data', unavailableData: 'Live data unavailable', sampleData: 'Sample data', wave: 'Wave', wind: 'Wind', gusts: 'Wind gusts',
    },
    weather: { clear: 'Clear sky', partlyCloudy: 'Partly cloudy', fog: 'Foggy', rain: 'Rain', drizzle: 'Drizzle', showers: 'Showers', storm: 'Thunderstorms' },
    conditions: {
      aria: 'Current sea conditions', selectedAria: 'Sea conditions forecast for {time}', waveHeight: 'Wave height', period: '{value} s period', wind: 'Wind and gusts', gusts: 'Gusts: {value} mph', from: 'From {direction}',
      seaLevel: 'Sea level', rising: 'Sea level is rising', falling: 'Sea level is falling', slack: 'Sea level is changing very little', unavailable: 'Data unavailable', waterTemperature: 'Water temperature', air: '{value}°C air', wetsuit: 'Wetsuit recommended',
    },
    forecast: {
      eyebrow: 'Next hours', title: 'When might it improve?', aria: 'Hourly forecast', now: 'Now', today: 'Today', tomorrow: 'Tomorrow', day: 'Day', night: 'Night', high: 'High', medium: 'Medium', mild: 'Mild',
      note: 'Even a greener time window does not replace checking the beach flags and currents.',
    },
    decision: {
      eyebrow: 'Three-day swim outlook', title: 'When might it feel best?', hint: 'Choose a day and time to compare conditions', aria: 'Choose a forecast time', daysAria: 'Choose a forecast day', selectedAt: 'Forecast for {time}', reasonDetails: '{time}: {reason}',
      levels: { good: 'Favourable', caution: 'Caution', danger: 'Avoid', unknown: 'No data' }, change: { now: 'Conditions right now', better: 'Looks better than now', worse: 'More challenging than now', mixed: 'Mixed changes', stable: 'Similar to now', unknown: 'No reliable comparison' },
      reasons: { good: 'Favourable because waves and gusts are low and the wind is not blowing offshore.', goodUnknown: 'Favourable because waves and gusts are low; check the wind direction on site.', caution: 'Caution because of {reasons}.', danger: 'Avoid swimming because of {reasons}.', unknown: 'No reliable marine model data is available for this time.' },
      wind: { offshore: 'Offshore wind', safe: 'Not offshore', unknown: 'Check on site' },
    },
    tide: {
      eyebrow: 'Tides', title: 'Next turning points', high: 'High tide', low: 'Low tide', towardHigh: 'Rising tide', towardLow: 'Falling tide', nearTurn: 'Near turning point',
      rising: 'Sea level is rising', falling: 'Sea level is falling', slack: 'Sea level is changing very little', unavailable: 'Tide data unavailable', currentLevel: 'Current model level', modelLevel: 'Technical model level', eventsAria: 'Next high and low tides', today: 'Today', tomorrow: 'Tomorrow', nextTurnSummary: '{event} in {duration}', durationHoursMinutes: '{hours} hr {minutes} min', durationHours: '{hours} hr', durationMinutes: '{minutes} min',
      note: 'Open-Meteo · Turning times estimated from hourly sea levels on an 8 km model grid. Coastal accuracy is limited; not for navigation.', moreTimes: 'More tide times',
    },
    webcam: {
      south: 'South camera', north: 'North camera', eyebrow: 'Live beach view', title: '{location} camera', verified: 'Verified source', selector: 'Select camera', load: 'Load live view',
      consent: 'The player connects to the external provider only after you click.', open: 'Live camera available', external: 'This provider shows the live image on its own website.', openAction: 'Open live camera', unavailableTitle: 'No verified nearby camera', unavailable: 'We only show cameras whose location and live source we could verify.', note: 'Camera images are for information only and can go offline temporarily. Always check the beach itself.', source: 'Source: {name}', nearbySource: '{name} · {distance} km away',
    },
    details: { eyebrow: 'More information', title: 'Detailed conditions and maps', summary: 'Wind, temperature, safety checks and European coast map' },
    checklist: {
      eyebrow: 'Before you enter', title: '3 quick checks', flagTitle: 'Check the beach flag', flagText: 'Never enter the water when a red flag is flying.', onSite: 'On site',
      windTitle: 'Check the wind direction', windOffshore: 'The wind may be blowing offshore.', windSafe: 'The wind is not blowing directly offshore.', windUnknown: 'Check the local shoreline orientation and wind direction on site.', offshore: 'Offshore', okay: 'OK',
      beachTitle: 'Check local beach hazards', beachText: 'Check the entry, exit, currents and warning signs before entering the water.', elevated: 'Elevated risk', moderate: 'Moderate', unavailable: 'No model data', lifeguard: 'Find a lifeguarded beach',
    },
    notice: { unavailable: 'The live data source is unavailable, so no swim rating is shown.' },
    disclaimer: { important: 'Important:', text: 'This is model-based guidance, not an official safety clearance. Always follow the local lifeguard information shown on site.', data: 'Data: Open-Meteo' },
    support: { open: 'Support Safe to Swim', title: 'Enjoying Safe to Swim?', text: 'Safe to Swim is free and independent. If it helped you plan a swim, you can optionally buy Gergely a beer.', optional: 'No pressure — the app remains free for everyone.', action: 'Buy me a beer', close: 'Close support panel' },
    install: { open: 'Install Safe to Swim', title: 'Add Safe to Swim to your Home Screen', description: 'Open it like an app without searching for the website.', iosShare: 'In Safari, tap the Share button.', iosAdd: 'Choose Add to Home Screen.', iosConfirm: 'Tap Add in the top-right corner.', browserMenu: 'Open your browser menu.', browserInstall: 'Choose Install app or Add to Home screen.', browserConfirm: 'Confirm the installation.', done: 'Got it', close: 'Close installation guide' },
    footer: { tagline: 'More confident decisions before entering the water.', back: 'Back to top' },
    map: {
      title: 'Detailed coastline map', reset: 'Full coastline', activeZones: '{count} active RNLI zones', notRecommended: 'Not recommended for this time', checkOnSite: 'Check conditions on site',
      statusNote: 'Zone colours show patrol status; current model risk is shown above, and flags on site take priority.', modelStatusNote: 'The circle shows current model risk; check conditions on site.', layers: 'Map layers', zones: 'Swimming and patrol zones', hazards: 'Piers and {count} groynes', incidents: '2022 incident layer',
      region: 'Interactive map of the Brighton and Hove coastline', legend: 'Legend', activeZone: 'Active RNLI zone', unguarded: 'Unpatrolled coast', physicalHazard: 'Physical hazard', modelPoint: 'Marine model location', incidentShare: '2022 incident share',
      unguardedTitle: 'Unpatrolled coastline', unguardedDetail: 'Active supervision is not guaranteed along the yellow line. Check the flags on site.',
      patrolActive: 'Within RNLI patrol hours. Swim only between the red-and-yellow flags on site.', patrolInactive: 'Patrol is not active at this time; treat this as an unpatrolled section of coast.', patrolUnknown: 'No verified patrol schedule is available for this date; check on site.', activePost: 'active RNLI post', inactivePost: 'patrol inactive at this time', unknownPost: 'patrol schedule unavailable',
      groyne: 'Groyne {number} – do not swim directly beside it', westPierDetail: 'Pier structure and local currents – do not swim near it.', palacePierDetail: 'Pier structure and local currents – do not swim under or beside it.', marina: 'Brighton Marina entrance', marinaDetail: 'Boat traffic area – not suitable for swimming.',
      incidentTooltip: '2022: {value} of incidents – {place}', incidentDetail: '{value} share of serious and non-life-threatening incidents recorded at patrolled locations in 2022. This is not an individual accident point.',
      modelLabel: 'Marine model point', modelTooltip: 'Sampling location for waves, water temperature and sea-level model data.', modelOnly: 'This location currently shows model conditions only. Detailed lifeguard zones, hazards and official water quality are added separately as verified data becomes available.',
      footnote: 'RNLI beach strips appear as areas only during active patrol hours; otherwise a dot marks the post. Daily flag positions may change. The incident layer is hidden by default; the red layer highlights both piers, the marina entrance and the {count} groynes currently mapped in OpenStreetMap.',
      postsSource: 'Post map', safetySource: 'Safety source', incidentSource: 'Incident data',
    },
  },
  fr: {
    header: { home: 'Accueil Safe to Swim', location: 'Lieu côtier', chooseLocation: 'Choisir un lieu côtier en Europe', locate: 'Utiliser ma position actuelle', locating: 'Recherche de la plage la plus proche…', locationFound: 'Plage disponible la plus proche : {location}', locationDenied: 'L’accès à la position n’a pas été autorisé.', locationError: 'Votre position n’a pas pu être déterminée.', refresh: 'Actualiser les données', language: 'Langue' },
    locationPicker: { timeZone: 'Heures dans votre fuseau : {zone}', title: 'Choisir une plage', subtitle: 'Recherchez parmi {count} lieux de baignade européens', searchLabel: 'Rechercher une plage', searchPlaceholder: 'Plage, ville ou région…', useLocation: 'Trouver la plage la plus proche', current: 'Plage sélectionnée', suggested: 'Plages populaires', results: '{count} résultats', empty: 'Aucune plage ne correspond à cette recherche.', refine: 'Les {count} premiers résultats sont affichés. Précisez votre recherche.', selected: 'Sélectionnée', close: 'Fermer le sélecteur de plage', viewLabel: 'Choisir la vue des plages', listView: 'Liste', mapView: 'Carte', mapAria: 'Carte des lieux de baignade européens', mapLoading: 'Chargement de la carte…', mapEmpty: 'Aucune plage ne correspond à cette recherche.', resetMap: 'Toute l’Europe', selectMapLocation: 'Choisir cette plage', clusterLabel: '{count} plages — agrandir', previewLoading: 'Chargement des conditions…', previewUnavailable: 'Aperçu indisponible', previewAria: 'Aperçu des conditions de baignade', distanceAway: 'à {distance} km' },
    explorer: {
      eyebrow: 'Eaux de baignade côtières', title: 'Explorez toute la côte', count: '{count} sites côtiers vérifiés', searchLabel: 'Rechercher une plage', searchPlaceholder: 'Plage, ville ou région…', filterLabel: 'Filtrer par nation', results: '{count} lieux correspondants', empty: 'Aucun lieu côtier ne correspond.', refine: 'Affinez la recherche pour afficher plus de résultats.', reset: 'Toute l’Europe', mapLabel: 'Carte des eaux de baignade côtières officielles', classification: 'Qualité de l’eau : {value}', modelLocation: 'Conditions du modèle disponibles', selectedLocation: 'Lieu sélectionné', excellent: 'Excellent', good: 'Bon', sufficient: 'Suffisant', poor: 'Mauvais',
      nations: { all: 'Tous', england: 'Angleterre', wales: 'Pays de Galles', scotland: 'Écosse', ni: 'Irlande du Nord' },
    },
    waterQuality: {
      eyebrow: 'Surveillance officielle', title: 'Qualité de l’eau de baignade', official: 'Données officielles', annual: 'Classement annuel {year}', monitoringSite: 'Site de contrôle', nearest: 'Site officiel le plus proche · {distance} km', provider: 'Fournisseur', snapshot: 'Instantané mis à jour le {date}', shortTerm: 'Risque de pollution à court terme', riskNormal: 'Aucun risque accru dans le flux officiel actuel.', riskElevated: 'Le flux officiel indique un risque accru à court terme.', noPrediction: 'Aucune prévision à court terme n’est incluse pour ce site.', afterRain: 'Après de fortes pluies', rainAdvice: 'La pluie peut dégrader la qualité de l’eau. Consultez l’avis officiel avant de vous baigner.', note: 'Le classement annuel décrit la qualité mesurée, pas les vagues, courants ou dangers locaux. Suivez les alertes et panneaux.', openSource: 'Ouvrir la fiche officielle',
      shortTitle: 'Qualité de l’eau', annualShort: 'Qualité annuelle de l’eau', summaryNormal: 'Aucun risque accru à court terme', summaryElevated: 'Risque accru à court terme', summaryAnnual: 'Classement officiel annuel',
      classes: { excellent: 'Excellente', good: 'Bonne', sufficient: 'Suffisante', poor: 'Mauvaise', unclassified: 'Non classée' },
    },
    safety: {
      unknownEyebrow: 'Données indisponibles', unknownTitle: 'Vérifiez les conditions sur place.', unknownDescription: 'Le modèle marin ne fournit pas de données fiables pour ce lieu et cette heure ; aucune évaluation de baignade n’est affichée.',
      dangerEyebrow: 'Déconseillé', dangerTitle: 'Restez sur la plage.', dangerDescription: 'En raison de {reasons}, la baignade est déconseillée. Respectez les avertissements locaux.',
      cautionEyebrow: 'Prudence renforcée', cautionTitle: 'Nageurs expérimentés uniquement.', cautionDescription: 'À cause de {reasons}, les conditions peuvent fatiguer rapidement. Ne nagez pas seul.',
      goodEyebrow: 'Conditions favorables', goodTitle: 'Vent et vagues favorables.', goodDescription: 'Le vent et les vagues sont modérés. Vérifiez tout de même les drapeaux sur la plage.',
      waveReason: 'fortes vagues de {value} m', gustReason: 'rafales de {value} mph', offshoreReason: 'vent de terre',
      updatedAt: 'Mis à jour à {time}', updating: 'Actualisation…', liveData: 'Données de modèle en direct', partialData: 'Données de modèle partielles', unavailableData: 'Données en direct indisponibles', sampleData: 'Données d’exemple', wave: 'Vague', wind: 'Vent', gusts: 'Rafales de vent',
    },
    weather: { clear: 'Ciel dégagé', partlyCloudy: 'Partiellement nuageux', fog: 'Brumeux', rain: 'Pluie', drizzle: 'Bruine', showers: 'Averses', storm: 'Orages' },
    conditions: {
      aria: 'Conditions marines actuelles', selectedAria: 'Conditions marines prévues à {time}', waveHeight: 'Hauteur des vagues', period: 'Période de {value} s', wind: 'Vent et rafales', gusts: 'Rafales : {value} mph', from: 'De {direction}',
      seaLevel: 'Niveau de la mer', rising: 'Le niveau de la mer monte', falling: 'Le niveau de la mer baisse', slack: 'Le niveau de la mer varie très peu', unavailable: 'Données indisponibles', waterTemperature: 'Température de l’eau', air: 'Air {value}°C', wetsuit: 'Combinaison conseillée',
    },
    forecast: {
      eyebrow: 'Prochaines heures', title: 'Quand les conditions s’amélioreront-elles ?', aria: 'Prévisions heure par heure', now: 'Maintenant', today: 'Aujourd’hui', tomorrow: 'Demain', day: 'Jour', night: 'Nuit', high: 'Fort', medium: 'Moyen', mild: 'Faible',
      note: 'Même un créneau plus favorable ne remplace pas la vérification des drapeaux et des courants sur place.',
    },
    decision: {
      eyebrow: 'Prévision baignade sur trois jours', title: 'Quel serait le meilleur moment ?', hint: 'Choisissez un jour et une heure pour comparer', aria: 'Choisir une heure de prévision', daysAria: 'Choisir un jour de prévision', selectedAt: 'Prévision pour {time}', reasonDetails: '{time} : {reason}',
      levels: { good: 'Favorable', caution: 'Prudence', danger: 'À éviter', unknown: 'Sans données' }, change: { now: 'Conditions actuelles', better: 'Mieux qu’actuellement', worse: 'Plus difficile qu’actuellement', mixed: 'Évolution mitigée', stable: 'Similaire à maintenant', unknown: 'Comparaison non fiable' },
      reasons: { good: 'Favorable : les vagues et les rafales sont faibles, et le vent ne souffle pas vers le large.', goodUnknown: 'Favorable : les vagues et les rafales sont faibles ; vérifiez la direction du vent sur place.', caution: 'Prudence en raison de {reasons}.', danger: 'Baignade déconseillée en raison de {reasons}.', unknown: 'Aucune donnée fiable du modèle marin n’est disponible pour cette heure.' },
      wind: { offshore: 'Vent vers le large', safe: 'Pas vers le large', unknown: 'À vérifier sur place' },
    },
    tide: {
      eyebrow: 'Marées', title: 'Prochains renversements', high: 'Marée haute', low: 'Marée basse', towardHigh: 'Marée montante', towardLow: 'Marée descendante', nearTurn: 'Près du renversement',
      rising: 'Le niveau de la mer monte', falling: 'Le niveau de la mer baisse', slack: 'Le niveau de la mer varie très peu', unavailable: 'Données de marée indisponibles', currentLevel: 'Niveau actuel du modèle', modelLevel: 'Niveau technique du modèle', eventsAria: 'Prochaines marées hautes et basses', today: 'Aujourd’hui', tomorrow: 'Demain', nextTurnSummary: '{event} dans {duration}', durationHoursMinutes: '{hours} h {minutes} min', durationHours: '{hours} h', durationMinutes: '{minutes} min',
      note: 'Estimation d’un modèle à 8 km ; elle peut être imprécise près du rivage et ne doit pas servir à la navigation.', moreTimes: 'Autres horaires de marée',
    },
    webcam: {
      south: 'Caméra sud', north: 'Caméra nord', eyebrow: 'Vue de la plage en direct', title: 'Caméra de {location}', verified: 'Source vérifiée', selector: 'Choisir la caméra', load: 'Charger la vue en direct',
      consent: 'Le lecteur ne se connecte au fournisseur externe qu’après votre clic.', open: 'Caméra en direct disponible', external: 'Le fournisseur affiche l’image en direct sur son propre site.', openAction: 'Ouvrir la caméra', unavailableTitle: 'Aucune caméra proche vérifiée', unavailable: 'Seules les caméras dont le lieu et la source en direct ont été vérifiés sont affichées.', note: 'Les images sont indicatives et la caméra peut être temporairement hors ligne. Vérifiez toujours la plage.', source: 'Source : {name}', nearbySource: '{name} · à {distance} km',
    },
    details: { eyebrow: 'Plus d’informations', title: 'Conditions et cartes détaillées', summary: 'Vent, température, contrôles de sécurité et carte du littoral' },
    checklist: {
      eyebrow: 'Avant d’entrer', title: '3 vérifications rapides', flagTitle: 'Vérifiez le drapeau de plage', flagText: 'N’entrez jamais dans l’eau lorsqu’un drapeau rouge est hissé.', onSite: 'Sur place',
      windTitle: 'Vérifiez la direction du vent', windOffshore: 'Le vent peut souffler vers le large.', windSafe: 'Le vent ne souffle pas directement vers le large.', windUnknown: 'Vérifiez sur place l’orientation du rivage et la direction du vent.', offshore: 'Vers le large', okay: 'Correct',
      beachTitle: 'Vérifiez les dangers locaux', beachText: 'Vérifiez l’accès, la sortie, les courants et les panneaux avant d’entrer dans l’eau.', elevated: 'Risque accru', moderate: 'Modéré', unavailable: 'Aucune donnée modèle', lifeguard: 'Trouver une plage surveillée',
    },
    notice: { unavailable: 'La source de données en direct est indisponible ; aucune évaluation de baignade n’est affichée.' },
    disclaimer: { important: 'Important :', text: 'Ces informations reposent sur un modèle et ne constituent pas une autorisation officielle de baignade. Suivez toujours les indications des sauveteurs affichées sur place.', data: 'Données : Open-Meteo' },
    support: { open: 'Soutenir Safe to Swim', title: 'Safe to Swim vous est utile ?', text: 'Safe to Swim est gratuit et indépendant. Si l’app vous a aidé à préparer une baignade, vous pouvez offrir une bière à Gergely.', optional: 'Sans aucune obligation — l’app reste gratuite pour tout le monde.', action: 'M’offrir une bière', close: 'Fermer le panneau de soutien' },
    install: { open: 'Installer Safe to Swim', title: 'Ajoutez Safe to Swim à l’écran d’accueil', description: 'Ouvrez-le comme une app sans rechercher le site.', iosShare: 'Dans Safari, touchez le bouton Partager.', iosAdd: 'Choisissez Sur l’écran d’accueil.', iosConfirm: 'Touchez Ajouter en haut à droite.', browserMenu: 'Ouvrez le menu du navigateur.', browserInstall: 'Choisissez Installer l’application ou Ajouter à l’écran d’accueil.', browserConfirm: 'Confirmez l’installation.', done: 'Compris', close: 'Fermer le guide d’installation' },
    footer: { tagline: 'Des décisions plus sûres avant d’entrer dans l’eau.', back: 'Retour en haut' },
    map: {
      title: 'Carte détaillée du littoral', reset: 'Tout le littoral', activeZones: '{count} zones RNLI actives', notRecommended: 'Déconseillé pour cette heure', checkOnSite: 'Vérifier sur place',
      statusNote: 'La couleur des zones indique l’état de la surveillance ; le risque du modèle est affiché ci-dessus et les drapeaux sur place prévalent.', modelStatusNote: 'Le cercle indique le risque actuel du modèle ; vérifiez les conditions sur place.', layers: 'Couches de la carte', zones: 'Zones de baignade et de surveillance', hazards: 'Jetées et {count} épis', incidents: 'Couche des incidents 2022',
      region: 'Carte interactive du littoral de Brighton et Hove', legend: 'Légende', activeZone: 'Zone RNLI active', unguarded: 'Littoral non surveillé', physicalHazard: 'Danger physique', modelPoint: 'Emplacement du modèle marin', incidentShare: 'Part des incidents 2022',
      unguardedTitle: 'Littoral non surveillé', unguardedDetail: 'Une surveillance active n’est pas garantie le long de la ligne jaune. Vérifiez les drapeaux sur place.',
      patrolActive: 'Pendant les heures de patrouille RNLI. Nagez uniquement entre les drapeaux rouge et jaune sur place.', patrolInactive: 'La patrouille n’est pas active à cette heure ; considérez cette section comme non surveillée.', patrolUnknown: 'Aucun horaire de patrouille vérifié n’est disponible pour cette date ; vérifiez sur place.', activePost: 'poste RNLI actif', inactivePost: 'patrouille inactive à cette heure', unknownPost: 'horaire de patrouille indisponible',
      groyne: 'Épi {number} – ne nagez pas juste à côté', westPierDetail: 'Structure de la jetée et courants locaux – ne nagez pas à proximité.', palacePierDetail: 'Structure de la jetée et courants locaux – ne nagez ni dessous ni à côté.', marina: 'Entrée de Brighton Marina', marinaDetail: 'Zone de trafic maritime – impropre à la baignade.',
      incidentTooltip: '2022 : {value} des incidents – {place}', incidentDetail: '{value} des incidents graves et non mortels enregistrés sur les sites surveillés en 2022. Il ne s’agit pas d’un point d’accident individuel.',
      modelLabel: 'Point du modèle marin', modelTooltip: 'Lieu d’échantillonnage des modèles de vagues, de température de l’eau et de niveau marin.', modelOnly: 'Ce lieu affiche actuellement uniquement les conditions du modèle. Les zones surveillées, dangers et données officielles sur la qualité de l’eau seront ajoutés après vérification.',
      footnote: 'Les bandes RNLI apparaissent comme des zones uniquement pendant les heures de patrouille ; sinon un point indique le poste. La position quotidienne des drapeaux peut varier. La couche des incidents est masquée par défaut ; la couche rouge met en évidence les deux jetées, l’entrée de la marina et les {count} épis actuellement cartographiés dans OpenStreetMap.',
      postsSource: 'Carte des postes', safetySource: 'Source sécurité', incidentSource: 'Données incidents',
    },
  },
  it: {
    header: { home: 'Home Safe to Swim', location: 'Località costiera', chooseLocation: 'Scegli una zona di balneazione in Europa', locate: 'Usa la mia posizione attuale', locating: 'Ricerca della spiaggia più vicina…', locationFound: 'Spiaggia disponibile più vicina: {location}', locationDenied: 'L’accesso alla posizione non è stato consentito.', locationError: 'Non è stato possibile trovare la tua posizione.', refresh: 'Aggiorna dati', language: 'Lingua' },
    locationPicker: { timeZone: 'Orari nel tuo fuso: {zone}', title: 'Scegli una spiaggia', subtitle: 'Cerca tra {count} zone di balneazione in Europa', searchLabel: 'Cerca spiagge', searchPlaceholder: 'Spiaggia, città o zona…', useLocation: 'Trova la spiaggia più vicina', current: 'Spiaggia selezionata', suggested: 'Spiagge popolari', results: '{count} risultati', empty: 'Nessuna spiaggia corrisponde alla ricerca.', refine: 'Sono mostrati i primi {count} risultati. Affina la ricerca.', selected: 'Selezionata', close: 'Chiudi il selettore spiaggia', viewLabel: 'Scegli la vista delle spiagge', listView: 'Elenco', mapView: 'Mappa', mapAria: 'Mappa delle zone di balneazione in Europa', mapLoading: 'Caricamento mappa…', mapEmpty: 'Nessuna spiaggia corrisponde alla ricerca.', resetMap: 'Tutta l’Europa', selectMapLocation: 'Scegli spiaggia', clusterLabel: '{count} spiagge — ingrandisci', previewLoading: 'Caricamento condizioni…', previewUnavailable: 'Anteprima non disponibile', previewAria: 'Anteprima delle condizioni della spiaggia', distanceAway: 'a {distance} km' },
    explorer: {
      eyebrow: 'Acque di balneazione costiere', title: 'Esplora tutta la costa', count: '{count} siti costieri verificati', searchLabel: 'Cerca spiagge costiere', searchPlaceholder: 'Spiaggia, città o zona…', filterLabel: 'Filtra per nazione', results: '{count} località trovate', empty: 'Nessuna località costiera corrisponde.', refine: 'Affina la ricerca per vedere più risultati.', reset: 'Tutta l’Europa', mapLabel: 'Mappa delle acque di balneazione costiere ufficiali', classification: 'Qualità dell’acqua: {value}', modelLocation: 'Condizioni modello disponibili', selectedLocation: 'Località selezionata', excellent: 'Eccellente', good: 'Buona', sufficient: 'Sufficiente', poor: 'Scarsa',
      nations: { all: 'Tutte', england: 'Inghilterra', wales: 'Galles', scotland: 'Scozia', ni: 'Irlanda del Nord' },
    },
    waterQuality: {
      eyebrow: 'Monitoraggio ufficiale', title: 'Qualità dell’acqua di balneazione', official: 'Dati ufficiali', annual: 'Classificazione annuale {year}', monitoringSite: 'Sito di monitoraggio', nearest: 'Sito ufficiale più vicino · {distance} km', provider: 'Fornitore dati', snapshot: 'Dati aggiornati al {date}', shortTerm: 'Rischio di inquinamento a breve termine', riskNormal: 'Il flusso ufficiale attuale non mostra un rischio maggiore.', riskElevated: 'Il flusso ufficiale indica un rischio maggiore a breve termine.', noPrediction: 'Nessuna previsione a breve termine inclusa per questo sito.', afterRain: 'Dopo piogge intense', rainAdvice: 'La pioggia può influire sulla qualità dell’acqua. Controlla l’avviso ufficiale prima di nuotare.', note: 'La classificazione annuale descrive la qualità monitorata, non onde, correnti o sicurezza locale. Segui avvisi e cartelli.', openSource: 'Apri il record ufficiale',
      shortTitle: 'Qualità dell’acqua', annualShort: 'Qualità annuale dell’acqua', summaryNormal: 'Nessun rischio maggiore a breve termine', summaryElevated: 'Rischio maggiore a breve termine', summaryAnnual: 'Classificazione ufficiale annuale',
      classes: { excellent: 'Eccellente', good: 'Buona', sufficient: 'Sufficiente', poor: 'Scarsa', unclassified: 'Non classificata' },
    },
    safety: {
      unknownEyebrow: 'Dati non disponibili', unknownTitle: 'Controlla le condizioni sul posto.', unknownDescription: 'Il modello marino non dispone di dati affidabili per questa località e questo orario, quindi non viene mostrata una valutazione.',
      dangerEyebrow: 'Non consigliato', dangerTitle: 'Resta a riva.', dangerDescription: 'A causa di {reasons}, il nuoto è sconsigliato. Segui gli avvisi locali.',
      cautionEyebrow: 'Massima prudenza', cautionTitle: 'Solo nuotatori esperti.', cautionDescription: 'A causa di {reasons}, le condizioni possono stancare rapidamente. Non nuotare da solo.',
      goodEyebrow: 'Condizioni favorevoli', goodTitle: 'Vento e onde favorevoli.', goodDescription: 'Vento e onde sono moderati. Controlla comunque le bandiere sulla spiaggia.',
      waveReason: 'onde forti di {value} m', gustReason: 'raffiche di {value} mph', offshoreReason: 'vento da terra',
      updatedAt: 'Aggiornato alle {time}', updating: 'Aggiornamento…', liveData: 'Dati modello in tempo reale', partialData: 'Dati modello parziali', unavailableData: 'Dati in tempo reale non disponibili', sampleData: 'Dati di esempio', wave: 'Onda', wind: 'Vento', gusts: 'Raffiche di vento',
    },
    weather: { clear: 'Cielo sereno', partlyCloudy: 'Parzialmente nuvoloso', fog: 'Foschia', rain: 'Pioggia', drizzle: 'Pioviggine', showers: 'Rovesci', storm: 'Temporali' },
    conditions: {
      aria: 'Condizioni marine attuali', selectedAria: 'Condizioni marine previste per le {time}', waveHeight: 'Altezza onde', period: 'Periodo di {value} s', wind: 'Vento e raffiche', gusts: 'Raffiche: {value} mph', from: 'Da {direction}',
      seaLevel: 'Livello del mare', rising: 'Il livello del mare sale', falling: 'Il livello del mare scende', slack: 'Il livello del mare cambia pochissimo', unavailable: 'Dati non disponibili', waterTemperature: 'Temperatura dell’acqua', air: 'Aria {value}°C', wetsuit: 'Muta consigliata',
    },
    forecast: {
      eyebrow: 'Prossime ore', title: 'Quando potrebbe migliorare?', aria: 'Previsioni orarie', now: 'Ora', today: 'Oggi', tomorrow: 'Domani', day: 'Giorno', night: 'Notte', high: 'Forte', medium: 'Medio', mild: 'Lieve',
      note: 'Anche una fascia oraria più favorevole non sostituisce il controllo delle bandiere e delle correnti sul posto.',
    },
    decision: {
      eyebrow: 'Previsione nuoto di tre giorni', title: 'Quando potrebbe essere meglio?', hint: 'Scegli un giorno e un orario da confrontare', aria: 'Scegli un orario di previsione', daysAria: 'Scegli un giorno di previsione', selectedAt: 'Previsione per le {time}', reasonDetails: '{time}: {reason}',
      levels: { good: 'Favorevole', caution: 'Cautela', danger: 'Da evitare', unknown: 'Nessun dato' }, change: { now: 'Condizioni attuali', better: 'Meglio di adesso', worse: 'Più impegnativo di adesso', mixed: 'Cambiamenti contrastanti', stable: 'Simile ad adesso', unknown: 'Confronto non affidabile' },
      reasons: { good: 'Favorevole perché onde e raffiche sono basse e il vento non soffia verso il largo.', goodUnknown: 'Favorevole perché onde e raffiche sono basse; controlla la direzione del vento sul posto.', caution: 'Cautela a causa di {reasons}.', danger: 'Nuoto sconsigliato a causa di {reasons}.', unknown: 'Non sono disponibili dati affidabili del modello marino per questo orario.' },
      wind: { offshore: 'Vento verso il largo', safe: 'Non verso il largo', unknown: 'Controlla sul posto' },
    },
    tide: {
      eyebrow: 'Maree', title: 'Prossimi cambi di marea', high: 'Alta marea', low: 'Bassa marea', towardHigh: 'Marea crescente', towardLow: 'Marea calante', nearTurn: 'Vicino al cambio',
      rising: 'Il livello del mare sale', falling: 'Il livello del mare scende', slack: 'Il livello del mare cambia pochissimo', unavailable: 'Dati di marea non disponibili', currentLevel: 'Livello attuale del modello', modelLevel: 'Livello tecnico del modello', eventsAria: 'Prossime alte e basse maree', today: 'Oggi', tomorrow: 'Domani', nextTurnSummary: '{event} tra {duration}', durationHoursMinutes: '{hours} h {minutes} min', durationHours: '{hours} h', durationMinutes: '{minutes} min',
      note: 'Stima di un modello a 8 km; può essere imprecisa vicino alla costa e non deve essere usata per la navigazione.', moreTimes: 'Altri orari di marea',
    },
    webcam: {
      south: 'Telecamera sud', north: 'Telecamera nord', eyebrow: 'Vista spiaggia in diretta', title: 'Telecamera di {location}', verified: 'Fonte verificata', selector: 'Seleziona telecamera', load: 'Carica vista live',
      consent: 'Il lettore si collega al fornitore esterno solo dopo il clic.', open: 'Telecamera live disponibile', external: 'Il fornitore mostra l’immagine in diretta sul proprio sito.', openAction: 'Apri la telecamera', unavailableTitle: 'Nessuna telecamera vicina verificata', unavailable: 'Mostriamo solo telecamere di cui abbiamo verificato posizione e fonte live.', note: 'Le immagini sono solo informative e la telecamera può essere temporaneamente offline. Controlla sempre la spiaggia.', source: 'Fonte: {name}', nearbySource: '{name} · a {distance} km',
    },
    details: { eyebrow: 'Altre informazioni', title: 'Condizioni e mappe dettagliate', summary: 'Vento, temperatura, controlli di sicurezza e mappa costiera' },
    checklist: {
      eyebrow: 'Prima di entrare', title: '3 controlli rapidi', flagTitle: 'Controlla la bandiera', flagText: 'Non entrare mai in acqua quando è esposta la bandiera rossa.', onSite: 'Sul posto',
      windTitle: 'Controlla la direzione del vento', windOffshore: 'Il vento potrebbe soffiare dalla costa verso il largo.', windSafe: 'Il vento non soffia direttamente verso il largo.', windUnknown: 'Controlla sul posto l’orientamento della costa e la direzione del vento.', offshore: 'Verso il largo', okay: 'OK',
      beachTitle: 'Controlla i pericoli locali', beachText: 'Controlla accesso, uscita, correnti e segnali prima di entrare in acqua.', elevated: 'Rischio elevato', moderate: 'Moderato', unavailable: 'Nessun dato modello', lifeguard: 'Trova una spiaggia sorvegliata',
    },
    notice: { unavailable: 'La fonte dati in tempo reale non è disponibile; non viene mostrata una valutazione.' },
    disclaimer: { important: 'Importante:', text: 'Queste indicazioni si basano su un modello e non sono un’autorizzazione ufficiale alla balneazione. Segui sempre le indicazioni presenti sul posto.', data: 'Dati: Open-Meteo' },
    support: { open: 'Sostieni Safe to Swim', title: 'Ti è utile Safe to Swim?', text: 'Safe to Swim è gratuito e indipendente. Se ti ha aiutato a pianificare una nuotata, puoi offrire una birra a Gergely.', optional: 'Nessun obbligo: l’app rimane gratuita per tutti.', action: 'Offrimi una birra', close: 'Chiudi il pannello di supporto' },
    install: { open: 'Installa Safe to Swim', title: 'Aggiungi Safe to Swim alla schermata Home', description: 'Aprilo come un’app senza cercare il sito.', iosShare: 'In Safari, tocca il pulsante Condividi.', iosAdd: 'Scegli Aggiungi alla schermata Home.', iosConfirm: 'Tocca Aggiungi in alto a destra.', browserMenu: 'Apri il menu del browser.', browserInstall: 'Scegli Installa app o Aggiungi alla schermata Home.', browserConfirm: 'Conferma l’installazione.', done: 'Ho capito', close: 'Chiudi la guida di installazione' },
    footer: { tagline: 'Decisioni più consapevoli prima di entrare in acqua.', back: 'Torna su' },
    map: {
      title: 'Mappa dettagliata della costa', reset: 'Costa completa', activeZones: '{count} zone RNLI attive', notRecommended: 'Non consigliato per questo orario', checkOnSite: 'Controlla sul posto',
      statusNote: 'I colori delle zone indicano lo stato del pattugliamento; il rischio del modello è mostrato sopra e le bandiere sul posto hanno la precedenza.', modelStatusNote: 'Il cerchio mostra il rischio attuale del modello; controlla le condizioni sul posto.', layers: 'Livelli mappa', zones: 'Zone di nuoto e sorveglianza', hazards: 'Pontili e {count} pennelli', incidents: 'Livello incidenti 2022',
      region: 'Mappa interattiva della costa di Brighton e Hove', legend: 'Legenda', activeZone: 'Zona RNLI attiva', unguarded: 'Costa non sorvegliata', physicalHazard: 'Pericolo fisico', modelPoint: 'Posizione del modello marino', incidentShare: 'Quota incidenti 2022',
      unguardedTitle: 'Costa non sorvegliata', unguardedDetail: 'La sorveglianza attiva non è garantita lungo la linea gialla. Controlla le bandiere sul posto.',
      patrolActive: 'Durante l’orario di pattugliamento RNLI. Nuota solo tra le bandiere rosse e gialle sul posto.', patrolInactive: 'Il pattugliamento non è attivo a questo orario; considera questo tratto non sorvegliato.', patrolUnknown: 'Non è disponibile un orario di pattugliamento verificato per questa data; controlla sul posto.', activePost: 'postazione RNLI attiva', inactivePost: 'pattugliamento inattivo a questo orario', unknownPost: 'orario di pattugliamento non disponibile',
      groyne: 'Pennello {number} – non nuotare immediatamente accanto', westPierDetail: 'Struttura del pontile e correnti locali – non nuotare nelle vicinanze.', palacePierDetail: 'Struttura del pontile e correnti locali – non nuotare sotto o accanto.', marina: 'Ingresso di Brighton Marina', marinaDetail: 'Zona di traffico nautico – non adatta al nuoto.',
      incidentTooltip: '2022: {value} degli incidenti – {place}', incidentDetail: 'Quota del {value} degli incidenti gravi e non mortali registrati nei siti sorvegliati nel 2022. Non è un singolo punto di incidente.',
      modelLabel: 'Punto del modello marino', modelTooltip: 'Posizione di campionamento dei modelli di onde, temperatura dell’acqua e livello del mare.', modelOnly: 'Questa località mostra attualmente solo le condizioni del modello. Zone sorvegliate, pericoli e qualità ufficiale dell’acqua verranno aggiunti dopo la verifica.',
      footnote: 'Le fasce RNLI compaiono come aree solo durante le ore di pattugliamento attivo; altrimenti un punto indica la postazione. La posizione giornaliera delle bandiere può cambiare. Il livello incidenti è nascosto per impostazione predefinita; il livello rosso evidenzia i due pontili, l’ingresso della marina e i {count} pennelli attualmente mappati in OpenStreetMap.',
      postsSource: 'Mappa postazioni', safetySource: 'Fonte sicurezza', incidentSource: 'Dati incidenti',
    },
  },
  es: {
    header: { home: 'Inicio de Safe to Swim', location: 'Ubicación costera', chooseLocation: 'Elige una zona de baño de Europa', locate: 'Usar mi ubicación actual', locating: 'Buscando la playa más cercana…', locationFound: 'Playa disponible más cercana: {location}', locationDenied: 'No se permitió el acceso a la ubicación.', locationError: 'No se pudo encontrar tu ubicación.', refresh: 'Actualizar datos', language: 'Idioma' },
    locationPicker: { timeZone: 'Horas en tu zona horaria: {zone}', title: 'Elige una playa', subtitle: 'Busca entre {count} zonas de baño de Europa', searchLabel: 'Buscar playas', searchPlaceholder: 'Playa, ciudad o zona…', useLocation: 'Buscar la playa más cercana', current: 'Playa seleccionada', suggested: 'Playas populares', results: '{count} resultados', empty: 'No hay playas que coincidan con la búsqueda.', refine: 'Se muestran los primeros {count} resultados. Acota la búsqueda.', selected: 'Seleccionada', close: 'Cerrar selector de playa', viewLabel: 'Elegir vista de playas', listView: 'Lista', mapView: 'Mapa', mapAria: 'Mapa de zonas de baño de Europa', mapLoading: 'Cargando mapa…', mapEmpty: 'No hay playas que coincidan con la búsqueda.', resetMap: 'Toda Europa', selectMapLocation: 'Elegir playa', clusterLabel: '{count} playas — ampliar', previewLoading: 'Cargando condiciones…', previewUnavailable: 'Vista previa no disponible', previewAria: 'Vista previa de las condiciones de la playa', distanceAway: 'a {distance} km' },
    explorer: {
      eyebrow: 'Aguas de baño costeras', title: 'Explora toda la costa', count: '{count} sitios costeros verificados', searchLabel: 'Buscar playas costeras', searchPlaceholder: 'Playa, ciudad o zona…', filterLabel: 'Filtrar por nación', results: '{count} ubicaciones encontradas', empty: 'No hay ubicaciones costeras que coincidan.', refine: 'Acota la búsqueda para ver más resultados.', reset: 'Toda Europa', mapLabel: 'Mapa de aguas de baño costeras oficiales', classification: 'Calidad del agua: {value}', modelLocation: 'Condiciones del modelo disponibles', selectedLocation: 'Ubicación seleccionada', excellent: 'Excelente', good: 'Buena', sufficient: 'Suficiente', poor: 'Mala',
      nations: { all: 'Todas', england: 'Inglaterra', wales: 'Gales', scotland: 'Escocia', ni: 'Irlanda del Norte' },
    },
    waterQuality: {
      eyebrow: 'Control oficial', title: 'Calidad del agua de baño', official: 'Datos oficiales', annual: 'Clasificación anual {year}', monitoringSite: 'Punto de control', nearest: 'Punto oficial más cercano · {distance} km', provider: 'Proveedor de datos', snapshot: 'Datos actualizados el {date}', shortTerm: 'Riesgo de contaminación a corto plazo', riskNormal: 'El registro oficial actual no muestra un riesgo mayor.', riskElevated: 'El registro oficial indica un riesgo mayor a corto plazo.', noPrediction: 'No hay predicción a corto plazo incluida para este lugar.', afterRain: 'Después de lluvia intensa', rainAdvice: 'La lluvia puede afectar la calidad del agua. Comprueba el aviso oficial antes de nadar.', note: 'La clasificación anual describe la calidad controlada, no las olas, corrientes o seguridad local. Sigue los avisos y señales.', openSource: 'Abrir registro oficial',
      shortTitle: 'Calidad del agua', annualShort: 'Calidad anual del agua', summaryNormal: 'Sin riesgo mayor a corto plazo', summaryElevated: 'Riesgo mayor a corto plazo', summaryAnnual: 'Clasificación oficial anual',
      classes: { excellent: 'Excelente', good: 'Buena', sufficient: 'Suficiente', poor: 'Mala', unclassified: 'Sin clasificar' },
    },
    safety: {
      unknownEyebrow: 'Datos no disponibles', unknownTitle: 'Comprueba las condiciones en el lugar.', unknownDescription: 'El modelo marino no ofrece datos fiables para este lugar y esta hora, por lo que no se muestra una valoración.',
      dangerEyebrow: 'No recomendado', dangerTitle: 'Quédate en la orilla.', dangerDescription: 'Debido a {reasons}, no se recomienda nadar. Sigue los avisos locales.',
      cautionEyebrow: 'Extrema la precaución', cautionTitle: 'Solo para nadadores experimentados.', cautionDescription: 'Debido a {reasons}, las condiciones pueden cansar rápidamente. No nades solo.',
      goodEyebrow: 'Condiciones favorables', goodTitle: 'Viento y olas favorables.', goodDescription: 'El viento y las olas son moderados. Aun así, comprueba las banderas de la playa.',
      waveReason: 'oleaje fuerte de {value} m', gustReason: 'rachas de {value} mph', offshoreReason: 'viento de tierra',
      updatedAt: 'Actualizado a las {time}', updating: 'Actualizando…', liveData: 'Datos del modelo en directo', partialData: 'Datos parciales del modelo', unavailableData: 'Datos en directo no disponibles', sampleData: 'Datos de ejemplo', wave: 'Ola', wind: 'Viento', gusts: 'Rachas de viento',
    },
    weather: { clear: 'Cielo despejado', partlyCloudy: 'Parcialmente nublado', fog: 'Bruma', rain: 'Lluvia', drizzle: 'Llovizna', showers: 'Chubascos', storm: 'Tormentas' },
    conditions: {
      aria: 'Condiciones marinas actuales', selectedAria: 'Condiciones marinas previstas para las {time}', waveHeight: 'Altura de ola', period: 'Periodo de {value} s', wind: 'Viento y rachas', gusts: 'Rachas: {value} mph', from: 'Desde {direction}',
      seaLevel: 'Nivel del mar', rising: 'El nivel del mar sube', falling: 'El nivel del mar baja', slack: 'El nivel del mar cambia muy poco', unavailable: 'Datos no disponibles', waterTemperature: 'Temperatura del agua', air: 'Aire {value}°C', wetsuit: 'Neopreno recomendado',
    },
    forecast: {
      eyebrow: 'Próximas horas', title: '¿Cuándo podría mejorar?', aria: 'Previsión por horas', now: 'Ahora', today: 'Hoy', tomorrow: 'Mañana', day: 'Día', night: 'Noche', high: 'Fuerte', medium: 'Medio', mild: 'Suave',
      note: 'Ni siquiera una franja más favorable sustituye la comprobación de las banderas y las corrientes en el lugar.',
    },
    decision: {
      eyebrow: 'Previsión de baño de tres días', title: '¿Cuándo podría ser mejor?', hint: 'Elige un día y una hora para comparar', aria: 'Seleccionar una hora de previsión', daysAria: 'Seleccionar un día de previsión', selectedAt: 'Previsión para las {time}', reasonDetails: '{time}: {reason}',
      levels: { good: 'Favorable', caution: 'Precaución', danger: 'Evitar', unknown: 'Sin datos' }, change: { now: 'Condiciones actuales', better: 'Mejor que ahora', worse: 'Más difícil que ahora', mixed: 'Cambios mixtos', stable: 'Similar a ahora', unknown: 'Comparación no fiable' },
      reasons: { good: 'Favorable porque el oleaje y las rachas son bajos y el viento no sopla hacia mar adentro.', goodUnknown: 'Favorable porque el oleaje y las rachas son bajos; comprueba la dirección del viento en el lugar.', caution: 'Precaución debido a {reasons}.', danger: 'No se recomienda nadar debido a {reasons}.', unknown: 'No hay datos fiables del modelo marino para esta hora.' },
      wind: { offshore: 'Viento mar adentro', safe: 'No sopla mar adentro', unknown: 'Comprobar en el lugar' },
    },
    tide: {
      eyebrow: 'Mareas', title: 'Próximos cambios', high: 'Pleamar', low: 'Bajamar', towardHigh: 'Marea creciente', towardLow: 'Marea descendente', nearTurn: 'Cerca del cambio',
      rising: 'El nivel del mar sube', falling: 'El nivel del mar baja', slack: 'El nivel del mar cambia muy poco', unavailable: 'Datos de marea no disponibles', currentLevel: 'Nivel actual del modelo', modelLevel: 'Nivel técnico del modelo', eventsAria: 'Próximas pleamares y bajamares', today: 'Hoy', tomorrow: 'Mañana', nextTurnSummary: '{event} en {duration}', durationHoursMinutes: '{hours} h {minutes} min', durationHours: '{hours} h', durationMinutes: '{minutes} min',
      note: 'Estimación de un modelo de 8 km; puede ser imprecisa cerca de la costa y no debe usarse para navegación.', moreTimes: 'Más horarios de marea',
    },
    webcam: {
      south: 'Cámara sur', north: 'Cámara norte', eyebrow: 'Vista de playa en directo', title: 'Cámara de {location}', verified: 'Fuente verificada', selector: 'Seleccionar cámara', load: 'Cargar vista en directo',
      consent: 'El reproductor solo se conecta al proveedor externo después de hacer clic.', open: 'Cámara en directo disponible', external: 'El proveedor muestra la imagen en directo en su propio sitio.', openAction: 'Abrir cámara en directo', unavailableTitle: 'No hay cámara cercana verificada', unavailable: 'Solo mostramos cámaras cuya ubicación y fuente en directo hemos podido verificar.', note: 'Las imágenes son informativas y la cámara puede desconectarse temporalmente. Comprueba siempre la playa.', source: 'Fuente: {name}', nearbySource: '{name} · a {distance} km',
    },
    details: { eyebrow: 'Más información', title: 'Condiciones y mapas detallados', summary: 'Viento, temperatura, controles de seguridad y mapa costero' },
    checklist: {
      eyebrow: 'Antes de entrar', title: '3 comprobaciones rápidas', flagTitle: 'Comprueba la bandera', flagText: 'Nunca entres en el agua si ondea una bandera roja.', onSite: 'En el lugar',
      windTitle: 'Comprueba la dirección del viento', windOffshore: 'El viento puede estar soplando de tierra hacia el mar.', windSafe: 'El viento no sopla directamente hacia el mar.', windUnknown: 'Comprueba en el lugar la orientación de la costa y la dirección del viento.', offshore: 'Hacia el mar', okay: 'Bien',
      beachTitle: 'Comprueba los riesgos locales', beachText: 'Comprueba el acceso, la salida, las corrientes y las señales antes de entrar al agua.', elevated: 'Riesgo elevado', moderate: 'Moderado', unavailable: 'Sin datos del modelo', lifeguard: 'Encuentra una playa vigilada',
    },
    notice: { unavailable: 'La fuente de datos en directo no está disponible; no se muestra una valoración.' },
    disclaimer: { important: 'Importante:', text: 'Esta orientación se basa en un modelo y no es una autorización oficial de seguridad. Sigue siempre las indicaciones mostradas en el lugar.', data: 'Datos: Open-Meteo' },
    support: { open: 'Apoya Safe to Swim', title: '¿Te resulta útil Safe to Swim?', text: 'Safe to Swim es gratis e independiente. Si te ayudó a planear un baño, puedes invitar a Gergely a una cerveza.', optional: 'Sin compromiso: la aplicación seguirá siendo gratuita para todos.', action: 'Invítame a una cerveza', close: 'Cerrar el panel de apoyo' },
    install: { open: 'Instalar Safe to Swim', title: 'Añade Safe to Swim a la pantalla de inicio', description: 'Ábrelo como una aplicación sin buscar el sitio.', iosShare: 'En Safari, toca el botón Compartir.', iosAdd: 'Elige Añadir a pantalla de inicio.', iosConfirm: 'Toca Añadir en la esquina superior derecha.', browserMenu: 'Abre el menú del navegador.', browserInstall: 'Elige Instalar aplicación o Añadir a pantalla de inicio.', browserConfirm: 'Confirma la instalación.', done: 'Entendido', close: 'Cerrar la guía de instalación' },
    footer: { tagline: 'Decisiones más seguras antes de entrar al agua.', back: 'Volver arriba' },
    map: {
      title: 'Mapa detallado de la costa', reset: 'Costa completa', activeZones: '{count} zonas RNLI activas', notRecommended: 'No recomendado para esta hora', checkOnSite: 'Comprueba en el lugar',
      statusNote: 'Los colores de las zonas indican el estado de vigilancia; el riesgo del modelo aparece arriba y las banderas del lugar tienen prioridad.', modelStatusNote: 'El círculo muestra el riesgo actual del modelo; comprueba las condiciones en el lugar.', layers: 'Capas del mapa', zones: 'Zonas de baño y vigilancia', hazards: 'Muelles y {count} espigones', incidents: 'Capa de incidentes de 2022',
      region: 'Mapa interactivo de la costa de Brighton y Hove', legend: 'Leyenda', activeZone: 'Zona RNLI activa', unguarded: 'Costa sin vigilancia', physicalHazard: 'Peligro físico', modelPoint: 'Ubicación del modelo marino', incidentShare: 'Proporción de incidentes 2022',
      unguardedTitle: 'Costa sin vigilancia', unguardedDetail: 'No se garantiza vigilancia activa a lo largo de la línea amarilla. Comprueba las banderas en el lugar.',
      patrolActive: 'Durante el horario de patrulla RNLI. Nada solo entre las banderas rojas y amarillas del lugar.', patrolInactive: 'La patrulla no está activa a esta hora; considera este tramo como no vigilado.', patrolUnknown: 'No hay un horario de patrulla verificado para esta fecha; compruébalo en el lugar.', activePost: 'puesto RNLI activo', inactivePost: 'patrulla inactiva a esta hora', unknownPost: 'horario de patrulla no disponible',
      groyne: 'Espigón {number}: no nades justo al lado', westPierDetail: 'Estructura del muelle y corrientes locales: no nades cerca.', palacePierDetail: 'Estructura del muelle y corrientes locales: no nades debajo ni al lado.', marina: 'Entrada de Brighton Marina', marinaDetail: 'Zona de tráfico de embarcaciones: no apta para nadar.',
      incidentTooltip: '2022: {value} de los incidentes – {place}', incidentDetail: 'Proporción del {value} de incidentes graves y no mortales registrados en lugares vigilados en 2022. No es un punto de accidente individual.',
      modelLabel: 'Punto del modelo marino', modelTooltip: 'Ubicación de muestreo de los modelos de oleaje, temperatura del agua y nivel del mar.', modelOnly: 'Esta ubicación muestra por ahora solo condiciones del modelo. Las zonas vigiladas, los riesgos y la calidad oficial del agua se añadirán tras verificar los datos.',
      footnote: 'Las franjas RNLI aparecen como áreas solo durante el horario de patrulla activo; fuera de él, un punto marca el puesto. La posición diaria de las banderas puede cambiar. La capa de incidentes está oculta por defecto; la capa roja destaca los dos muelles, la entrada de la marina y los {count} espigones cartografiados actualmente en OpenStreetMap.',
      postsSource: 'Mapa de puestos', safetySource: 'Fuente de seguridad', incidentSource: 'Datos de incidentes',
    },
  },
  hu: {
    header: { home: 'Safe to Swim kezdőlap', location: 'Tengerparti helyszín', chooseLocation: 'Válassz egy európai fürdőhelyet', locate: 'Jelenlegi helyzetem használata', locating: 'Legközelebbi strand keresése…', locationFound: 'Legközelebbi támogatott strand: {location}', locationDenied: 'A helyhozzáférés nem lett engedélyezve.', locationError: 'A helyzetedet nem sikerült meghatározni.', refresh: 'Adatok frissítése', language: 'Nyelv' },
    locationPicker: { timeZone: 'Időpontok a saját időzónádban: {zone}', title: 'Válassz strandot', subtitle: 'Keress {count} európai fürdőhely között', searchLabel: 'Strandok keresése', searchPlaceholder: 'Strand, város vagy régió…', useLocation: 'Legközelebbi strand megkeresése', current: 'Kiválasztott strand', suggested: 'Népszerű strandok', results: '{count} találat', empty: 'Nincs a keresésnek megfelelő strand.', refine: 'Az első {count} találat látható. Pontosítsd a keresést.', selected: 'Kiválasztva', close: 'Strandválasztó bezárása', viewLabel: 'Strandnézet kiválasztása', listView: 'Lista', mapView: 'Térkép', mapAria: 'Európai fürdőhelyek térképe', mapLoading: 'Térkép betöltése…', mapEmpty: 'Nincs a keresésnek megfelelő strand.', resetMap: 'Teljes Európa', selectMapLocation: 'Strand kiválasztása', clusterLabel: '{count} strand — nagyíts rá', previewLoading: 'Körülmények betöltése…', previewUnavailable: 'Előnézet nem érhető el', previewAria: 'Strandkörülmények előnézete', distanceAway: '{distance} km-re' },
    explorer: {
      eyebrow: 'Hivatalos európai fürdőhelyek', title: 'Fedezd fel a teljes partvidéket', count: '{count} hivatalos fürdőhely', searchLabel: 'Fürdőhely keresése', searchPlaceholder: 'Strand, város vagy régió…', filterLabel: 'Szűrés ország szerint', results: '{count} találat', empty: 'Nincs a keresésnek megfelelő fürdőhely.', refine: 'Pontosítsd a keresést további találatokhoz.', reset: 'Teljes Európa', mapLabel: 'Hivatalos európai fürdőhelyek térképe', classification: 'Vízminőség: {value}', modelLocation: 'Modelladat elérhető', selectedLocation: 'Kiválasztott hely', excellent: 'Kiváló', good: 'Jó', sufficient: 'Megfelelő', poor: 'Gyenge',
      nations: { all: 'Mind', england: 'Anglia', wales: 'Wales', scotland: 'Skócia', ni: 'Észak-Írország' },
    },
    waterQuality: {
      eyebrow: 'Hivatalos ellenőrzés', title: 'Fürdővízminőség', official: 'Hivatalos adat', annual: '{year}. évi besorolás', monitoringSite: 'Mérési hely', nearest: 'Legközelebbi hivatalos hely · {distance} km', provider: 'Adatszolgáltató', snapshot: 'Pillanatkép frissítve: {date}', shortTerm: 'Rövid távú szennyezési kockázat', riskNormal: 'A jelenlegi hivatalos adatfolyam nem jelez emelkedett kockázatot.', riskElevated: 'A hivatalos adatfolyam emelkedett rövid távú kockázatot jelez.', noPrediction: 'Ehhez a helyhez nincs rövid távú előrejelzés az adatfolyamban.', afterRain: 'Nagy eső után', rainAdvice: 'Az eső ronthatja a vízminőséget. Úszás előtt ellenőrizd a legfrissebb hivatalos figyelmeztetést.', note: 'Az éves besorolás a mért vízminőséget írja le, nem a hullámokat, áramlásokat vagy helyi veszélyeket. Kövesd az aktuális jelzéseket.', openSource: 'Hivatalos adatlap megnyitása',
      shortTitle: 'Vízminőség', annualShort: 'Éves vízminőség', summaryNormal: 'Nincs jelzett rövid távú többletkockázat', summaryElevated: 'Fokozott rövid távú kockázat', summaryAnnual: 'Hivatalos éves minősítés',
      classes: { excellent: 'Kiváló', good: 'Jó', sufficient: 'Megfelelő', poor: 'Gyenge', unclassified: 'Nincs besorolás' },
    },
    safety: {
      unknownEyebrow: 'Nincs megbízható adat', unknownTitle: 'Ellenőrizd a körülményeket a helyszínen.', unknownDescription: 'Ehhez a helyhez és időponthoz nincs megbízható tengeri modelladat, ezért nem jelenítünk meg úszási minősítést.',
      dangerEyebrow: 'Nem ajánlott', dangerTitle: 'Inkább maradj a parton.', dangerDescription: 'A(z) {reasons} miatt az úszás nem ajánlott. Kövesd a helyszíni figyelmeztetéseket.',
      cautionEyebrow: 'Fokozott óvatosság', cautionTitle: 'Csak tapasztalt úszóknak.', cautionDescription: 'Légy óvatos a következő miatt: {reasons}. A körülmények gyorsan fárasztóvá válhatnak. Ne menj egyedül.',
      goodEyebrow: 'Kedvező körülmények', goodTitle: 'Kedvező szél és hullámzás.', goodDescription: 'A szél és a hullámzás mérsékelt. Ettől függetlenül ellenőrizd a parti zászlókat.',
      waveReason: '{value} m-es erős hullámzás', gustReason: '{value} mph széllökések', offshoreReason: 'parttól kifelé fújó szél',
      updatedAt: '{time}-kor frissítve', updating: 'Frissítés…', liveData: 'Élő modelladat', partialData: 'Részleges modelladat', unavailableData: 'Az élő adat nem érhető el', sampleData: 'Mintaadat', wave: 'Hullám', wind: 'Szél', gusts: 'Széllökések',
    },
    weather: { clear: 'Tiszta ég', partlyCloudy: 'Változóan felhős', fog: 'Párás', rain: 'Eső', drizzle: 'Szitálás', showers: 'Záporok', storm: 'Zivataros' },
    conditions: {
      aria: 'Aktuális tengeri körülmények', selectedAria: 'Tengeri előrejelzés erre: {time}', waveHeight: 'Hullámmagasság', period: '{value} mp periódus', wind: 'Szél és széllökés', gusts: 'Lökések: {value} mph', from: '{direction} felől',
      seaLevel: 'Vízszint', rising: 'A vízszint emelkedik', falling: 'A vízszint apad', slack: 'A vízszint alig változik', unavailable: 'Nincs adat', waterTemperature: 'Vízhőmérséklet', air: '{value}°C levegő', wetsuit: 'Neoprén ajánlott',
    },
    forecast: {
      eyebrow: 'Következő órák', title: 'Mikor lehet jobb?', aria: 'Óránkénti előrejelzés', now: 'Most', today: 'Ma', tomorrow: 'Holnap', day: 'Nappal', night: 'Éjjel', high: 'Erős', medium: 'Közepes', mild: 'Enyhe',
      note: 'A zöldebb időablak sem helyettesíti a helyszíni zászlók és az áramlás ellenőrzését.',
    },
    decision: {
      eyebrow: 'Háromnapos úszási kilátások', title: 'Mikor lehet a legjobb?', hint: 'Válassz napot és időpontot az összehasonlításhoz', aria: 'Előrejelzési időpont kiválasztása', daysAria: 'Előrejelzési nap kiválasztása', selectedAt: 'Előrejelzés erre: {time}', reasonDetails: '{time}: {reason}',
      levels: { good: 'Kedvező', caution: 'Óvatosan', danger: 'Kerüld', unknown: 'Nincs adat' }, change: { now: 'Jelenlegi körülmények', better: 'A mostaninál kedvezőbb', worse: 'A mostaninál nehezebb', mixed: 'Vegyes változás', stable: 'A mostanihoz hasonló', unknown: 'Nincs megbízható összehasonlítás' },
      reasons: { good: 'Kedvező, mert a hullámzás és a széllökések alacsonyak, a szél pedig nem a parttól kifelé fúj.', goodUnknown: 'Kedvező, mert a hullámzás és a széllökések alacsonyak; a szélirányt ellenőrizd a helyszínen.', caution: 'Óvatosság oka: {reasons}.', danger: 'Az úszás nem ajánlott a következő miatt: {reasons}.', unknown: 'Ehhez az időponthoz nincs megbízható tengeri modelladat.' },
      wind: { offshore: 'Parttól kifelé', safe: 'Nem kifelé fúj', unknown: 'Helyszínen' },
    },
    tide: {
      eyebrow: 'Árapály', title: 'Következő fordulók', high: 'Dagály', low: 'Apály', towardHigh: 'Dagály felé', towardLow: 'Apály felé', nearTurn: 'Forduló közelében',
      rising: 'A vízszint emelkedik', falling: 'A vízszint csökken', slack: 'A vízszint alig változik', unavailable: 'Nincs árapályadat', currentLevel: 'Jelenlegi modellszint', modelLevel: 'Technikai modellszint', eventsAria: 'Következő apályok és dagályok', today: 'Ma', tomorrow: 'Holnap', nextTurnSummary: '{event} {duration} múlva', durationHoursMinutes: '{hours} óra {minutes} perc', durationHours: '{hours} óra', durationMinutes: '{minutes} perc',
      note: 'Open-Meteo · Órás vízszintadatokból becsült fordulópontok, 8 km-es modellrácson. Part mentén korlátozott pontosságú; navigációra nem használható.', moreTimes: 'További árapály-időpontok',
    },
    webcam: {
      south: 'Déli kamera', north: 'Északi kamera', eyebrow: 'Élő partkép', title: '{location} kamerája', verified: 'Ellenőrzött forrás', selector: 'Kamera kiválasztása', load: 'Élő kép betöltése',
      consent: 'A lejátszó csak kattintás után kapcsolódik a külső szolgáltatóhoz.', open: 'Elérhető élő kamera', external: 'A szolgáltató a saját oldalán mutatja az élő képet.', openAction: 'Élő kamera megnyitása', unavailableTitle: 'Nincs ellenőrzött közeli kamera', unavailable: 'Csak olyan kamerát mutatunk, amelynek helyét és élő forrását ellenőrizni tudtuk.', note: 'A kamerakép tájékoztató jellegű, és átmenetileg leállhat. Mindig ellenőrizd a partot a helyszínen is.', source: 'Forrás: {name}', nearbySource: '{name} · {distance} km-re',
    },
    details: { eyebrow: 'További információk', title: 'Részletes körülmények és térképek', summary: 'Szél, hőmérséklet, biztonsági ellenőrzések és Európa parttérképe' },
    checklist: {
      eyebrow: 'Mielőtt bemész', title: '3 gyors ellenőrzés', flagTitle: 'Nézd meg a parti zászlót', flagText: 'Piros zászlónál semmiképp ne menj a vízbe.', onSite: 'Helyszínen',
      windTitle: 'Ellenőrizd a szélirányt', windOffshore: 'A szél a parttól kifelé fújhat.', windSafe: 'A szél nem közvetlenül offshore.', windUnknown: 'A helyszínen ellenőrizd a part tájolását és a szél irányát.', offshore: 'Offshore', okay: 'Rendben',
      beachTitle: 'Ellenőrizd a helyi veszélyeket', beachText: 'Vízbe lépés előtt ellenőrizd a be- és kijutást, az áramlásokat és a figyelmeztető táblákat.', elevated: 'Fokozott kockázat', moderate: 'Mérsékelt', unavailable: 'Nincs modelladat', lifeguard: 'Keress felügyelt strandot',
    },
    notice: { unavailable: 'Az élő adatforrás most nem érhető el, ezért nem jelenítünk meg úszási minősítést.' },
    disclaimer: { important: 'Fontos:', text: 'Ez egy időjárási modell alapján készült tájékoztató, nem hivatalos biztonsági engedély. Mindig a helyszíni vízimentői jelzések az irányadók.', data: 'Adatok: Open-Meteo' },
    support: { open: 'A Safe to Swim támogatása', title: 'Hasznos a Safe to Swim?', text: 'A Safe to Swim ingyenes és független. Ha segített megtervezni egy úszást, opcionálisan meghívhatsz egy sörre.', optional: 'Semmi nyomás — az app mindenki számára ingyenes marad.', action: 'Meghívlak egy sörre', close: 'Támogatói panel bezárása' },
    install: { open: 'Safe to Swim telepítése', title: 'Tedd ki a Safe to Swimet a főképernyőre', description: 'Nyisd meg úgy, mint egy appot, a weboldal keresése nélkül.', iosShare: 'A Safariban koppints a Megosztás gombra.', iosAdd: 'Válaszd a Főképernyőhöz adás lehetőséget.', iosConfirm: 'Koppints a jobb felső sarokban a Hozzáadásra.', browserMenu: 'Nyisd meg a böngésző menüjét.', browserInstall: 'Válaszd az Alkalmazás telepítése vagy Főképernyőhöz adás lehetőséget.', browserConfirm: 'Erősítsd meg a telepítést.', done: 'Értem', close: 'Telepítési útmutató bezárása' },
    footer: { tagline: 'Magabiztosabb döntések a víz előtt.', back: 'Vissza az elejére' },
    map: {
      title: 'Részletes partszakasz-térkép', reset: 'Teljes partszakasz', activeZones: '{count} aktív RNLI-zóna', notRecommended: 'Erre az időpontra nem ajánlott', checkOnSite: 'Helyszíni ellenőrzés kell',
      statusNote: 'A zónaszínek a járőrözési állapotot mutatják; az aktuális modellkockázat felül látható, a helyszíni zászló az irányadó.', modelStatusNote: 'A kör az aktuális modellkockázatot mutatja; ellenőrizd a körülményeket a helyszínen.', layers: 'Térképrétegek', zones: 'Úszó- és felügyeleti zónák', hazards: 'Mólók és {count} hullámtörő', incidents: '2022-es incidensréteg',
      region: 'Interaktív Brighton és Hove partszakasz-térkép', legend: 'Jelmagyarázat', activeZone: 'Aktív RNLI-zóna', unguarded: 'Nem felügyelt part', physicalHazard: 'Fizikai veszély', modelPoint: 'Tengeri modell helye', incidentShare: '2022-es incidensarány',
      unguardedTitle: 'Nem felügyelt partszakasz', unguardedDetail: 'A sárga partvonalon nincs garantált aktív felügyelet. Ellenőrizd a helyszíni zászlókat.',
      patrolActive: 'RNLI járőrözési időben. Csak a helyszíni piros-sárga zászlók között ússz.', patrolInactive: 'A járőrözés ebben az időpontban nem aktív; kezeld nem felügyelt partszakaszként.', patrolUnknown: 'Ehhez a dátumhoz nincs ellenőrzött járőrözési időrend; ellenőrizd a helyszínen.', activePost: 'aktív RNLI-poszt', inactivePost: 'járőrözés ebben az időpontban nem aktív', unknownPost: 'nincs járőrözési időrend',
      groyne: 'Hullámtörő {number} – ne ússz közvetlenül mellette', westPierDetail: 'Mólószerkezet és rögzített áramlások – ne ússz a közelében.', palacePierDetail: 'Mólószerkezet és rögzített áramlások – ne ússz alá vagy mellé.', marina: 'Brighton Marina bejárata', marinaDetail: 'Hajóforgalmi terület – úszásra nem alkalmas.',
      incidentTooltip: '2022: az incidensek {value}-a – {place}', incidentDetail: '{value} részesedés a felügyelt helyszíneken rögzített 2022-es súlyos és nem életveszélyes incidensekből. Nem egyedi baleseti pont.',
      modelLabel: 'Tengeri modellpont', modelTooltip: 'A hullám-, vízhőmérséklet- és vízszintmodell mintavételi helye.', modelOnly: 'Ehhez a helyszínhez jelenleg csak modelladatokat mutatunk. Az ellenőrzött vízminőséget, veszélyeket és felügyelt zónákat külön adjuk hozzá.',
      footnote: 'Az RNLI-partsávok csak aktív járőrözési időben jelennek meg területként; azon kívül a poszt helyét egy pont jelöli. A napi zászlók pontos helye változhat. Az incidensréteg alapból rejtett; a piros réteg a két mólót, a marina bejáratát és az OpenStreetMapen jelenleg feltérképezett {count} hullámtörőt emeli ki.',
      postsSource: 'Poszttérkép', safetySource: 'Biztonsági forrás', incidentSource: 'Incidensadat',
    },
  },
}

for (const language of LANGUAGES) translations[language.code].outlook = outlookMessages[language.code]

const tideInteractions = {
  en: { selected: 'Selected forecast', hint: 'Select or drag along the curve, or choose a tide card. Use arrow keys when the chart is focused.', choose: 'Explore tide forecast', reset: 'Back to start', current: 'Current estimated level' },
  hu: { selected: 'Kiválasztott előrejelzés', hint: 'Kattints vagy húzd az ujjad a görbén, vagy válassz időpontkártyát. A kijelölt grafikon nyílbillentyűkkel is léptethető.', choose: 'Árapály-előrejelzés böngészése', reset: 'Vissza az elejére', current: 'Becsült vízszint most' },
  fr: { selected: 'Prévision sélectionnée', hint: 'Sélectionnez ou faites glisser sur la courbe, ou choisissez une carte. Utilisez les flèches lorsque le graphique est sélectionné.', choose: 'Explorer les prévisions de marée', reset: 'Retour au début', current: 'Niveau actuel estimé' },
  it: { selected: 'Previsione selezionata', hint: 'Seleziona o trascina sulla curva, oppure scegli una scheda. Usa i tasti freccia quando il grafico è selezionato.', choose: 'Esplora le previsioni di marea', reset: 'Torna all’inizio', current: 'Livello attuale stimato' },
  es: { selected: 'Pronóstico seleccionado', hint: 'Selecciona o arrastra sobre la curva, o elige una tarjeta. Usa las flechas cuando el gráfico tenga el foco.', choose: 'Explorar el pronóstico de mareas', reset: 'Volver al inicio', current: 'Nivel actual estimado' },
}
for (const language of LANGUAGES) translations[language.code].tide.interactive = tideInteractions[language.code]

const timelineMessages = {
  hu: { eyebrow: 'Körülmények óráról órára', title: 'Nézd meg, hogyan változik', metric: 'Diagram adatainak kiválasztása', temperature: 'Hőmérséklet', water: 'Víz', air: 'Levegő', wind: 'Szél', gusts: 'Széllökések', tide: 'Árapály', hint: 'Húzd végig az ujjad vagy kattints a görbén: a fenti összefoglaló is a kiválasztott időpontot mutatja. Nyílbillentyűkkel is léptethető.', choose: 'Körülmények időpontjának kiválasztása', night: 'Árnyékolt sáv: éjszaka', model: 'Modell-előrejelzés · helyi idő' },
  en: { eyebrow: 'Conditions by the hour', title: 'See how conditions change', metric: 'Choose chart data', temperature: 'Temperature', water: 'Water', air: 'Air', wind: 'Wind', gusts: 'Gusts', tide: 'Tide', hint: 'Drag or select the curve to update the summary above. You can also use the arrow keys.', choose: 'Choose a conditions forecast time', night: 'Shaded area: night', model: 'Model forecast · local time' },
  fr: { eyebrow: 'Conditions heure par heure', title: 'Suivez l’évolution des conditions', metric: 'Choisir les données du graphique', temperature: 'Température', water: 'Eau', air: 'Air', wind: 'Vent', gusts: 'Rafales', tide: 'Marée', hint: 'Faites glisser ou sélectionnez la courbe pour actualiser le résumé. Les touches fléchées fonctionnent aussi.', choose: 'Choisir un horaire de prévision', night: 'Zone ombrée : nuit', model: 'Prévision du modèle · heure locale' },
  it: { eyebrow: 'Condizioni ora per ora', title: 'Scopri come cambiano le condizioni', metric: 'Scegli i dati del grafico', temperature: 'Temperatura', water: 'Acqua', air: 'Aria', wind: 'Vento', gusts: 'Raffiche', tide: 'Marea', hint: 'Trascina o seleziona la curva per aggiornare il riepilogo. Puoi usare anche i tasti freccia.', choose: 'Scegli un orario di previsione', night: 'Area ombreggiata: notte', model: 'Previsione del modello · ora locale' },
  es: { eyebrow: 'Condiciones hora a hora', title: 'Mira cómo cambian las condiciones', metric: 'Elegir datos del gráfico', temperature: 'Temperatura', water: 'Agua', air: 'Aire', wind: 'Viento', gusts: 'Rachas', tide: 'Marea', hint: 'Arrastra o selecciona la curva para actualizar el resumen. También puedes usar las teclas de flecha.', choose: 'Elegir una hora del pronóstico', night: 'Área sombreada: noche', model: 'Pronóstico del modelo · hora local' },
}
for (const language of LANGUAGES) translations[language.code].timeline = timelineMessages[language.code]

const sceneMessages = {
  hu: { nightLabel: "Éjszakai úszás", nightTitle: "Sötétben fokozott óvatosság szükséges.", nightText: "Sötétben nehezebb tájékozódni és észrevenni a bajba jutott úszót. Válassz inkább nappali időpontot.", scales: 'Jelmagyarázat és skálák', previousHour: 'Előző időpont', nextHour: 'Következő időpont', unifiedHint: 'Húzd a jelölőt a tájon, vagy válassz órát alul. Az idősáv oldalra görgethető; a fenti összefoglaló követi a választást.', separateScales: 'Külön skálák · becsült vízszint' },
  en: { nightLabel: "Night swimming", nightTitle: "Take extra care after dark.", nightText: "In darkness it is harder to navigate and spot a swimmer in difficulty. Choose a daylight swim instead.", scales: 'Legend and scales', previousHour: 'Previous time', nextHour: 'Next time', unifiedHint: 'Drag across the scene or choose an hour below. Scroll the timeline sideways; the summary above follows your selection.', separateScales: 'Separate scales · estimated sea level' },
  fr: { nightLabel: "Baignade nocturne", nightTitle: "Prudence renforcée après la tombée de la nuit.", nightText: "Dans le noir, il est plus difficile de se repérer et de voir un nageur en difficulté. Privilégiez une baignade de jour.", scales: 'Légende et échelles', previousHour: 'Horaire précédent', nextHour: 'Horaire suivant', unifiedHint: 'Faites glisser sur le paysage ou choisissez une heure. La frise défile horizontalement et le résumé suit votre sélection.', separateScales: 'Échelles distinctes · niveau marin estimé' },
  it: { nightLabel: "Nuoto notturno", nightTitle: "Serve maggiore cautela dopo il tramonto.", nightText: "Al buio è più difficile orientarsi e vedere un nuotatore in difficoltà. Preferisci un orario diurno.", scales: 'Legenda e scale', previousHour: 'Orario precedente', nextHour: 'Orario successivo', unifiedHint: 'Trascina sul paesaggio o scegli un’ora. Scorri la sequenza lateralmente; il riepilogo segue la selezione.', separateScales: 'Scale separate · livello marino stimato' },
  es: { nightLabel: "Natación nocturna", nightTitle: "Extrema la precaución al anochecer.", nightText: "En la oscuridad es más difícil orientarse y ver a un nadador en apuros. Elige un horario diurno.", scales: 'Leyenda y escalas', previousHour: 'Hora anterior', nextHour: 'Hora siguiente', unifiedHint: 'Arrastra sobre el paisaje o elige una hora. Desplaza la línea temporal lateralmente; el resumen sigue tu selección.', separateScales: 'Escalas separadas · nivel del mar estimado' },
}
for (const language of LANGUAGES) Object.assign(translations[language.code].timeline, sceneMessages[language.code])


const conditionMessages = {"hu": {"light": "Gyenge", "moderate": "Mérsékelt", "strong": "Erős", "offshore": "Parttól kifelé", "onshore": "Part felé", "alongshore": "Part mentén", "unknownDirection": "Irány nem ismert", "mildGusts": "Enyhe lökések", "livelyGusts": "Élénk lökések", "strongGusts": "Erős lökések", "rising": "Emelkedik", "falling": "Csökken", "steady": "Alig változik", "unknown": "Nem ismert", "high": "Dagály", "low": "Apály", "details": "Részletek és jelmagyarázat"}, "en": {"light": "Light", "moderate": "Moderate", "strong": "Strong", "offshore": "Blowing offshore", "onshore": "Blowing onshore", "alongshore": "Along the shore", "unknownDirection": "Direction unknown", "mildGusts": "Mild gusts", "livelyGusts": "Lively gusts", "strongGusts": "Strong gusts", "rising": "Rising", "falling": "Falling", "steady": "Little change", "unknown": "Unknown", "high": "High tide", "low": "Low tide", "details": "Details and legend"}, "fr": {"light": "Faible", "moderate": "Modéré", "strong": "Fort", "offshore": "Vers le large", "onshore": "Vers la côte", "alongshore": "Le long de la côte", "unknownDirection": "Direction inconnue", "mildGusts": "Faibles rafales", "livelyGusts": "Rafales soutenues", "strongGusts": "Fortes rafales", "rising": "Montante", "falling": "Descendante", "steady": "Peu de changement", "unknown": "Inconnu", "high": "Marée haute", "low": "Marée basse", "details": "Détails et légende"}, "it": {"light": "Debole", "moderate": "Moderato", "strong": "Forte", "offshore": "Verso il largo", "onshore": "Verso la costa", "alongshore": "Lungo la costa", "unknownDirection": "Direzione sconosciuta", "mildGusts": "Raffiche lievi", "livelyGusts": "Raffiche sostenute", "strongGusts": "Raffiche forti", "rising": "Sale", "falling": "Scende", "steady": "Poco variabile", "unknown": "Sconosciuto", "high": "Alta marea", "low": "Bassa marea", "details": "Dettagli e legenda"}, "es": {"light": "Suave", "moderate": "Moderado", "strong": "Fuerte", "offshore": "Hacia mar abierto", "onshore": "Hacia la costa", "alongshore": "Paralelo a la costa", "unknownDirection": "Dirección desconocida", "mildGusts": "Rachas suaves", "livelyGusts": "Rachas intensas", "strongGusts": "Rachas fuertes", "rising": "Sube", "falling": "Baja", "steady": "Poco cambio", "unknown": "Desconocido", "high": "Pleamar", "low": "Bajamar", "details": "Detalles y leyenda"}}
for (const language of LANGUAGES) Object.assign(translations[language.code].conditions, conditionMessages[language.code])

const lakeMessages = {"en": {"filter": "Water type", "all": "All", "coastal": "Sea", "lake": "Lake", "label": "Lake bathing site", "title": "Check lake conditions on site.", "description": "Check local conditions before entering. Any official lake observations are shown separately with their source and date; they do not provide a swimming recommendation.", "forecast": "Weather forecast", "air": "Air temperature"}, "hu": {"filter": "Víztípus", "all": "Mind", "coastal": "Tenger", "lake": "Tó", "label": "Tavi fürdőhely", "title": "Ellenőrizd a tó állapotát a helyszínen.", "description": "Vízbe lépés előtt ellenőrizd a helyi körülményeket. Az elérhető hivatalos tavi méréseket külön, forrással és dátummal mutatjuk; ezek nem jelentenek úszási ajánlást.", "forecast": "Időjárás-előrejelzés", "air": "Levegő hőmérséklete"}, "fr": {"filter": "Type d’eau", "all": "Tous", "coastal": "Mer", "lake": "Lac", "label": "Baignade en lac", "title": "Vérifiez les conditions du lac sur place.", "description": "Vérifiez les conditions locales avant d’entrer. Les mesures officielles disponibles sont présentées séparément avec leur source et date ; elles ne recommandent pas la baignade.", "forecast": "Prévisions météo", "air": "Température de l’air"}, "it": {"filter": "Tipo di acqua", "all": "Tutti", "coastal": "Mare", "lake": "Lago", "label": "Balneazione lacustre", "title": "Controlla le condizioni del lago sul posto.", "description": "Controlla le condizioni locali prima di entrare. Le misure ufficiali disponibili sono mostrate separatamente con fonte e data; non sono una raccomandazione di nuoto.", "forecast": "Previsioni meteo", "air": "Temperatura dell’aria"}, "es": {"filter": "Tipo de agua", "all": "Todos", "coastal": "Mar", "lake": "Lago", "label": "Zona de baño en lago", "title": "Comprueba el estado del lago en el lugar.", "description": "Comprueba las condiciones locales antes de entrar. Las mediciones oficiales disponibles se muestran por separado con fuente y fecha; no son una recomendación de baño.", "forecast": "Previsión meteorológica", "air": "Temperatura del aire"}}
for (const language of LANGUAGES) translations[language.code].lake = lakeMessages[language.code]

const compassPoints = {
  en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  fr: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
  it: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
  es: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'],
  hu: ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'],
}

function getValue(dictionary, key) {
  return key.split('.').reduce((value, part) => value?.[part], dictionary)
}

export function makeTranslator(language) {
  return (key, variables = {}) => {
    const template = getValue(translations[language], key) ?? getValue(translations.en, key) ?? key
    return String(template).replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? `{${name}}`)
  }
}

export function localeFor(language) {
  return LANGUAGES.find((item) => item.code === language)?.locale ?? LANGUAGES[0].locale
}

export function compassFor(language) {
  return compassPoints[language] ?? compassPoints.en
}
