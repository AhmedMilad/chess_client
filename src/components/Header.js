import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("gameTypes");
    navigate("/login");
  };

  if (!token) return null;

  return (
    <header className="bg-gray-800 text-white flex justify-between items-center px-6 py-4 shadow-md">
      <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>
        MyApp
      </h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Logout
      </button>
    </header>
  );
}
