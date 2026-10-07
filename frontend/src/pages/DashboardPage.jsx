import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, ProgressBar, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard } from 'lucide-react';
import { getNiveauLabel } from '../utils/eleves';

const API_URL = '/api';

const getClasseSortValue = (classe) => Number((classe.match(/\d+/) || ['0'])[0]);

function DashboardPage() {
  const [eleves, setEleves] = useState([]);
  const [legoSets, setLegoSets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
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
        setAffectations(affectationsRes.data);
      } catch (err) {
        setError('Erreur lors de la récupération des statistiques');
      }
    };

    fetchDashboardData();
  }, []);

  const affectationStats = {
    enCours: affectations.filter((aff) => aff.statut === 'en_cours').length,
    complet: affectations.filter((aff) => aff.statut === 'complet').length,
    nonFini: affectations.filter((aff) => aff.statut === 'non_fini').length
  };
  const setsEnCours = new Set(
    affectations
      .filter((aff) => aff.statut !== 'complet')
      .map((aff) => Number(aff.lego_set_id))
  );
  const setsDisponiblesCount = legoSets.filter(
    (set) => set.disponible !== false && !setsEnCours.has(Number(set.id))
  ).length;
  const totalAffectations = affectations.length;
  const sessionsTriees = [...sessions]
    .sort((sessionA, sessionB) => new Date(sessionB.date) - new Date(sessionA.date));
  const classes = [...new Set(eleves.map((eleve) => getNiveauLabel(eleve.classe)).filter(Boolean))]
    .sort((classeA, classeB) => getClasseSortValue(classeB) - getClasseSortValue(classeA) || classeA.localeCompare(classeB, 'fr'));
  const statistiquesSessions = sessionsTriees.map((session) => {
    const sessionAffectations = affectations.filter(
      (aff) => Number(aff.session_id) === Number(session.id)
    );
    const elevesParClasse = Object.fromEntries(classes.map((classe) => [classe, new Set()]));

    sessionAffectations.forEach((aff) => {
      const eleve = eleves.find((item) => Number(item.id) === Number(aff.eleve_id));
      const niveau = eleve ? getNiveauLabel(eleve.classe) : '';
      if (eleve && elevesParClasse[niveau]) {
        elevesParClasse[niveau].add(Number(eleve.id));
      }
    });

    const setsComplets = new Set(
      sessionAffectations
        .filter((aff) => aff.statut === 'complet')
        .map((aff) => Number(aff.lego_set_id))
    );
    const piecesDesSetsComplets = [...setsComplets]
      .map((setId) => legoSets.find((set) => Number(set.id) === setId)?.nombre_pieces)
      .filter((nombrePieces) => Number.isFinite(Number(nombrePieces)))
      .map(Number);
    const moyennePieces = piecesDesSetsComplets.length
      ? piecesDesSetsComplets.reduce((total, nombrePieces) => total + nombrePieces, 0) / piecesDesSetsComplets.length
      : null;

    return {
      session,
      elevesParClasse,
      setsCompletsCount: setsComplets.size,
      moyennePieces
    };
  });

  const formatFrenchDate = (dateValue) => {
    if (!dateValue) return '—';
    const parsedDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return dateValue;
    return parsedDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="d-flex align-items-center gap-2 mb-1">
            <LayoutDashboard size={26} aria-hidden="true" />Tableau de bord
          </h1>
          <p className="text-muted mb-0">
            Synthèse d’activité · {new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </p>
        </div>
        <Button as={Link} to="/affectations" variant="outline-primary">
          Ouvrir les affectations
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <Card className="h-100 border-start border-4 border-primary shadow-sm">
            <Card.Body>
              <div className="text-muted">Élèves inscrits</div>
              <div className="fs-2 fw-semibold">{eleves.length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="h-100 border-start border-4 border-success shadow-sm">
            <Card.Body>
              <div className="text-muted">Sets disponibles</div>
              <div className="fs-2 fw-semibold">{setsDisponiblesCount}</div>
              <small className="text-muted">sur {legoSets.length} sets au total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="h-100 border-start border-4 border-info shadow-sm">
            <Card.Body>
              <div className="text-muted">Sessions planifiées</div>
              <div className="fs-2 fw-semibold">{sessions.length}</div>
              <small className="text-muted">{sessions.filter((session) => session.ouvert).length} ouvertes</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="h-100 border-start border-4 border-warning shadow-sm">
            <Card.Body>
              <div className="text-muted">Affectations enregistrées</div>
              <div className="fs-2 fw-semibold">{totalAffectations}</div>
              <small className="text-muted">{setsEnCours.size} sets en cours</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <section className="bg-white border rounded p-3 p-md-4 mb-4" aria-labelledby="bilan-constructions">
        <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-3">
          <h2 id="bilan-constructions" className="h5 mb-0">Bilan des constructions</h2>
          <span className="text-muted small">Répartition des affectations par statut</span>
        </div>
        <ProgressBar aria-label="Répartition des statuts d’affectation" className="mb-3" style={{ height: '12px' }}>
          <ProgressBar variant="success" now={affectationStats.complet} max={totalAffectations || 1} key="complet" />
          <ProgressBar variant="danger" now={affectationStats.enCours} max={totalAffectations || 1} key="en-cours" />
          <ProgressBar variant="warning" now={affectationStats.nonFini} max={totalAffectations || 1} key="non-fini" />
        </ProgressBar>
        <Row className="g-3">
          <Col xs={4}>
            <div className="small text-muted">Complets</div>
            <div className="fw-semibold text-success">{affectationStats.complet}</div>
          </Col>
          <Col xs={4}>
            <div className="small text-muted">En cours</div>
            <div className="fw-semibold text-danger">{affectationStats.enCours}</div>
          </Col>
          <Col xs={4}>
            <div className="small text-muted">Non finis</div>
            <div className="fw-semibold text-warning">{affectationStats.nonFini}</div>
          </Col>
        </Row>
      </section>

      <section aria-labelledby="bilan-sessions">
        <div className="d-flex justify-content-between align-items-baseline gap-2 mb-3">
          <h2 id="bilan-sessions" className="h5 mb-0">Activité par session</h2>
          <span className="text-muted small">Toutes les sessions · élèves par classe et constructions terminées</span>
        </div>
        <Table striped hover responsive className="bg-white">
          <thead>
            <tr>
              <th>Date</th>
              <th>Créneau</th>
              <th>État</th>
              <th>Nbre Elèves</th>
              {classes.map((classe) => <th key={classe}>{classe}</th>)}
              <th>Sets complets</th>
              <th>Moyenne de pièces / set complet</th>
            </tr>
          </thead>
          <tbody>
            {statistiquesSessions.length === 0 ? (
              <tr>
                <td colSpan={classes.length + 6} className="text-center text-muted py-4">Aucune session enregistrée.</td>
              </tr>
            ) : statistiquesSessions.map(({ session, elevesParClasse, setsCompletsCount, moyennePieces }) => {
              return (
                <tr key={session.id}>
                  <td>{formatFrenchDate(session.date)}</td>
                  <td>{session.creneau || '—'}</td>
                  <td>
                    <Badge bg={session.ouvert ? 'success' : 'secondary'}>
                      {session.ouvert ? 'Ouverte' : 'Fermée'}
                    </Badge>
                  </td>
                  <td>{Object.values(elevesParClasse).reduce((sum, set) => sum + set.size, 0)}</td>
                  {classes.map((classe) => (
                    <td key={classe}>{elevesParClasse[classe].size}</td>
                  ))}
                  <td>{setsCompletsCount}</td>
                  <td>{moyennePieces === null ? '—' : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(moyennePieces)} pièces`}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <p className="text-muted small mb-0">
          La moyenne porte sur le nombre de pièces des sets marqués complets pour chaque session.
        </p>
      </section>
    </div>
  );
}

export default DashboardPage;