FROM python:3.11-slim

WORKDIR /app

# 1. Installer les dépendances backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copier le backend
COPY backend/app ./app

# 3. Copier le build du frontend (déjà généré localement)
COPY frontend/build ./frontend/build

EXPOSE 8300

# 4. Lancer SANS --reload (CRUCIAL pour éviter les redémarrages)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8300"]