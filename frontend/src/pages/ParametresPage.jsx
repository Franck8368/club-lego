import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { Settings } from 'lucide-react';
import {
  JOURS_SEMAINE,
  anneeScolaireDepuisDate,
  anneeScolaireSuivante,
  formatJoursSeances,
  parseJoursSeances
} from '../utils/jours';

const API_URL = '/api';

const formatDateFr = (value) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('fr-FR');
};

function ParametresPage() {
  const [parametres, setParametres] = useState(null);
  const [formData, setFormData] = useState({ date_debut: '', date_fin: '', jours: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const applyParametres = (data) => {
    setParametres(data);
    setFormData({
      date_debut: data.date_debut || '',
      date_fin: data.date_fin || '',
      jours: parseJoursSeances(data.jours_seances)
    });
  };

  useEffect(() => {
    const fetchParametres = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/parametres`);
        applyParametres(data);
      } catch (err) {
        setError('Erreur lors de la récupération des paramètres');
      } finally {
        setLoading(false);
      }
    };

    fetchParametres();
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJourToggle = (index) => {
    setFormData((prev) => {
      const jours = prev.jours.includes(index)
        ? prev.jours.filter((jour) => jour !== index)
        : [...prev.jours, index].sort((a, b) => a - b);
      return { ...prev, jours };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.date_debut || !formData.date_fin) {
      setError('Renseignez la date de début et la date de fin de l’année scolaire.');
      return;
    }
    if (formData.date_fin <= formData.date_debut) {
      setError('La date de fin doit être postérieure à la date de début.');
      return;
    }
    if (formData.jours.length === 0) {
      setError('Sélectionnez au moins un jour de séance.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await axios.put(`${API_URL}/parametres`, {
        annee_scolaire: anneeScolaireDepuisDate(formData.date_debut),
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        jours_seances: formatJoursSeances(formData.jours)
      });
      applyParametres(data);
      setSuccess('Paramètres enregistrés');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de l’enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handlePrepareNextYear = async () => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/parametres/nouvelle-annee`);
      setParametres(data);
      setSuccess(
        `Année scolaire ${data.annee_suivante} préparée. L’année en cours (${data.annee_scolaire}) reste active et ses données sont conservées.`
      );
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la préparation de l’année suivante');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPreparation = async () => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const { data } = await axios.delete(`${API_URL}/parametres/nouvelle-annee`);
      setParametres(data);
      setSuccess('Préparation de l’année suivante annulée.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de l’annulation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/parametres/activer-nouvelle-annee`);
      applyParametres(data);
      setShowActivateModal(false);
      setSuccess(
        `Année scolaire ${data.annee_scolaire} activée. Les données des années précédentes sont conservées.`
      );
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de l’activation');
    } finally {
      setActionLoading(false);
    }
  };

  const anneeScolaire = anneeScolaireDepuisDate(formData.date_debut) || parametres?.annee_scolaire;
  const labelSuivante = parametres?.annee_suivante || anneeScolaireSuivante(formData.date_debut);

  return (
    <div>
      <div className="mb-4">
        <h1 className="d-flex align-items-center gap-2 mb-1">
          <Settings size={26} aria-hidden="true" />Paramètres
        </h1>
        <p className="text-muted mb-0">Année scolaire en cours et jours des séances.</p>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Année scolaire</Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="date_debut">
                    <Form.Label>Date de début</Form.Label>
                    <Form.Control
                      type="date"
                      name="date_debut"
                      value={formData.date_debut}
                      onChange={handleFieldChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="date_fin">
                    <Form.Label>Date de fin</Form.Label>
                    <Form.Control
                      type="date"
                      name="date_fin"
                      value={formData.date_fin}
                      onChange={handleFieldChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="annee_scolaire">
                    <Form.Label>Année scolaire</Form.Label>
                    <Form.Control plaintext readOnly value={anneeScolaire || '—'} />
                    <Form.Text className="text-muted">Déduite automatiquement de la date de début.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow-sm">
            <Card.Header>Jours des séances</Card.Header>
            <Card.Body>
              <p className="text-muted small">
                Seuls ces jours apparaîtront dans le tableau de bord (répartition des séances) et
                seront proposés par défaut lors de la création d’une session.
              </p>
              <Row className="g-2">
                {JOURS_SEMAINE.map((jour) => (
                  <Col xs={6} sm={4} lg={3} key={jour.label}>
                    <Form.Check
                      type="checkbox"
                      id={`jour-${jour.index}`}
                      label={jour.label}
                      checked={formData.jours.includes(jour.index)}
                      onChange={() => handleJourToggle(jour.index)}
                    />
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          <Button variant="primary" type="submit" disabled={saving} className="mb-4">
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </Button>
        </Form>
      )}

      {!loading && (
        <Card className="shadow-sm">
          <Card.Header>Nouvelle année scolaire</Card.Header>
          <Card.Body>
            <p className="text-muted small">
              Préparez l’année suivante sans changer l’année en cours. Aucune donnée n’est supprimée
              ni masquée : les élèves, sessions et affectations existants sont conservés et restent
              affichés. L’activation définit la nouvelle année courante ; les nouvelles saisies y
              seront rattachées.
            </p>

            {parametres?.annee_suivante ? (
              <>
                <p className="mb-3">
                  Année préparée : <strong>{parametres.annee_suivante}</strong>
                  {parametres.date_debut_suivante && parametres.date_fin_suivante && (
                    <> (du {formatDateFr(parametres.date_debut_suivante)} au {formatDateFr(parametres.date_fin_suivante)})</>
                  )}
                </p>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => setShowActivateModal(true)}
                  disabled={actionLoading}
                >
                  Activer l’année {parametres.annee_suivante}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleCancelPreparation}
                  disabled={actionLoading}
                >
                  Annuler la préparation
                </Button>
              </>
            ) : (
              <>
                <p className="mb-3">
                  Année en cours : <strong>{parametres?.annee_scolaire || '—'}</strong>
                </p>
                <Button variant="outline-primary" onClick={handlePrepareNextYear} disabled={actionLoading}>
                  Préparer l’année {labelSuivante || 'suivante'}
                </Button>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={showActivateModal} onHide={() => setShowActivateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Activer la nouvelle année scolaire</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Vous allez définir <strong>{parametres?.annee_suivante}</strong> comme année scolaire
            courante.
          </p>
          <p className="mb-0">
            Les données de l’année en cours ({parametres?.annee_scolaire}) ne sont ni supprimées ni
            masquées : elles restent en base et à l’écran. Les nouvelles saisies seront rattachées à
            {' '}{parametres?.annee_suivante}.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActivateModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handleActivate} disabled={actionLoading}>Activer</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ParametresPage;
