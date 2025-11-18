import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { API_BASE } = useContext(AuthContext);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("Registering...");
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMessage(err.message || "Server error");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Player Registration</h2>
      <form onSubmit={handleRegister} style={styles.form}>
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
        <button type="submit" style={styles.button}>Register</button>
      </form>
      <p style={{ marginTop: "10px" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
      <p style={{ color: message.toLowerCase().includes("successful") ? "green" : "red" }}>{message}</p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", marginTop: "80px", fontFamily: "Segoe UI, sans-serif" },
  form: { display: "inline-block", textAlign: "left", padding: "20px", background: "#f7f7f7", borderRadius: "10px" },
  input: { display: "block", margin: "10px 0", padding: "10px", width: "260px" },
  button: { background: "#C8102E", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" },
};
