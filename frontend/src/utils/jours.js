// Jours de la semaine (index 0 = lundi), avec une couleur propre à chaque jour
export const JOURS_SEMAINE = [
  { index: 0, label: 'Lundi', couleur: '#1f77b4' },
  { index: 1, label: 'Mardi', couleur: '#ff7f0e' },
  { index: 2, label: 'Mercredi', couleur: '#2ca02c' },
  { index: 3, label: 'Jeudi', couleur: '#d62728' },
  { index: 4, label: 'Vendredi', couleur: '#9467bd' },
  { index: 5, label: 'Samedi', couleur: '#8c564b' },
  { index: 6, label: 'Dimanche', couleur: '#e377c2' }
];

export const TOUS_LES_JOURS = JOURS_SEMAINE.map((jour) => jour.index);

// Convertit « 2,4 » (ou [2, 4]) en tableau d'entiers triés et dédupliqués.
export const parseJoursSeances = (value) => {
  if (value === null || value === undefined || value === '') return [];
  const parts = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(
    parts
      .map((part) => Number(part))
      .filter((jour) => Number.isInteger(jour) && jour >= 0 && jour <= 6)
  )].sort((a, b) => a - b);
};

// Convertit un tableau d'entiers en chaîne « 2,4 ».
export const formatJoursSeances = (jours) => parseJoursSeances(jours).join(',');

// Renvoie l'index du jour de la semaine d'une date (0 = lundi, 6 = dimanche).
export const getJourSemaineValue = (dateValue) => {
  if (!dateValue) return null;
  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return (parsedDate.getDay() + 6) % 7;
};

// Libellé d'année scolaire (« 2026-2027 ») déduit de la date de début.
export const anneeScolaireDepuisDate = (dateDebut) => {
  if (!dateDebut) return '';
  const [anneeStr, moisStr] = String(dateDebut).split('-');
  const annee = Number(anneeStr);
  const mois = Number(moisStr);
  if (!annee || !mois) return '';
  const debut = mois >= 8 ? annee : annee - 1;
  return `${debut}-${debut + 1}`;
};

// Formate une date locale au format attendu par les <input type="date">.
export const formatDateInput = (dateValue) => {
  const annee = dateValue.getFullYear();
  const mois = String(dateValue.getMonth() + 1).padStart(2, '0');
  const jour = String(dateValue.getDate()).padStart(2, '0');
  return `${annee}-${mois}-${jour}`;
};

// Prochaine date (à partir d'aujourd'hui inclus) tombant sur un jour de séance.
export const prochaineDateDeSeance = (joursSeances) => {
  const jours = parseJoursSeances(joursSeances);
  const aujourdHui = new Date();
  for (let decalage = 0; decalage < 7; decalage += 1) {
    const candidat = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), aujourdHui.getDate() + decalage);
    if (jours.includes((candidat.getDay() + 6) % 7)) {
      return formatDateInput(candidat);
    }
  }
  return formatDateInput(aujourdHui);
};
