import { Link } from "react-router-dom";

function Navigation() {
  return (
    <div style={{ marginBottom: 30 }}>
      <Link to="/">🏠 Dashboard</Link>

      {" | "}

      <Link to="/matchdays">⚽ Matchdays</Link>

      {" | "}

      <Link to="/predictions">📝 My Predictions</Link>

      {" | "}

      <Link to="/leaderboard">🏆 Leaderboard</Link>

      {" | "}

      <Link to="/admin">👑 Admin</Link>
    </div>
  );
}

export default Navigation;