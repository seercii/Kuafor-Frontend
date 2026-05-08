import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointment from "./pages/Appointment"; // importu ekle
import Register from "./pages/Register";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* YENİ EKLENEN ROTA */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Başka rastgele bir yere giderse Login'e at */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/randevu/:kuaforId" element={<Appointment />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
