import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Users, History } from 'lucide-react';
import { getNiveauLabel } from '../utils/eleves';

const API_URL = '/api';

function ElevesPage() {
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', classe: '', sexe: 'M' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => { fetchEleves(); }, []);

  const elevesTries = useMemo(() => {
    if (!sortConfig.key) return eleves;

    return [...eleves].sort((a, b) => {
      const comparaison = String(a[sortConfig.key] || '').localeCompare(
        String(b[sortConfig.key] || ''),
        'fr',
        { sensitivity: 'base', numeric: true }
      );
      return sortConfig.direction === 'asc' ? comparaison : -comparaison;
    });
  }, [eleves, sortConfig]);

  const statistiquesEleves = useMemo(() => {
    const niveaux = eleves.reduce((comptages, eleve) => {
      if (eleve.classe) {
        const niveau = getNiveauLabel(eleve.classe);
        comptages[niveau] = (comptages[niveau] || 0) + 1;
      }
      return comptages;
    }, {});
    const classesTriees = Object.entries(niveaux).sort(([classeA], [classeB]) => {
      const niveauA = Number((classeA.match(/\d+/) || ['0'])[0]);
      const niveauB = Number((classeB.match(/\d+/) || ['0'])[0]);
      return niveauB - niveauA || classeA.localeCompare(classeB, 'fr');
    });
    const sexesTries = [
      ['Féminin', eleves.filter((eleve) => eleve.sexe === 'F').length],
      ['Masculin', eleves.filter((eleve) => eleve.sexe === 'M').length]
    ];

    return { classesTriees, sexesTries };
  }, [eleves]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortLabel = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' (tri croissant)' : ' (tri décroissant)';
  };

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
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">
        <h1 className="d-flex align-items-center gap-2 mb-0">
          <Users size={26} aria-hidden="true" />Gestion des élèves
        </h1>
        <div className="d-flex flex-wrap gap-3" aria-label="Répartition des élèves">
          <div className="d-flex flex-wrap align-items-center gap-2" aria-label="Nombre d’élèves par niveau">
            <span className="small text-muted">Par niveau</span>
            {statistiquesEleves.classesTriees.length === 0 ? (
              <span className="small text-muted">Aucun élève</span>
            ) : statistiquesEleves.classesTriees.map(([classe, nombre]) => (
              <div key={classe} className="border rounded px-2 py-1 bg-white small text-nowrap">
                {classe} : <strong>{nombre}</strong>
              </div>
            ))}
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2" aria-label="Nombre d’élèves par sexe">
            <span className="small text-muted">Par sexe</span>
            {statistiquesEleves.sexesTries.map(([sexe, nombre]) => (
              <div key={sexe} className="border rounded px-2 py-1 bg-white small text-nowrap">
                {sexe} : <strong>{nombre}</strong>
              </div>
            ))}
          </div>
        </div>
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
            <th aria-sort={sortConfig.key === 'nom' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <Button variant="link" className="p-0 text-dark text-decoration-none" onClick={() => handleSort('nom')}>
                Nom{sortConfig.key === 'nom' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                <span className="visually-hidden">{getSortLabel('nom')}</span>
              </Button>
            </th>
            <th>Prénom</th>
            <th aria-sort={sortConfig.key === 'classe' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <Button variant="link" className="p-0 text-dark text-decoration-none" onClick={() => handleSort('classe')}>
                Classe{sortConfig.key === 'classe' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                <span className="visually-hidden">{getSortLabel('classe')}</span>
              </Button>
            </th>
            <th>Sexe</th><th>Date inscription</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {elevesTries.map(eleve => (
            <tr key={eleve.id}>
              <td>{eleve.nom}</td>
              <td>{eleve.prenom}</td>
              <td>{eleve.classe}</td>
              <td>{eleve.sexe}</td>
              <td>{new Date(eleve.date_inscription).toLocaleDateString()}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => navigate(`/eleves/${eleve.id}/historique`)} className="me-2">Historique</Button>
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