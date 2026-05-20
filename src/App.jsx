import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useUserContext } from './context/UserContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';

import CreateBudget from './pages/CreateBudget';
import BudgetView from './pages/BudgetView';
import RejectedBudgets from './pages/RejectedBudgets';
import History from './pages/History';
import Companies from './pages/Companies';
import Users from './pages/Users';
import Login from './pages/Login';
import PrimeiroAcesso from './pages/PrimeiroAcesso';
import ResetPassword from './pages/ResetPassword';

const Shell = () => (
  <div className="app-container">
    <Header />
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);

const ProtectedRoute = ({ session, children }) => {
  if (!session) {
    return <Navigate replace to="/login" />;
  }
  return children ? children : <Outlet />;
};

function App() {
  const { sessionUser, loading } = useUserContext();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ fontWeight: 600, color: 'var(--on-surface-variant)' }}>Autenticando...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={sessionUser ? <Navigate replace to="/" /> : <Login />} />
      <Route path="/primeiro-acesso" element={sessionUser ? <Navigate replace to="/" /> : <PrimeiroAcesso />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute session={sessionUser} />}>
        {/* Full-screen pages — own top bar, no global shell */}
        <Route path="/novo-orcamento"       element={<CreateBudget />} />
        <Route path="/orcamento/:id"        element={<BudgetView />} />
        <Route path="/orcamento/:id/editar" element={<CreateBudget />} />

        {/* Shell pages — global header + main-content padding */}
        <Route element={<Shell />}>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/reprovados" element={<RejectedBudgets />} />
          <Route path="/historico"  element={<History />} />
          <Route path="/empresas"   element={<Companies />} />
          <Route path="/usuarios"   element={<Users />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
