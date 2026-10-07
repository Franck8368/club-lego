import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
import { ArrowLeft, Calendar, Clock, Package, User, BarChart3 } from 'lucide-react';
import axios from 'axios';

const API_URL = '/api';

function EleveHistoriquePage() {
  const { eleveId } = useParams();
  const navigate = useNavigate();
  const [eleve, setEleve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEleveHistorique();
  }, [eleveId]);

  const fetchEleveHistorique = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/eleves/${eleveId}/historique`);
      setEleve(response.data);
      setError('');
    } catch (err) {
      setError('Erreur lors de la récupération de l\'historique de l\'élève');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'complet':
        return 'success';
      case 'en_cours':
        return 'warning';
      case 'non_fini':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatutText = (statut) => {
    switch (statut) {
      case 'complet':
        return 'Complet';
      case 'en_cours':
        return 'En cours';
      case 'non_fini':
        return 'Non fini';
      default:
        return statut;
    }
  };

  const formatDuration = (heureArrivee, heureDepart) => {
    if (!heureArrivee || !heureDepart) return 'N/A';
    
    const arrivee = new Date(`2000-01-01T${heureArrivee}`);
    const depart = new Date(`2000-01-01T${heureDepart}`);
    const diffMinutes = (depart - arrivee) / (1000 * 60);
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = Math.round(diffMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Statistiques pour l'élève
  const getEleveStats = () => {
    if (!eleve || !eleve.affectations) return {};
    
    const totalSessions = eleve.affectations.length;
    const completedSets = eleve.affectations.filter(a => a.statut === 'complet').length;
    const inProgressSets = eleve.affectations.filter(a => a.statut === 'en_cours').length;
    const uniqueSets = new Set(eleve.affectations.map(a => a.lego_set.id)).size;
    
    return { totalSessions, completedSets, inProgressSets, uniqueSets };
  };

  const stats = getEleveStats();

  if (loading) {
    return (
      <div className="text-center my-5">
        <p>Chargement de l'historique...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/eleves')}>
          Retour à la liste des élèves
        </Button>
      </div>
    );
  }

  if (!eleve) {
    return (
      <div className="container my-5">
        <Alert variant="warning">Élève non trouvé</Alert>
        <Button variant="primary" onClick={() => navigate('/eleves')}>
          Retour à la liste des élèves
        </Button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="outline-secondary" onClick={() => navigate('/eleves')}>
          <ArrowLeft size={20} aria-hidden="true" /> Retour aux élèves
        </Button>
        <h1 className="d-flex align-items-center gap-2 mb-0">
          <User size={28} aria-hidden="true" />
          Historique de {eleve.prenom} {eleve.nom}
        </h1>
      </div>

      {/* Statistiques de l'élève */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <Calendar size={24} className="text-primary" />
              </div>
              <Card.Title>Sessions</Card.Title>
              <Card.Text className="display-6">{stats.totalSessions || 0}</Card.Text>
              <small className="text-muted">participations</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <Package size={24} className="text-success" />
              </div>
              <Card.Title>Sets terminés</Card.Title>
              <Card.Text className="display-6">{stats.completedSets || 0}</Card.Text>
              <small className="text-muted">complets</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <Package size={24} className="text-warning" />
              </div>
              <Card.Title>Sets en cours</Card.Title>
              <Card.Text className="display-6">{stats.inProgressSets || 0}</Card.Text>
              <small className="text-muted">en progression</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <BarChart3 size={24} className="text-info" />
              </div>
              <Card.Title>Sets uniques</Card.Title>
              <Card.Text className="display-6">{stats.uniqueSets || 0}</Card.Text>
              <small className="text-muted">différents essayés</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Informations de base de l'élève */}
      <Card className="mb-4">
        <Card.Header as="h3">
          <User size={20} className="me-2" />Informations de l'élève
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <p><strong>Nom:</strong> {eleve.nom}</p>
              <p><strong>Prénom:</strong> {eleve.prenom}</p>
            </Col>
            <Col md={3}>
              <p><strong>Classe:</strong> {eleve.classe}</p>
              <p><strong>Sexe:</strong> {eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
            </Col>
            <Col md={3}>
              <p><strong>Date d'inscription:</strong> {new Date(eleve.date_inscription).toLocaleDateString()}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Historique des affectations */}
      <Card>
        <Card.Header as="h3">
          <BarChart3 size={20} className="me-2" />
          Historique des participations
        </Card.Header>
        <Card.Body>
          {eleve.affectations && eleve.affectations.length > 0 ? (
            <>
              <Table striped bordered hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th><Calendar size={16} className="me-1" />Date</th>
                    <th><Clock size={16} className="me-1" />Heure</th>
                    <th><Package size={16} className="me-1" />Set LEGO</th>
                    <th>Marque</th>
                    <th>Thème</th>
                    <th>Pièces</th>
                    <th><Calendar size={16} className="me-1" />Session</th>
                    <th>Statut</th>
                    <th>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {eleve.affectations
                    .sort((a, b) => new Date(b.date_affectation) - new Date(a.date_affectation))
                    .map((affectation) => (
                      <tr key={affectation.id}>
                        <td>{new Date(affectation.date_affectation).toLocaleDateString()}</td>
                        <td>
                          {affectation.heure_arrivee ? affectation.heure_arrivee : 'N/A'} - 
                          {affectation.heure_depart ? affectation.heure_depart : 'N/A'}
                        </td>
                        <td>
                          <strong>{affectation.lego_set.nom}</strong>
                          <br />
                          <small className="text-muted">{affectation.lego_set.numero}</small>
                        </td>
                        <td>{affectation.lego_set.marque}</td>
                        <td>{affectation.lego_set.theme || 'N/A'}</td>
                        <td>{affectation.lego_set.nombre_pieces || 'N/A'}</td>
                        <td>
                          {new Date(affectation.session.date).toLocaleDateString()} - {affectation.session.creneau}
                        </td>
                        <td>
                          <Badge bg={getStatutColor(affectation.statut)}>
                            {getStatutText(affectation.statut)}
                          </Badge>
                        </td>
                        <td>{formatDuration(affectation.heure_arrivee, affectation.heure_depart)}</td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </>
          ) : (
            <Alert variant="info">
              Cet élève n'a pas encore participé à de sessions.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <div className="mt-4 text-center">
        <Button variant="primary" onClick={() => navigate('/eleves')}>
          <ArrowLeft size={20} className="me-2" />
          Retour à la liste des élèves
        </Button>
      </div>
    </div>
  );
}

export default EleveHistoriquePage;