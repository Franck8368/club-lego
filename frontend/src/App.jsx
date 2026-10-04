import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { CalendarDays, ClipboardList, LayoutDashboard, Package, Users } from 'lucide-react';
import ElevesPage from './pages/ElevesPage';
import LegoSetsPage from './pages/LegoSetsPage';
import SessionsPage from './pages/SessionsPage';
import AffectationsPage from './pages/AffectationsPage';
import DashboardPage from './pages/DashboardPage';

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
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;