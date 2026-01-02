import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PricingPage from './pages/PricingPage';
import Contact from './pages/Contact';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import Onboarding from './pages/Onboarding';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';


import DashboardLayout from './components/layouts/DashboardLayout';
import Assistant from './pages/Assistant';
import Pathways from './pages/Pathways';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><div className="flex-1"><Home /></div><Footer /></>} />
          <Route path="/pricing" element={<><Navbar /><div className="flex-1"><PricingPage /></div><Footer /></>} />
          <Route path="/contact" element={<><Navbar /><div className="flex-1"><Contact /></div><Footer /></>} />
          <Route path="/login" element={<><Navbar /><div className="flex-1"><LoginPage /></div><Footer /></>} />
          <Route path="/signup" element={<><Navbar /><div className="flex-1"><SignupPage /></div><Footer /></>} />
          <Route path="/forgot-password" element={<><Navbar /><div className="flex-1"><ForgotPasswordPage /></div><Footer /></>} />
          <Route path="/onboarding" element={<><Navbar /><div className="flex-1"><Onboarding /></div><Footer /></>} />

          {/* Private Routes (Dashboard Layout) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<ProfessionalDashboard />} />
            <Route path="/recruiter" element={<RecruiterDashboard />} />
            <Route path="/pathways" element={<Pathways />} />
            <Route path="/assistant" element={<Assistant />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
