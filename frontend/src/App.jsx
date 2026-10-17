import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Badge, Container, Nav, Navbar } from 'react-bootstrap';
import { CalendarClock, CalendarDays, CalendarRange, ClipboardList, LayoutDashboard, Package, Users, History, Settings } from 'lucide-react';
import axios from 'axios';
import ElevesPage from './pages/ElevesPage';
import LegoSetsPage from './pages/LegoSetsPage';
import SessionsPage from './pages/SessionsPage';
import AffectationsPage from './pages/AffectationsPage';
import EleveHistoriquePage from './pages/EleveHistoriquePage';
import LegoSetHistoriquePage from './pages/LegoSetHistoriquePage';
import DashboardPage from './pages/DashboardPage';
import ParametresPage from './pages/ParametresPage';

const API_URL = '/api';

function AnneeScolaireBadge() {
  const [parametres, setParametres] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchParametres = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/parametres`);
        setParametres(data);
      } catch (err) {
        setParametres(null);
      }
    };

    const handleUpdate = (event) => setParametres(event.detail);

    fetchParametres();
    window.addEventListener('parametres:updated', handleUpdate);
    return () => window.removeEventListener('parametres:updated', handleUpdate);
  }, [location.pathname]);

  if (!parametres) return null;

  return (
    <Nav.Link
      as={Link}
      to="/parametres"
      className="d-flex align-items-center gap-2"
      title="Gérer l’année scolaire"
      aria-label="Année scolaire en cours et année préparée"
    >
      <Badge bg="light" text="dark" pill className="d-inline-flex align-items-center gap-1">
        <CalendarRange size={14} aria-hidden="true" />
        Année {parametres.annee_scolaire}
      </Badge>
      {parametres.annee_suivante && (
        <Badge bg="warning" text="dark" pill className="d-inline-flex align-items-center gap-1" title="Année scolaire suivante préparée (pas encore active)">
          <CalendarClock size={14} aria-hidden="true" />
          {parametres.annee_suivante} préparée
        </Badge>
      )}
    </Nav.Link>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar bg="primary" expand="lg" className="navbar">
          <Container>
            <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
              <img src="/favicon.ico" alt="" aria-hidden="true" width="32" height="32" className="me-2" />
              Club LEGO
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/" className="d-flex align-items-center gap-2">
                  <LayoutDashboard size={18} aria-hidden="true" />Tableau de bord
                </Nav.Link>
                <Nav.Link as={Link} to="/eleves" className="d-flex align-items-center gap-2">
                  <Users size={18} aria-hidden="true" />élèves
                </Nav.Link>
                <Nav.Link as={Link} to="/lego-sets" className="d-flex align-items-center gap-2">
                  <Package size={18} aria-hidden="true" />Sets LEGO
                </Nav.Link>
                <Nav.Link as={Link} to="/sessions" className="d-flex align-items-center gap-2">
                  <CalendarDays size={18} aria-hidden="true" />Sessions
                </Nav.Link>
                <Nav.Link as={Link} to="/affectations" className="d-flex align-items-center gap-2">
                  <ClipboardList size={18} aria-hidden="true" />Affectations
                </Nav.Link>
                <Nav.Link as={Link} to="/parametres" className="d-flex align-items-center gap-2">
                  <Settings size={18} aria-hidden="true" />Paramètres
                </Nav.Link>
              </Nav>
              <Nav className="align-items-lg-center">
                <AnneeScolaireBadge />
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="mt-4">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/eleves" element={<ElevesPage />} />
            <Route path="/lego-sets" element={<LegoSetsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/affectations" element={<AffectationsPage />} />
            <Route path="/parametres" element={<ParametresPage />} />
            <Route path="/eleves/:eleveId/historique" element={<EleveHistoriquePage />} />
            <Route path="/lego-sets/:legoSetId/historique" element={<LegoSetHistoriquePage />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
