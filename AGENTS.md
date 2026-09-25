# Instructions pour Mistral AI

## Contexte du projet
- **Nom** : Club LEGO
- **Description** : Application de gestion pour un club LEGO (élèves, sets, sessions, affectations).
- **Technologies** :
  - Backend : Python (FastAPI), SQLite
  - Frontend : React (create-react-app), Bootstrap, React Router
  - Infrastructure : Docker, docker-compose

---

## Accès au dépôt
- **URL** : `https://github.com/Franck8368/club-lego.git`
- **Action par défaut** : Clone ce dépôt dans un espace de travail temporaire à chaque nouvelle session.

---

## Structure du projet
```
.
├── backend/
│   ├── app/
│   │   ├── crud/          # Logique CRUD
│   │   ├── models/        # Modèles SQLAlchemy
│   │   ├── routes/        # Routes FastAPI
│   │   ├── schemas/       # Schémas Pydantic
│   │   ├── database.py    # Configuration DB
│   │   └── main.py        # Point d'entrée FastAPI
│   ├── requirements.txt   # Dépendances Python
│   ├── Dockerfile         # Configuration Docker backend
│   └── .env              # ⚠️ NE JAMAIS COMMITER
│
├── frontend/
│   ├── public/           # Fichiers statiques (favicon.ico, index.html)
│   ├── src/               # Code React
│   │   ├── App.jsx       # Composant principal
│   │   ├── index.jsx     # Point d'entrée
│   │   └── pages/        # Pages de l'application
│   ├── package.json      # Dépendances npm
│   └── Dockerfile        # Configuration Docker frontend
│
├── docker-compose.yml    # Orchestration Docker
├── Dockerfile            # Dockerfile racine (si utilisé)
└── AGENTS.md             # Ce fichier
```

---

## Règles et bonnes pratiques

### ✅ À faire
- **Toujours créer une nouvelle branche** pour les modifications :
  ```bash
  git checkout -b feature/nouvelle-fonctionnalite
  ```
- **Vérifier les tests** avant de commiter.
- **Respecter le style existant** (indentation, noms de variables, etc.).
- **Documenter les changements** dans les commits (`git commit -m "Ajout de X pour Y"`).

### ❌ À éviter
- **Ne jamais toucher** aux fichiers sensibles :
  - `backend/.env`
  - `backend/db/*` ou `backend/*.db` (bases de données locales)
  - `frontend/node_modules/`
  - `frontend/build/`
  - `**/__pycache__/`
- **Ne pas commiter** de secrets (mots de passe, clés API, etc.).
- **Ne pas forcer les pushes** (`git push --force`) sans raison valable.

---

## Commandes utiles

### Backend
- Installer les dépendances :
  ```bash
  cd backend
  pip install -r requirements.txt
  ```
- Lancer le serveur :
  ```bash
  uvicorn app.main:app --reload
  ```

### Frontend
- Installer les dépendances :
  ```bash
  cd frontend
  npm install
  ```
- Lancer en développement :
  ```bash
  npm start
  ```

### Docker
- Lancer toute l'application :
  ```bash
  docker-compose up --build
  ```

---

## Workflow recommandé
1. **Clone le dépôt** à chaque nouvelle session.
2. **Crée une branche** pour les modifications.
3. **Applique les changements** demandés par l'utilisateur.
4. **Teste** les modifications si possible.
5. **Fournis à l'utilisateur** :
   - Les fichiers modifiés (si petits changements).
   - Les commandes Git pour intégrer les changements localement.

---

## Exemples de demandes courantes
- "Ajoute une page pour gérer les emprunts de sets LEGO."
- "Corrige le formulaire de création d'élève dans le frontend."
- "Optimise la requête SQL pour la liste des sessions."
- "Ajoute un favicon personnalisé." (Déjà fait !)

---

## Notes
- **Langue** : Préfère le français pour les messages et commentaires de code.
- **Priorités** :
  1. Fonctionnalité > Esthétique.
  2. Simplicité > Complexité.
- **Questions** : En cas de doute, demande à l'utilisateur avant de modifier un fichier critique.
