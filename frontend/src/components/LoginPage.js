import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login, API_BASE } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      // Expect backend to return { token, name }
      login(data.token, { name: data.name, email });
      setMessage("Login successful! Redirecting...");
      setTimeout(() => navigate("/quiz"), 800);
    } catch (err) {
      setMessage(err.message || "Server error");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Player Login</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
      <p style={{ marginTop: "10px" }}>
        Don’t have an account? <Link to="/register">Register</Link>
      </p>
      <p style={{ color: message.toLowerCase().includes("successful") ? "green" : "red" }}>{message}</p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", marginTop: "80px", fontFamily: "Segoe UI, sans-serif" },
  form: { display: "inline-block", textAlign: "left", padding: "20px", background: "#f7f7f7", borderRadius: "10px" },
  input: { display: "block", margin: "10px 0", padding: "10px", width: "260px" },
  button: { background: "#002366", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" },
};
