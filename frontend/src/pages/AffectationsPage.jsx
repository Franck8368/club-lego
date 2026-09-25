import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

function AffectationsPage() {
  const [affectations, setAffectations] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [legoSets, setLegoSets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    eleve_id: '',
    lego_set_id: '',
    session_id: '',
    date_affectation: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [affectationsRes, elevesRes, legoSetsRes, sessionsRes] = await Promise.all([
        axios.get(`${API_URL}/affectations`),
        axios.get(`${API_URL}/eleves`),
        axios.get(`${API_URL}/lego_sets`),
        axios.get(`${API_URL}/sessions`)
      ]);
      setAffectations(affectationsRes.data);
      setEleves(elevesRes.data);
      setLegoSets(legoSetsRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      setError('Erreur lors de la récupération des données');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/affectations/${editingId}`, formData);
        setSuccess('Affectation mise à jour');
      } else {
        await axios.post(`${API_URL}/affectations`, formData);
        setSuccess('Affectation ajoutée');
      }
      fetchData();
      setShowModal(false);
      setFormData({ eleve_id: '', lego_set_id: '', session_id: '', date_affectation: new Date().toISOString().split('T')[0] });
      setEditingId(null);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (affectation) => {
    setFormData({
      eleve_id: affectation.eleve_id,
      lego_set_id: affectation.lego_set_id,
      session_id: affectation.session_id,
      date_affectation: affectation.date_affectation
    });
    setEditingId(affectation.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette affectation ?')) {
      try {
        await axios.delete(`${API_URL}/affectations/${id}`);
        setSuccess('Affectation supprimée');
        fetchData();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const getEleveName = (id) => {
    const eleve = eleves.find(e => e.id === id);
    return eleve ? `${eleve.prenom} ${eleve.nom}` : 'N/A';
  };

  const getLegoSetName = (id) => {
    const set = legoSets.find(l => l.id === id);
    return set ? set.nom : 'N/A';
  };

  const getSessionInfo = (id) => {
    const session = sessions.find(s => s.id === id);
    return session ? `${new Date(session.date).toLocaleDateString()} - ${session.creneau}` : 'N/A';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestion des Affectations</h1>
        <Button variant="primary" onClick={() => {
          setEditingId(null);
          setFormData({ eleve_id: '', lego_set_id: '', session_id: '', date_affectation: new Date().toISOString().split('T')[0] });
          setShowModal(true);
        }}>Ajouter une affectation</Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th><th>élève</th><th>Set LEGO</th><th>Session</th><th>Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {affectations.map(aff => (
            <tr key={aff.id}>
              <td>{aff.id}</td>
              <td>{getEleveName(aff.eleve_id)}</td>
              <td>{getLegoSetName(aff.lego_set_id)}</td>
              <td>{getSessionInfo(aff.session_id)}</td>
              <td>{new Date(aff.date_affectation).toLocaleDateString()}</td>
              <td>
                <Button variant="warning" size="sm" onClick={() => handleEdit(aff)} className="me-2">Modifier</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(aff.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Modifier' : 'Ajouter'} une affectation</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>élève</Form.Label>
              <Col sm={9}>
                <Form.Select name="eleve_id" value={formData.eleve_id} onChange={handleInputChange} required>
                  <option value="">Sélectionnez un élève</option>
                  {eleves.map(eleve => (
                    <option key={eleve.id} value={eleve.id}>{eleve.prenom} {eleve.nom} ({eleve.classe})</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Set LEGO</Form.Label>
              <Col sm={9}>
                <Form.Select name="lego_set_id" value={formData.lego_set_id} onChange={handleInputChange} required>
                  <option value="">Sélectionnez un set</option>
                  {legoSets.map(set => (
                    <option key={set.id} value={set.id}>{set.nom} ({set.numero})</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Session</Form.Label>
              <Col sm={9}>
                <Form.Select name="session_id" value={formData.session_id} onChange={handleInputChange} required>
                  <option value="">Sélectionnez une session</option>
                  {sessions.map(session => (
                    <option key={session.id} value={session.id}>{new Date(session.date).toLocaleDateString()} - {session.creneau}</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Date</Form.Label>
              <Col sm={9}>
                <Form.Control type="date" name="date_affectation" value={formData.date_affectation} onChange={handleInputChange} required />
              </Col>
            </Form.Group>
            <Button variant="primary" type="submit">{editingId ? 'Mettre à jour' : 'Ajouter'}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default AffectationsPage;