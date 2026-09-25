import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
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
            <Navbar.Brand as={Link} to="/">Club LEGO</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Tableau de bord</Nav.Link>
                <Nav.Link as={Link} to="/eleves">élèves</Nav.Link>
                <Nav.Link as={Link} to="/lego-sets">Sets LEGO</Nav.Link>
                <Nav.Link as={Link} to="/sessions">Sessions</Nav.Link>
                <Nav.Link as={Link} to="/affectations">Affectations</Nav.Link>
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