import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectWebSocket, closeWebSocket, socket } from "../utils/websocket";
import { ClipLoader } from "react-spinners";

export default function GameTypes({ games }) {
  const navigate = useNavigate();
  const [SocketMessage, setSocketMessage] = useState(null);
  const [pendingGame, setPendingGame] = useState(null);

  const handleClick = (game) => {
    const token = localStorage.getItem("token");

    const baseURL = process.env.REACT_APP_BACKEND_URL
    if (socket && socket.readyState === WebSocket.OPEN) {
      closeWebSocket()
    }

    connectWebSocket(
      baseURL + `/api/games/${game.id}/play?token=${token}`,
      (msg) => {
        try {
          const data = JSON.parse(msg);

          if (Object.hasOwn(data, "type")) {
            if (data.type === "start_game") {
              setSocketMessage(data);

              navigate(`/games/${data.game_id}`, { state: { message: data } });
            }

            if (data.type === "player_enqueued") {
              if (Object.hasOwn(data, "game_category")) {
                setPendingGame(data.game_category)
              }
            }

            if (data.type === "player_dequeued") {
              setPendingGame(null)
            }
          }

        } catch (error) {

          console.log(error)
          console.error("Invalid message format:", msg);
        }
      },
      () => { },
      () => { },
      (err) => console.error(err)
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-white justify-center">
      {games.map((game, index) => (
        <div
          key={index}
          onClick={() => handleClick(game)}
          className="w-40 h-40 rounded-md flex flex-col items-center justify-center cursor-pointer transition-transform transform hover:scale-105 shadow-md hover:shadow-lg"
          style={{ backgroundColor: "oklch(87.1% 0.006 286.286)" }}
        >
          <span className="text-black font-semibold text-lg">{game.name}</span>
          <span className="text-black">{game.duration} min</span>

          {(() => {

            if (pendingGame !== null && pendingGame.toLowerCase() === game.name.toLowerCase()) {
              return (<ClipLoader
                color="#000000"
                size={18}
                aria-label="Loading"
              />)
            }
          })()}

        </div>
      ))}
    </div>
  );
}
