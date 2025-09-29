import { useEffect, useState } from "react";
import axios from "axios";
import ChessBoard from "../components/ChessBoard"

export default function Home() {
    const [games, setGames] = useState([]);

    useEffect(() => {
        async function getUserData() {
            try {
                const token = localStorage.getItem("token");

                let gameTypes = localStorage.getItem("gameTypes");
                if (!gameTypes && token) {
                    const response = await axios.get("http://127.0.0.1:8080/api/games/", {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (response.status === 200) {
                        localStorage.setItem("gameTypes", JSON.stringify(response.data.data));
                        setGames(JSON.parse(gameTypes));
                    }
                } else if (gameTypes) {
                    setGames(JSON.parse(gameTypes));
                }

                let userData = localStorage.getItem("userData");
                if (!userData && token) {
                    const response = await axios.get("http://127.0.0.1:8080/api/users/info", {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (response.status === 200) {
                        localStorage.setItem("userData", JSON.stringify(response.data));
                    }
                }
            } catch (error) {
                console.error("SignUp error:", error.response?.data || error.message);
            }
        }

        getUserData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-900 px-6 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-white justify-center">
                {games.map((item, index) => (
                    <div
                        key={index}
                        className="bg-gray-800 w-40 rounded-xl px-4 py-2 shadow-md hover:shadow-lg hover:bg-gray-700 cursor-pointer transition-all w-full max-w-[160px]"
                    >
                        {item.name ?? JSON.stringify(item)}
                    </div>
                ))}

            </div>
            <div className="flex flex-col items-center justify-center bg-gray-900 mt-8">
                <ChessBoard size={500} />
            </div>
        </div>
    );
}
