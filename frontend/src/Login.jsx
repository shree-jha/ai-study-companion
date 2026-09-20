import { useState } from "react";
import axios from "axios";
import {
  Brain,
  Mail,
  Lock,
  User,
  ArrowRight,
} from "lucide-react";

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post("/api/auth/register", {
          name,
          email,
          password,
        });

        // After successful registration,
        // automatically switch to login.
        setIsRegister(false);
        setPassword("");

        setError("");
        alert("Registration successful! Please log in.");
      } else {
        const response = await axios.post("/api/auth/login", {
          email,
          password,
        });

        const data = response.data;

        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            userId: data.userId,
            name: data.name,
            email: data.email,
          })
        );

        onLogin();
      }
    } catch (err) {
      if (err.response?.data) {
        setError(
          typeof err.response.data === "string"
            ? err.response.data
            : "Something went wrong."
        );
      } else {
        setError(
          "Unable to connect to the backend. Make sure Spring Boot is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">

          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Brain
              size={30}
              className="text-white"
            />
          </div>

          <h1 className="text-3xl font-bold mt-4">
            StudyAI
          </h1>

          <p className="text-slate-500 mt-2">
            Your personal AI Study Companion
          </p>

        </div>


        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

          <h2 className="text-2xl font-bold">
            {isRegister
              ? "Create your account"
              : "Welcome back"}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            {isRegister
              ? "Start building your personalized learning journey."
              : "Continue your learning journey."}
          </p>


          {/* Error */}
          {error && (
            <div className="mt-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {error}
            </div>
          )}


          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >

            {/* Name */}
            {isRegister && (
              <div>

                <label className="text-sm font-medium">
                  Name
                </label>

                <div className="relative mt-2">

                  <User
                    size={18}
                    className="absolute left-3 top-3.5 text-slate-400"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your name"
                    required
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                </div>

              </div>
            )}


            {/* Email */}
            <div>

              <label className="text-sm font-medium">
                Email
              </label>

              <div className="relative mt-2">

                <Mail
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  required
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

            </div>


            {/* Password */}
            <div>

              <label className="text-sm font-medium">
                Password
              </label>

              <div className="relative mt-2">

                <Lock
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

            </div>


            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-60"
            >

              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Sign In"}

              {!loading && (
                <ArrowRight size={18} />
              )}

            </button>

          </form>


          {/* Switch */}
          <div className="text-center mt-6 text-sm">

            <span className="text-slate-500">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="ml-1 text-indigo-600 font-semibold hover:text-indigo-700"
            >
              {isRegister
                ? "Sign in"
                : "Create one"}
            </button>

          </div>

        </div>


        <p className="text-center text-xs text-slate-400 mt-6">
          Learn smarter. Understand deeper. Grow consistently.
        </p>

      </div>

    </div>
  );
}

export default Login;