import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

function DashboardPage() {
  const [stats, setStats] = useState({ eleves: 0, legoSets: 0, sessions: 0, affectations: 0 });
  const [recentAffectations, setRecentAffectations] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [legoSets, setLegoSets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchRecentAffectations();
  }, []);

  const fetchStats = async () => {
    try {
      const [elevesRes, legoSetsRes, sessionsRes, affectationsRes] = await Promise.all([
        axios.get(`${API_URL}/eleves`),
        axios.get(`${API_URL}/lego_sets`),
        axios.get(`${API_URL}/sessions`),
        axios.get(`${API_URL}/affectations`)
      ]);

      setEleves(elevesRes.data);
      setLegoSets(legoSetsRes.data);
      setSessions(sessionsRes.data);

      setStats({
        eleves: elevesRes.data.length,
        legoSets: legoSetsRes.data.length,
        sessions: sessionsRes.data.length,
        affectations: affectationsRes.data.length
      });
    } catch (err) {
      setError('Erreur lors de la récupération des statistiques');
    }
  };

  const fetchRecentAffectations = async () => {
    try {
      const response = await axios.get(`${API_URL}/affectations`);
      setRecentAffectations(response.data.slice(0, 5));
    } catch (err) {
      setError('Erreur lors de la récupération des affectations');
    }
  };

  const getEleveName = (eleveId) => {
    const eleve = eleves.find(item => item.id === eleveId);
    if (!eleve) return 'N/A';
    return `${eleve.prenom || ''} ${eleve.nom || ''}`.trim() || 'N/A';
  };

  const getLegoSetName = (legoSetId) => {
    const legoSet = legoSets.find(item => item.id === legoSetId);
    return legoSet ? legoSet.nom : 'N/A';
  };

  const formatFrenchDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const parsedDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return dateValue;
    return parsedDate.toLocaleDateString('fr-FR');
  };

  const getSessionInfo = (sessionId) => {
    const session = sessions.find(item => item.id === sessionId);
    if (!session) return 'N/A';
    return `${formatFrenchDate(session.date)} - ${session.creneau || ''}`.trim() || 'N/A';
  };

  return (
    <div>
      <h1 className="mb-4">Tableau de bord</h1>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-primary text-white">
            <Card.Body>
              <Card.Title>élèves</Card.Title>
              <Card.Text className="display-4">{stats.eleves}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <Card.Title>Sets LEGO</Card.Title>
              <Card.Text className="display-4">{stats.legoSets}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-info text-white">
            <Card.Body>
              <Card.Title>Sessions</Card.Title>
              <Card.Text className="display-4">{stats.sessions}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning text-dark">
            <Card.Body>
              <Card.Title>Affectations</Card.Title>
              <Card.Text className="display-4">{stats.affectations}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>Dernières affectations</Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>élève</th>
                    <th>Set LEGO</th>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Heure d'arrivée</th>
                    <th>Heure de départ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAffectations.map(aff => (
                    <tr key={aff.id}>
                      <td>{aff.id}</td>
                      <td>{getEleveName(aff.eleve_id)}</td>
                      <td>{getLegoSetName(aff.lego_set_id)}</td>
                      <td>{getSessionInfo(aff.session_id)}</td>
                      <td>{formatFrenchDate(aff.date_affectation)}</td>
                      <td>{aff.heure_arrivee || '—'}</td>
                      <td>{aff.heure_depart || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;