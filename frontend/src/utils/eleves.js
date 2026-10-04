export const getNiveauLabel = (classe) => {
  const classeNettoyee = String(classe || '').trim();
  const match = classeNettoyee.match(/^(\d+)\s*(?:e|ème|eme|er|ère)?(?:\s+.*)?$/i);
  return match ? `${match[1]}ème` : classeNettoyee;
};