import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { Package, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = '/api';

function LegoSetsPage() {
  const navigate = useNavigate();
  const [legoSets, setLegoSets] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ marque: '', numero: '', nom: '', theme: '', nombre_pieces: 0, disponible: true });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [setsRes, affectationsRes, sessionsRes] = await Promise.all([
        axios.get(`${API_URL}/lego_sets`),
        axios.get(`${API_URL}/affectations`),
        axios.get(`${API_URL}/sessions`)
      ]);
      setLegoSets(setsRes.data);
      setAffectations(affectationsRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      setError('Erreur lors de la récupération des sets LEGO');
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
        await axios.put(`${API_URL}/lego_sets/${editingId}`, formData);
        setSuccess('Set LEGO mis à jour');
      } else {
        await axios.post(`${API_URL}/lego_sets`, formData);
        setSuccess('Set LEGO ajouté');
      }
      fetchData();
      setShowModal(false);
      setFormData({ marque: '', numero: '', nom: '', theme: '', nombre_pieces: 0, disponible: true });
      setEditingId(null);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (set) => {
    setFormData({ marque: set.marque || '', numero: set.numero, nom: set.nom, theme: set.theme || '', nombre_pieces: set.nombre_pieces || 0, disponible: set.disponible });
    setEditingId(set.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce set LEGO ?')) {
      try {
        await axios.delete(`${API_URL}/lego_sets/${id}`);
        setSuccess('Set LEGO supprimé');
        fetchData();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="d-flex align-items-center gap-2 mb-0">
          <Package size={26} aria-hidden="true" />Gestion des Sets LEGO
        </h1>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => {
            setEditingId(null);
            setFormData({ marque: '', numero: '', nom: '', theme: '', nombre_pieces: 0, disponible: true });
            setShowModal(true);
          }}>Ajouter un set</Button>
          <Button variant="outline-secondary" onClick={fetchData} title="Rafraîchir les données">
            🔄 Rafraîchir
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Marque</th><th>Numéro</th><th>Nom</th><th>Thème</th><th>Pièces</th><th>Disponible</th><th>Historique</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {legoSets.map(set => (
            <tr key={set.id}>
              <td>{set.marque || '—'}</td>
              <td>{set.numero}</td>
              <td>{set.nom}</td>
              <td>{set.theme || 'N/A'}</td>
              <td>{set.nombre_pieces || 'N/A'}</td>
              <td>
                {affectations.some((aff) => {
                  const setIdMatch = Number(aff.lego_set_id) === Number(set.id);
                  const statutNotComplete = aff.statut !== 'complet';
                  const sessionIsOpen = sessions.some(s => Number(s.id) === Number(aff.session_id) && s.ouvert);
                  return setIdMatch && statutNotComplete && sessionIsOpen;
                }) ? (
                  <Badge bg="danger">En cours</Badge>
                ) : (
                  <Badge bg={set.disponible ? 'success' : 'secondary'}>{set.disponible ? 'Oui' : 'Non'}</Badge>
                )}
              </td>
              <td>
                <Button 
                  variant="info" 
                  size="sm" 
                  onClick={() => navigate(`/lego-sets/${set.id}/historique`)}
                  title="Voir l'historique des réalisations"
                >
                  <History size={14} />
                </Button>
              </td>
              <td>
                <Button variant="warning" size="sm" onClick={() => handleEdit(set)} className="me-2">Modifier</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(set.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Modifier' : 'Ajouter'} un set LEGO</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Marque</Form.Label>
              <Form.Control type="text" name="marque" value={formData.marque} onChange={handleInputChange} placeholder="LEGO, Mould King, CaDa, Nefeliz…" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Numéro</Form.Label>
              <Form.Control type="text" name="numero" value={formData.numero} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control type="text" name="nom" value={formData.nom} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Thème</Form.Label>
              <Form.Control type="text" name="theme" value={formData.theme} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de pièces</Form.Label>
              <Form.Control type="number" name="nombre_pieces" value={formData.nombre_pieces} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" name="disponible" label="Disponible" checked={formData.disponible} onChange={handleInputChange} />
            </Form.Group>
            <Button variant="primary" type="submit">{editingId ? 'Mettre à jour' : 'Ajouter'}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default LegoSetsPage;