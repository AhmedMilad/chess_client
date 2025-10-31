import { useLocation, useParams } from "react-router-dom";
import ChessBoard from "../components/ChessBoard";

export default function GamePage() {
  const { id } = useParams();
  const location = useLocation();
  const socketMessage = location.state?.message;

  if (!socketMessage) {
    return <div className="text-white p-6">Waiting for game to start...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <h2 className="text-white text-2xl mb-4">Game #{id}</h2>
      <ChessBoard size={500} message={socketMessage} />
    </div>
  );
}
