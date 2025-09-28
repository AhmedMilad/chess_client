import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import axios from "axios";

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const payload = {
            username: data.username,
            password: data.password,
        };

        try {
            const response = await axios.post("http://127.0.0.1:8080/api/login", payload);
            console.log("SignUp successful:", response.status);
            console.log("SignUp successful:", response.data);
        } catch (error) {
            console.error("SignUp error:", error.response?.data || error.message);
        }
    };

    return (
        <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="my-auto text-center text-2xl font-bold text-white">
                    Login in to your account
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="border border-gray-700 rounded-lg bg-gray-800 p-6 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label
                                htmlFor="username"
                                className="block text-sm leading-6 text-white text-left"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                required
                                placeholder="Enter your username"
                                className="block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="block text-sm leading-6 text-white text-left"
                                >
                                    Password
                                </label>
                                <div className="text-sm">
                                    <a
                                        href="https://react.dev/learn"
                                        className="font-semibold text-indigo-400 hover:text-indigo-300"
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    className="block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onMouseDown={() => setShowPassword(true)}
                                    onMouseUp={() => setShowPassword(false)}
                                    onMouseLeave={() => setShowPassword(false)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-md bg-indigo-500 py-2 text-white font-semibold hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                        >
                            Log in
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
