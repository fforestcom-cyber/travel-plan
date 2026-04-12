import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppWrapper from './components/layout/AppWrapper';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import ExpensePage from './pages/ExpensePage';
import NotesPage from './pages/NotesPage';
import ChecklistPage from './pages/ChecklistPage';

function App() {
  return (
    <BrowserRouter>
      <AppWrapper>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/schedule"  element={<SchedulePage />} />
          <Route path="/expense"   element={<ExpensePage />} />
          <Route path="/notes"     element={<NotesPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
        </Routes>
      </AppWrapper>
    </BrowserRouter>
  );
}

export default App;
