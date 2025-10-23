import { useEffect, useState } from "react";
import axios from "axios";
import GameTypes from "../components/GameTypes";

const token = localStorage.getItem("token");

async function getGameTypes(token) {
    try {
        const stored = localStorage.getItem("gameTypes");
        if (!stored && token) {
            const response = await axios.get("http://127.0.0.1:8080/api/games/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                const data = response.data.data || [];
                localStorage.setItem("gameTypes", JSON.stringify(data));
                return data;
            }
        } else if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("Error fetching game types:", error);
    }
    return [];
}

async function getUserData(token) {
    try {
        const stored = localStorage.getItem("userData");
        if (!stored && token) {
            const response = await axios.get("http://127.0.0.1:8080/api/users/info", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                localStorage.setItem("userData", JSON.stringify(response.data));
                return response.data;
            }
        } else if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("User data error:", error.response?.data || error.message);
    }
    return null;
}

export default function Home() {
    const [games, setGames] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [gameTypes, user] = await Promise.all([
                getGameTypes(token),
                getUserData(token),
            ]);
            setGames(gameTypes);
            setUserData(user);
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white text-xl">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-900 px-6 py-12">
            <div className="flex flex-col items-center justify-center bg-gray-900 mt-8">
                <GameTypes games={games} user={userData} />
            </div>
        </div>
    );
}
