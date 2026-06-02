import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import ChessBoard from "../components/ChessBoard";
import { getBoard } from "../utils/game";
import { connectWebSocket } from "../utils/websocket";

export default function GamePage() {
  const { id } = useParams();
  const location = useLocation();

  const [socketMessage, setSocketMessage] = useState(
    location.state?.message ?? null
  );

  useEffect(() => {
    if (socketMessage) return;

    const token = localStorage.getItem("token");

    const ws = connectWebSocket(
      `ws://localhost:8080/api/games/${id}/reconnect?token=${token}`,
      (msg) => {
        try {
          const data = JSON.parse(msg);

          console.log("received:", data);

          setSocketMessage(data);
        } catch (error) {
          console.error("Invalid message format:", msg);
        }
      },
      () => { },
      () => { },
      (err) => console.error(err)
    );

    return () => {
      ws?.close?.();
    };
  }, [id, socketMessage]);

  if (!socketMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white text-xl">Loading game...</p>
      </div>
    );
  }

  const isBlack = socketMessage?.is_black ?? false;
  const gameBoard = getBoard(isBlack);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <h2 className="text-white text-2xl mb-4">
        Game #{id}
      </h2>

      <ChessBoard
        size={500}
        message={socketMessage}
        gameBoard={gameBoard}
      />
    </div>
  );
}