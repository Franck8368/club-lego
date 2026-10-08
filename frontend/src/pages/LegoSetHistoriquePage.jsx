import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
import { ArrowLeft, Calendar, Clock, Package, User, BarChart3 } from 'lucide-react';
import axios from 'axios';

const API_URL = '/api';

function LegoSetHistoriquePage() {
  const { legoSetId } = useParams();
  const navigate = useNavigate();
  const [legoSet, setLegoSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLegoSetHistorique();
  }, [legoSetId]);

  const fetchLegoSetHistorique = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/lego_sets/${legoSetId}/historique`);
      setLegoSet(response.data);
      setError('');
    } catch (err) {
      setError('Erreur lors de la récupération de l\'historique du set LEGO');
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

  // Statistiques pour le set LEGO
  const getLegoSetStats = () => {
    if (!legoSet || !legoSet.affectations) return {};
    
    const totalAffectations = legoSet.affectations.length;
    const completedCount = legoSet.affectations.filter(a => a.statut === 'complet').length;
    const inProgressCount = legoSet.affectations.filter(a => a.statut === 'en_cours').length;
    const uniqueEleves = new Set(legoSet.affectations.map(a => a.eleve.id)).size;
    
    // Calcul de la durée moyenne pour les affectations complétées
    let totalDurationMinutes = 0;
    let completedWithDuration = 0;
    
    legoSet.affectations.forEach(aff => {
      if (aff.statut === 'complet' && aff.heure_arrivee && aff.heure_depart) {
        const arrivee = new Date(`2000-01-01T${aff.heure_arrivee}`);
        const depart = new Date(`2000-01-01T${aff.heure_depart}`);
        const diffMinutes = (depart - arrivee) / (1000 * 60);
        totalDurationMinutes += diffMinutes;
        completedWithDuration++;
      }
    });
    
    const avgDuration = completedWithDuration > 0 
      ? Math.round(totalDurationMinutes / completedWithDuration)
      : 0;
    
    const avgHours = Math.floor(avgDuration / 60);
    const avgMinutes = avgDuration % 60;
    const avgDurationText = avgHours > 0 
      ? `${avgHours}h ${avgMinutes}m`
      : `${avgMinutes}m`;
    
    return { 
      totalAffectations, 
      completedCount, 
      inProgressCount, 
      uniqueEleves,
      avgDurationText,
      completedWithDuration
    };
  };

  const stats = getLegoSetStats();

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
        <Button variant="primary" onClick={() => navigate('/lego-sets')}>
          Retour à la liste des sets LEGO
        </Button>
      </div>
    );
  }

  if (!legoSet) {
    return (
      <div className="container my-5">
        <Alert variant="warning">Set LEGO non trouvé</Alert>
        <Button variant="primary" onClick={() => navigate('/lego-sets')}>
          Retour à la liste des sets LEGO
        </Button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="outline-secondary" onClick={() => navigate('/lego-sets')}>
          <ArrowLeft size={20} aria-hidden="true" /> Retour aux sets LEGO
        </Button>
        <h1 className="d-flex align-items-center gap-2 mb-0">
          <Package size={28} aria-hidden="true" />
          Historique du set {legoSet.marque && `${legoSet.marque} `}{legoSet.nom}
        </h1>
      </div>

      {/* Statistiques du set LEGO */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <User size={24} className="text-primary" />
              </div>
              <Card.Title>Élèves</Card.Title>
              <Card.Text className="display-6">{stats.uniqueEleves || 0}</Card.Text>
              <small className="text-muted">uniques</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <Calendar size={24} className="text-primary" />
              </div>
              <Card.Title>Affectations</Card.Title>
              <Card.Text className="display-6">{stats.totalAffectations || 0}</Card.Text>
              <small className="text-muted">totales</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <Package size={24} className="text-success" />
              </div>
              <Card.Title>Terminé</Card.Title>
              <Card.Text className="display-6">{stats.completedCount || 0}</Card.Text>
              <small className="text-muted">fois</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <Package size={24} className="text-warning" />
              </div>
              <Card.Title>En cours</Card.Title>
              <Card.Text className="display-6">{stats.inProgressCount || 0}</Card.Text>
              <small className="text-muted">en progression</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <Clock size={24} className="text-info" />
              </div>
              <Card.Title>Durée moyenne</Card.Title>
              <Card.Text className="display-6">{stats.completedWithDuration > 0 ? stats.avgDurationText : 'N/A'}</Card.Text>
              <small className="text-muted">par réalisation</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-2">
                <BarChart3 size={24} className="text-purple" />
              </div>
              <Card.Title>Pièces</Card.Title>
              <Card.Text className="display-6">{legoSet.nombre_pieces || 'N/A'}</Card.Text>
              <small className="text-muted">nombre</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Informations de base du set LEGO */}
      <Card className="mb-4">
        <Card.Header as="h3">
          <Package size={20} className="me-2" />Informations du set LEGO
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={2}>
              <p><strong>Marque:</strong> {legoSet.marque || 'Non spécifiée'}</p>
            </Col>
            <Col md={2}>
              <p><strong>Numéro:</strong> {legoSet.numero}</p>
            </Col>
            <Col md={2}>
              <p><strong>Nom:</strong> {legoSet.nom}</p>
            </Col>
            <Col md={2}>
              <p><strong>Thème:</strong> {legoSet.theme || 'N/A'}</p>
            </Col>
            <Col md={2}>
              <p><strong>Pièces:</strong> {legoSet.nombre_pieces || 'N/A'}</p>
            </Col>
            <Col md={2}>
              <p><strong>Disponible:</strong> {legoSet.disponible ? 'Oui' : 'Non'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Historique des réalisations par les élèves */}
      <Card>
        <Card.Header as="h3">
          <BarChart3 size={20} className="me-2" />
          Historique des réalisations par les élèves
        </Card.Header>
        <Card.Body>
          {legoSet.affectations && legoSet.affectations.length > 0 ? (
            <>
              <Table striped bordered hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th><User size={16} className="me-1" />Élève</th>
                    <th><Calendar size={16} className="me-1" />Date</th>
                    <th><Clock size={16} className="me-1" />Heure</th>
                    <th><Calendar size={16} className="me-1" />Session</th>
                    <th>Classe</th>
                    <th>Statut</th>
                    <th>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {legoSet.affectations
                    .sort((a, b) => new Date(b.date_affectation) - new Date(a.date_affectation))
                    .map((affectation) => (
                      <tr key={affectation.id}>
                        <td>
                          <strong>{affectation.eleve.prenom} {affectation.eleve.nom}</strong>
                          <br />
                          <small className="text-muted">
                            {affectation.eleve.sexe === 'M' ? 'Garçon' : 'Fille'}
                          </small>
                        </td>
                        <td>{new Date(affectation.date_affectation).toLocaleDateString()}</td>
                        <td>
                          {affectation.heure_arrivee ? affectation.heure_arrivee : 'N/A'} - 
                          {affectation.heure_depart ? affectation.heure_depart : 'N/A'}
                        </td>
                        <td>
                          {new Date(affectation.session.date).toLocaleDateString()} - {affectation.session.creneau}
                        </td>
                        <td>{affectation.eleve.classe}</td>
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
              <div className="mt-3 text-muted">
                <small>Total: {legoSet.affectations.length} réalisation(s)</small>
              </div>
            </>
          ) : (
            <Alert variant="info">
              Ce set LEGO n'a pas encore été réalisé par des élèves.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <div className="mt-4 text-center">
        <Button variant="primary" onClick={() => navigate('/lego-sets')}>
          <ArrowLeft size={20} className="me-2" />
          Retour à la liste des sets LEGO
        </Button>
      </div>
    </div>
  );
}

export default LegoSetHistoriquePage;
