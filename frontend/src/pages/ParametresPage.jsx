import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { Settings } from 'lucide-react';
import {
  JOURS_SEMAINE,
  anneeScolaireDepuisDate,
  formatJoursSeances,
  parseJoursSeances
} from '../utils/jours';

const API_URL = '/api';

function ParametresPage() {
  const [formData, setFormData] = useState({ date_debut: '', date_fin: '', jours: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchParametres = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/parametres`);
        setFormData({
          date_debut: data.date_debut || '',
          date_fin: data.date_fin || '',
          jours: parseJoursSeances(data.jours_seances)
        });
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
      setFormData({
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        jours: parseJoursSeances(data.jours_seances)
      });
      setSuccess('Paramètres enregistrés');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de l’enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const anneeScolaire = anneeScolaireDepuisDate(formData.date_debut);

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

          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </Button>
        </Form>
      )}
    </div>
  );
}

export default ParametresPage;
