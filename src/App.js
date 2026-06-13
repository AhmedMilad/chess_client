import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import SignUp from "./pages/Register";
import GamePage from "./pages/GamePage";
import AnalysisBoard from "./components/AnalysisBoard";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/games/:id" element={<GamePage />} />
          <Route path="/games/:id/analyze" element={<AnalysisBoard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
