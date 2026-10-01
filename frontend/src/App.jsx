import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import Rules from "./pages/rules";
import Exam from "./pages/exam";
import Result from "./pages/result";
import AdminLogin from "./pages/adminLogin";
import AdminDashboard from "./pages/adminDashboard";
import Leaderboard from "./pages/leaderboard";
import ManageQuestions from "./pages/manageQuestions";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            USER ROUTES
        ========================== */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/rules/:id"
          element={<Rules />}
        />

        <Route
          path="/exam/:id"
          element={<Exam />}
        />

        <Route
          path="/result/:id"
          element={<Result />}
        />

        <Route
          path="/leaderboard/:id"
          element={<Leaderboard />}
        />


        {/* =========================
            ADMIN ROUTES
        ========================== */}

        <Route
          path="/admin"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/exams/:id/questions"
          element={<ManageQuestions />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;