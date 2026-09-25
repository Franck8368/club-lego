import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], creneau: '', ouvert: true });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_URL}/sessions`);
      setSessions(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des sessions');
    }
  };

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
      setFormData({ date: new Date().toISOString().split('T')[0], creneau: '', ouvert: true });
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestion des Sessions</h1>
        <Button variant="primary" onClick={() => {
          setEditingId(null);
          setFormData({ date: new Date().toISOString().split('T')[0], creneau: '', ouvert: true });
          setShowModal(true);
        }}>Ajouter une session</Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th><th>Date</th><th>Créneau</th><th>Statut</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{session.id}</td>
              <td>{new Date(session.date).toLocaleDateString()}</td>
              <td>{session.creneau}</td>
              <td><Badge bg={session.ouvert ? 'success' : 'secondary'}>{session.ouvert ? 'Ouvert' : 'Fermé'}</Badge></td>
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