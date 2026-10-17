# Checklist de test — Année scolaire

Scénario complet de validation de la fonctionnalité « année scolaire » : paramètres,
étiquetage des données, préparation puis activation de l'année suivante.

À dérouler **avant de fusionner** la branche `feature/annee-scolaire-parametres`.

Objectif principal : vérifier que la préparation / l'activation **ne supprime rien** et
**ne masque rien** : les données de l'année en cours (2026‑2027) doivent rester visibles.

---

## 0. Préparation (sécurité)

- [ ] **Sauvegarder la base** :

  ```powershell
  Copy-Item backend\lego_club.db backend\lego_club.db.bak-avant-test
  ```

- [ ] Lancer l'application (`docker-compose up --build`, ou backend `uvicorn app.main:app --reload` + frontend).
- [ ] **Noter l'état initial** :
  - Année affichée dans le badge de la barre de navigation.
  - Sur le tableau de bord, filtre **« Toutes les années »** : nb **élèves**, **sets disponibles**, **sessions planifiées**, **affectations**, et la **répartition des séances par jour**.

## 1. Paramètres de l'année en cours

- [ ] Aller sur **Paramètres**.
- [ ] Vérifier : `Date de début` = `01/09/2026`, `Date de fin` = `31/08/2027`, **Année scolaire** = **2026‑2027** (déduite automatiquement).
- [ ] Cocher 2 jours de séance (ex. **mardi + jeudi**) → **Enregistrer les paramètres** → message *« Paramètres enregistrés »*.
- [ ] Badge navbar : **« Année 2026‑2027 »** (aucun badge orange).

## 2. Étiquetage 2026‑2027

- [ ] Créer un **élève**.
- [ ] Créer une **session** → le **jour est pré-sélectionné** (prochain jour de séance : mardi ou jeudi).
- [ ] Créer une **affectation** (élève + set + session).
- [ ] *(Optionnel)* Contrôle en base :

  ```powershell
  cd backend
  & ..\.venv\Scripts\python.exe -c "import sqlite3;c=sqlite3.connect('lego_club.db');print(c.execute('select nom,annee_scolaire from eleves').fetchall())"
  ```

  → l'année doit être **`2026-2027`**.

## 3. Tableau de bord

- [ ] Section **« Séances par jour de la semaine »** : **seuls mardi/jeudi** apparaissent (les autres jours configurés comme non-séance sont masqués).
- [ ] Filtre d'année : par défaut **« Toutes les années »** (rien n'est masqué).
- [ ] Bouton **« Générer compte‑rendu »** → les dates sont **pré-remplies** avec l'année scolaire.
  - ⚠️ En local, la **génération du PDF peut échouer** (`reportlab` non installé dans le venv) — vérifier surtout le **pré-remplissage** (OK via Docker).

## 4. Préparer l'année suivante

- [ ] Paramètres → cliquer **« Préparer l'année 2027‑2028 »**.
- [ ] Vérifier : la carte affiche **« Année préparée : 2027‑2028 (du 01/09/2027 au 31/08/2028) »**.
- [ ] **L'année en cours reste 2026‑2027** ; le formulaire de dates **n'a pas changé**.
- [ ] Badge navbar : **« Année 2026‑2027 »** **+** badge orange **« 2027‑2028 préparée »**.
- [ ] **Contrôle clé** : créer encore un **élève** et une **session** → ils doivent rester étiquetés **2026‑2027** (re-vérifier en base si souhaité).

## 5. Annuler la préparation (aller‑retour)

- [ ] Cliquer **« Annuler la préparation »** → le badge orange **disparaît**, la carte revient à l'état initial.
- [ ] **Re-préparer** 2027‑2028.

## 6. Activer la nouvelle année

- [ ] Cliquer **« Activer l'année 2027‑2028 »** → une **modale de confirmation** s'affiche et mentionne explicitement que **les données ne sont ni supprimées ni masquées**.
- [ ] Confirmer.
- [ ] Badge navbar : **« Année 2027‑2028 »** (plus de badge orange).
- [ ] Paramètres : dates = `01/09/2027` → `31/08/2028`, libellé **2027‑2028**.

## 7. Vérification capitale : 2026‑2027 intact

- [ ] Tableau de bord, filtre **« Toutes les années »** : les compteurs **correspondent à l'état initial** (étape 0) — **rien n'a disparu**.
- [ ] Filtre **« 2026‑2027 »** : mêmes données qu'avant.
- [ ] Filtre **« 2027‑2028 »** : **vide** (année vierge), **sauf les sets LEGO** (inventaire permanent).
- [ ] Historique d'un élève 2026‑2027 (`/eleves/:id/historique`) : **toujours accessible**.

## 8. Nouvelles saisies rattachées à 2027‑2028

- [ ] Créer un **élève** / une **session**.
- [ ] Filtre **« 2027‑2028 »** → il(s) apparaît(ssent).
- [ ] Filtre **« 2026‑2027 »** → il(s) **n'apparaît(ssent) pas**.
- [ ] **Sets LEGO** : tous les sets restent visibles quel que soit le filtre.

## 9. Cas limites & erreurs

- [ ] **Date de fin ≤ date de début** → message d'erreur, pas d'enregistrement.
- [ ] **Aucun jour coché** → message d'erreur.
- [ ] **Activer sans préparation** → le bouton d'activation n'est pas proposé (pas de préparation = pas d'activation).
- [ ] **Recharger la page (F5)** après activation → l'année **2027‑2028 persiste** (bien enregistrée en base).

## 10. Revenir en arrière (si besoin)

- [ ] Pour « annuler » l'activation sans perdre de données : Paramètres → remettre `01/09/2026` / `31/08/2027` → **Enregistrer** (le libellé se recalcule en **2026‑2027**).
- [ ] En dernier recours : arrêter le serveur et restaurer `backend\lego_club.db.bak-avant-test`.

---

## Résumé des 3 points qui valident la PR

1. La **préparation** ne change pas l'année courante.
2. L'**activation** conserve toutes les données 2026‑2027 à l'écran.
3. Les nouvelles saisies sont bien **rattachées à 2027‑2028** (année vierge pour ce millésime).
