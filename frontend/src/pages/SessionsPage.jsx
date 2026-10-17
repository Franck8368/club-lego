import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { CalendarDays } from 'lucide-react';
import { JOURS_SEMAINE, parseJoursSeances, prochaineDateDeSeance } from '../utils/jours';

const API_URL = '/api';

const todayString = () => {
  const now = new Date();
  const mois = String(now.getMonth() + 1).padStart(2, '0');
  const jour = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mois}-${jour}`;
};

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [joursSeances, setJoursSeances] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: todayString(), creneau: '', ouvert: true });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSessions();
    fetchParametres();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_URL}/sessions`);
      setSessions(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des sessions');
    }
  };

  const fetchParametres = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/parametres`);
      const jours = parseJoursSeances(data.jours_seances);
      setJoursSeances(jours);
      // Pré-sélectionne le prochain jour de séance pour une nouvelle saisie
      setFormData((prev) => ({ ...prev, date: prochaineDateDeSeance(jours) }));
    } catch (err) {
      setJoursSeances([]);
    }
  };

  const defaultDate = () => (
    joursSeances.length ? prochaineDateDeSeance(joursSeances) : todayString()
  );

  const joursSeancesLabels = joursSeances
    .map((index) => JOURS_SEMAINE[index]?.label)
    .filter(Boolean)
    .join(', ');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/sessions/${editingId}`, formData);
        setSuccess('Session mise à jour');
      } else {
        await axios.post(`${API_URL}/sessions`, formData);
        setSuccess('Session ajoutée');
      }
      fetchSessions();
      setShowModal(false);
      setFormData({ date: defaultDate(), creneau: '', ouvert: true });
      setEditingId(null);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (session) => {
    setFormData({ date: session.date, creneau: session.creneau, ouvert: session.ouvert });
    setEditingId(session.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette session ?')) {
      try {
        await axios.delete(`${API_URL}/sessions/${id}`);
        setSuccess('Session supprimée');
        fetchSessions();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const formatSessionPeriod = (session) => {
    if (!session?.date) return '—';
    const sessionDate = new Date(`${session.date}T00:00:00`);
    const formattedDate = sessionDate.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const creneauText = session.creneau || 'Créneau non défini';
    return `${formattedDate} • ${creneauText}`;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="d-flex align-items-center gap-2 mb-0">
          <CalendarDays size={26} aria-hidden="true" />Gestion des Sessions
        </h1>
        <Button variant="primary" onClick={() => {
          setEditingId(null);
          setFormData({ date: defaultDate(), creneau: '', ouvert: true });
          setShowModal(true);
        }}>Ajouter une session</Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Période d'ouverture</th><th>Statut</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{formatSessionPeriod(session)}</td>
              <td>
                <Badge
                  bg={session.ouvert ? 'success' : 'dark'}
                  text={session.ouvert ? 'white' : 'light'}
                  pill
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.55rem 0.8rem',
                    letterSpacing: '0.02em',
                    minWidth: '110px',
                    textAlign: 'center',
                    display: 'inline-block'
                  }}
                >
                  {session.ouvert ? 'Ouvert' : 'Fermé'}
                </Badge>
              </td>
              <td>
                <Button variant="warning" size="sm" onClick={() => handleEdit(session)} className="me-2">Modifier</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(session.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Modifier' : 'Ajouter'} une session</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              {joursSeancesLabels && (
                <Form.Text className="text-muted">
                  Jours de séances configurés : {joursSeancesLabels}.
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Créneau (ex: 14h-16h)</Form.Label>
              <Form.Control type="text" name="creneau" value={formData.creneau} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" name="ouvert" label="Ouvert" checked={formData.ouvert} onChange={handleInputChange} />
            </Form.Group>
            <Button variant="primary" type="submit">{editingId ? 'Mettre à jour' : 'Ajouter'}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default SessionsPage;
