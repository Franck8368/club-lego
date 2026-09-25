import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

function DashboardPage() {
  const [stats, setStats] = useState({ eleves: 0, legoSets: 0, sessions: 0, affectations: 0 });
  const [recentAffectations, setRecentAffectations] = useState([]);
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
                  </tr>
                </thead>
                <tbody>
                  {recentAffectations.map(aff => (
                    <tr key={aff.id}>
                      <td>{aff.id}</td>
                      <td>{aff.eleve?.prenom || 'N/A'} {aff.eleve?.nom || ''}</td>
                      <td>{aff.lego_set?.nom || 'N/A'}</td>
                      <td>{aff.session?.date || 'N/A'} - {aff.session?.creneau || ''}</td>
                      <td>{new Date(aff.date_affectation).toLocaleDateString()}</td>
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