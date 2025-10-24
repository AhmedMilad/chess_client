import { useState } from "react";
import { connectWebSocket } from "../utils/websocket";
import ChessBoard from "./ChessBoard";

export default function GameTypes({ games }) {
    const [gameStarted, setGameStarted] = useState(false);
    const [socketMessage, setSocketMessage] = useState(null);

    const handleClick = (game) => {
        const token = localStorage.getItem("token");

        connectWebSocket(
            `ws://localhost:8080/api/games/${game.id}/play?token=${token}`,
            (msg) => {
                try {
                    const data = JSON.parse(msg);

                    if (data.type === "start_game") {
                        setGameStarted(true);
                        setSocketMessage(data);
                    }
                } catch (error) {
                    console.error("Invalid message format:", msg);
                }
            },
            () => console.log("Connected!"),
            () => console.log("Disconnected"),
            (err) => console.error(err)
        );
    };

    if (gameStarted) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <ChessBoard size={500} message={socketMessage} />
            </div>
        );
    }

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
                </div>
            ))}
        </div>
    );
}
