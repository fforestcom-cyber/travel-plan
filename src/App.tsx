import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TripPage from './pages/TripPage';
import ToolsPage from './pages/ToolsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trip" element={<TripPage />} />
          <Route path="/tools" element={<ToolsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
