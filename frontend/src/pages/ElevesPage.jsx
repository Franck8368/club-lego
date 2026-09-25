import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

function ElevesPage() {
  const [eleves, setEleves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', classe: '', sexe: 'M' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchEleves(); }, []);

  const fetchEleves = async () => {
    try {
      const response = await axios.get(`${API_URL}/eleves`);
      setEleves(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des élèves');
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
        await axios.put(`${API_URL}/eleves/${editingId}`, formData);
        setSuccess('élève mis à jour avec succés');
      } else {
        await axios.post(`${API_URL}/eleves`, formData);
        setSuccess('élève ajouté avec succés');
      }
      fetchEleves();
      setShowModal(false);
      setFormData({ nom: '', prenom: '', classe: '', sexe: 'M' });
      setEditingId(null);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (eleve) => {
    setFormData({ nom: eleve.nom, prenom: eleve.prenom, classe: eleve.classe, sexe: eleve.sexe });
    setEditingId(eleve.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet élève ?')) {
      try {
        await axios.delete(`${API_URL}/eleves/${id}`);
        setSuccess('élève supprimé avec succés');
        fetchEleves();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestion des élèves</h1>
        <Button variant="primary" onClick={() => {
          setEditingId(null);
          setFormData({ nom: '', prenom: '', classe: '', sexe: 'M' });
          setShowModal(true);
        }}>Ajouter un élève</Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th><th>Nom</th><th>Prénom</th><th>Classe</th><th>Sexe</th><th>Date inscription</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map(eleve => (
            <tr key={eleve.id}>
              <td>{eleve.id}</td>
              <td>{eleve.nom}</td>
              <td>{eleve.prenom}</td>
              <td>{eleve.classe}</td>
              <td>{eleve.sexe}</td>
              <td>{new Date(eleve.date_inscription).toLocaleDateString()}</td>
              <td>
                <Button variant="warning" size="sm" onClick={() => handleEdit(eleve)} className="me-2">Modifier</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(eleve.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Modifier' : 'Ajouter'} un élève</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control type="text" name="nom" value={formData.nom} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Prénom</Form.Label>
              <Form.Control type="text" name="prenom" value={formData.prenom} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Classe</Form.Label>
              <Form.Control type="text" name="classe" value={formData.classe} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sexe</Form.Label>
              <Form.Select name="sexe" value={formData.sexe} onChange={handleInputChange} required>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="Autre">Autre</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">{editingId ? 'Mettre à jour' : 'Ajouter'}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ElevesPage;