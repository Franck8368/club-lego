import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Form, Modal, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { ClipboardList } from 'lucide-react';

const API_URL = '/api';

function AffectationsPage() {
  const [affectations, setAffectations] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [legoSets, setLegoSets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionAffichee, setSessionAffichee] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    eleve_id: '',
    lego_set_id: '',
    session_id: '',
    date_affectation: new Date().toISOString().split('T')[0],
    statut: 'en_cours',
    heure_arrivee: '',
    heure_depart: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchData(); }, []);

  const availableStudents = useMemo(() => eleves, [eleves]);
  const openSessions = useMemo(() => sessions.filter(s => s.ouvert), [sessions]);

  const affectationsAffichees = useMemo(() => {
    if (!sessionAffichee) return affectations;
    return affectations.filter(aff => String(aff.session_id) === sessionAffichee);
  }, [affectations, sessionAffichee]);

  // Fonction pour trouver le set LEGO en cours d'un élève (dans une session précédente)
  const getEleveIncompleteSet = (eleveId, currentSessionId) => {
    if (!eleveId || !currentSessionId) return null;
    
    // Vérifier si l'élève a complété un set dans la session actuelle
    const completedInCurrentSession = affectations.some(
      aff => Number(aff.eleve_id) === Number(eleveId) &&
            Number(aff.session_id) === Number(currentSessionId) &&
            aff.statut === 'complet'
    );
    
    // Si l'élève a complété un set dans cette session, il peut choisir un nouveau set
    if (completedInCurrentSession) return null;
    
    // Créer un mapping des dates de session pour le tri
    const sessionDates = {};
    sessions.forEach(s => {
      sessionDates[s.id] = s.date;
    });
    
    // Trouver toutes les affectations non complètes de cet élève
    const incompleteAffectations = affectations.filter(
      aff => Number(aff.eleve_id) === Number(eleveId) && aff.statut !== 'complet'
    );
    
    // Filtrer celles qui ne sont pas dans la session actuelle
    const previousSessionAffectations = incompleteAffectations.filter(
      aff => Number(aff.session_id) !== Number(currentSessionId)
    );
    
    // Trouver la plus récente par date de session
    if (previousSessionAffectations.length === 0) return null;
    
    previousSessionAffectations.sort((a, b) => {
      const dateA = sessionDates[a.session_id] || '1970-01-01';
      const dateB = sessionDates[b.session_id] || '1970-01-01';
      return dateB.localeCompare(dateA); // Plus récente en premier
    });
    
    return previousSessionAffectations[0];
  };

  // Fonction pour trouver le set que l'élève doit reprendre
  const getEleveRequiredSet = (eleveId, sessionId) => {
    if (!eleveId || !sessionId) return null;
    return getEleveIncompleteSet(eleveId, sessionId);
  };

  const availableLegoSets = useMemo(() => {
    const eleveId = formData.eleve_id;
    const sessionId = formData.session_id;
    
    // Si un élève et une session sont sélectionnés
    if (eleveId && sessionId) {
      const requiredSet = getEleveRequiredSet(eleveId, sessionId);
      
      // Si l'élève a un set en cours dans une session précédente
      if (requiredSet) {
        // Retourner UNIQUEMENT ce set
        return legoSets.filter(set => Number(set.id) === Number(requiredSet.lego_set_id));
      }
    }
    
    // Sinon, retourner les sets disponibles pour la session actuelle
    return legoSets.filter((set) => {
      const isAssigned = affectations.some((aff) => {
        const sameSet = Number(aff.lego_set_id) === Number(set.id);
        const sameSession = sessionId ? Number(aff.session_id) === Number(sessionId) : false;
        const sameEditingAffection = editingId !== null && Number(aff.id) === Number(editingId);
        const isActive = aff.statut !== 'complet';
        return sameSet && sameSession && isActive && !sameEditingAffection;
      });

      return set.disponible !== false && !isAssigned;
    });
  }, [affectations, editingId, formData.eleve_id, formData.session_id, legoSets, sessions]);

  const { setsEnCoursCount, setsDisponiblesCount } = useMemo(() => {
    const setsEnCours = new Set(
      affectations
        .filter((aff) => aff.statut !== 'complet')
        .map((aff) => Number(aff.lego_set_id))
    );
    const setsEnCoursDansInventaire = legoSets.filter((set) => setsEnCours.has(Number(set.id)));
    const setsDisponibles = legoSets.filter(
      (set) => set.disponible !== false && !setsEnCours.has(Number(set.id))
    );

    return {
      setsEnCoursCount: setsEnCoursDansInventaire.length,
      setsDisponiblesCount: setsDisponibles.length
    };
  }, [affectations, legoSets]);

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
    setFormData(prev => {
      const next = { ...prev, [name]: value };

      // Quand on change la session et qu'un élève est déjà sélectionné
      if (name === 'session_id' && next.eleve_id) {
        const requiredSet = getEleveRequiredSet(next.eleve_id, value);
        if (requiredSet) {
          // Auto-sélectionner le set que l'élève doit reprendre
          next.lego_set_id = requiredSet.lego_set_id;
        } else {
          // Sinon, réinitialiser le set
          next.lego_set_id = '';
        }
      }

      // Quand on change l'élève (sans session), réinitialiser le set
      if (name === 'eleve_id' && !next.session_id) {
        next.lego_set_id = '';
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sanitizedData = {
      ...formData,
      heure_arrivee: formData.heure_arrivee || null,
      heure_depart: formData.heure_depart || null
    };

    if (sanitizedData.heure_arrivee && sanitizedData.heure_depart && sanitizedData.heure_depart < sanitizedData.heure_arrivee) {
      setError('Période invalide : l\'heure de départ ne peut pas être avant l\'heure d\'arrivée.');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/affectations/${editingId}`, sanitizedData);
        setSuccess('Affectation mise à jour');
      } else {
        await axios.post(`${API_URL}/affectations`, sanitizedData);
        setSuccess('Affectation ajoutée');
      }
      fetchData();
      setShowModal(false);
      setFormData({
        eleve_id: '',
        lego_set_id: '',
        session_id: '',
        date_affectation: new Date().toISOString().split('T')[0],
        statut: 'en_cours',
        heure_arrivee: '',
        heure_depart: ''
      });
      setEditingId(null);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (affectation) => {
    setFormData({
      eleve_id: affectation.eleve_id,
      lego_set_id: affectation.lego_set_id,
      session_id: affectation.session_id,
      date_affectation: affectation.date_affectation,
      statut: affectation.statut || 'en_cours',
      heure_arrivee: affectation.heure_arrivee || '',
      heure_depart: affectation.heure_depart || ''
    });
    setEditingId(affectation.id);
    setShowModal(true);
  };

  const handleAddSetForSession = (affectation) => {
    setEditingId(null);
    setFormData({
      eleve_id: affectation.eleve_id,
      lego_set_id: '',
      session_id: affectation.session_id,
      date_affectation: affectation.date_affectation,
      statut: 'en_cours',
      heure_arrivee: affectation.heure_arrivee || '',
      heure_depart: affectation.heure_depart || ''
    });
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

  const getStatusLabel = (statut) => {
    const labels = {
      en_cours: 'En cours',
      complet: 'Complet',
      non_fini: 'Non fini'
    };
    return labels[statut] || statut;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="d-flex align-items-center gap-2 mb-0">
          <ClipboardList size={26} aria-hidden="true" />Gestion des Affectations
        </h1>
        <Button variant="primary" onClick={() => {
          setEditingId(null);
          setFormData({
            eleve_id: '',
            lego_set_id: '',
            session_id: '',
            date_affectation: new Date().toISOString().split('T')[0],
            statut: 'en_cours',
            heure_arrivee: '',
            heure_depart: ''
          });
          setShowModal(true);
        }}>Ajouter une affectation</Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Row className="g-3 mb-4" aria-label="Disponibilité des sets LEGO">
        <Col sm={6}>
          <div className="border rounded bg-white p-3 h-100">
            <div className="text-muted">Sets en cours</div>
            <div className="fs-2 fw-semibold text-danger">{setsEnCoursCount}</div>
          </div>
        </Col>
        <Col sm={6}>
          <div className="border rounded bg-white p-3 h-100">
            <div className="text-muted">Sets disponibles</div>
            <div className="fs-2 fw-semibold text-success">{setsDisponiblesCount}</div>
          </div>
        </Col>
      </Row>

      <Form.Group className="mb-3" controlId="filtre-session-affectations">
        <Form.Label>Session à afficher</Form.Label>
        <Form.Select value={sessionAffichee} onChange={e => setSessionAffichee(e.target.value)}>
          <option value="">Toutes les sessions</option>
          {sessions.map(session => (
            <option key={session.id} value={session.id}>{getSessionInfo(session.id)}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Élève</th>
            <th>Set LEGO</th>
            <th>Session</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Heure d'arrivée</th>
            <th>Heure de départ</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {affectationsAffichees.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center">
                {sessionAffichee ? 'Aucune affectation pour cette session.' : 'Aucune affectation.'}
              </td>
            </tr>
          ) : affectationsAffichees.map(aff => (
            <tr key={aff.id}>
              <td>{getEleveName(aff.eleve_id)}</td>
              <td>{getLegoSetName(aff.lego_set_id)}</td>
              <td>{getSessionInfo(aff.session_id)}</td>
              <td>{new Date(aff.date_affectation).toLocaleDateString()}</td>
              <td>{getStatusLabel(aff.statut)}</td>
              <td>{aff.heure_arrivee || '—'}</td>
              <td>{aff.heure_depart || '—'}</td>
              <td>
                <Button variant="secondary" size="sm" onClick={() => handleAddSetForSession(aff)} className="me-2">Nouveau set</Button>
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
              <Form.Label column sm={3}>Élève</Form.Label>
              <Col sm={9}>
                <Form.Select name="eleve_id" value={formData.eleve_id} onChange={handleInputChange} required>
                  <option value="">Sélectionnez un élève</option>
                  {availableStudents.map(eleve => (
                    <option key={eleve.id} value={eleve.id}>{eleve.prenom} {eleve.nom} ({eleve.classe})</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Session</Form.Label>
              <Col sm={9}>
                <Form.Select name="session_id" value={formData.session_id} onChange={handleInputChange} required>
                  <option value="">Sélectionnez une session</option>
                  {openSessions.map(session => (
                    <option key={session.id} value={session.id}>{getSessionInfo(session.id)}</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Set LEGO</Form.Label>
              <Col sm={9}>
                <Form.Select name="lego_set_id" value={formData.lego_set_id} onChange={handleInputChange} required 
                  disabled={!!formData.eleve_id && !!formData.session_id && availableLegoSets.length === 1}>
                  <option value="">Sélectionnez un set</option>
                  {availableLegoSets.map(set => (
                    <option key={set.id} value={set.id}>{set.nom} ({set.numero})</option>
                  ))}
                </Form.Select>
                {formData.eleve_id && formData.session_id && availableLegoSets.length === 1 && (
                  <Form.Text className="text-muted">
                    Cet élève doit reprendre son set en cours.
                  </Form.Text>
                )}
                {formData.eleve_id && formData.session_id && availableLegoSets.length === 0 && (
                  <Form.Text className="text-warning">
                    Aucun set disponible pour cette session.
                  </Form.Text>
                )}
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Date</Form.Label>
              <Col sm={9}>
                <Form.Control type="date" name="date_affectation" value={formData.date_affectation} onChange={handleInputChange} required />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Statut</Form.Label>
              <Col sm={9}>
                <Form.Select name="statut" value={formData.statut} onChange={handleInputChange}>
                  <option value="en_cours">En cours</option>
                  <option value="complet">Complet</option>
                  <option value="non_fini">Non fini</option>
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Heure d'arrivée</Form.Label>
              <Col sm={9}>
                <Form.Control type="time" name="heure_arrivee" value={formData.heure_arrivee} onChange={handleInputChange} />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>Heure de départ</Form.Label>
              <Col sm={9}>
                <Form.Control type="time" name="heure_depart" value={formData.heure_depart} onChange={handleInputChange} />
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