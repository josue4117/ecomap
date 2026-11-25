import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { request } from "./api";
import MapView from "./map-view";
import Catalogs from "./catalogs";
import Profile from "./profile";
import "leaflet/dist/leaflet.css";
import "./styles.css";

function Access({ onSession }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const { data } = await request(register ? "/auth/register" : "/auth/login", { method: "POST", body });
      onSession(data);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="access">
    <section className="intro">
      <span className="brand"><b>♻</b> EcoMapa</span>
      <h1>Reciclaje, punto por punto.</h1>
      <p>Registra centros de acopio, ubica opciones de reciclaje y delimita las zonas de cobertura en un solo mapa.</p>
    </section>
    <section className="access-card">
      <h2>{register ? "Crear cuenta" : "Iniciar sesión"}</h2>
      <form key={register} onSubmit={submit}>
        {register && <label>Nombre<input name="name" autoComplete="name" required maxLength={100} /></label>}
        <label>Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Contraseña<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 8 : 1} maxLength={72} /></label>
        {error && <p className="feedback error" role="alert">{error}</p>}
        <button disabled={busy}>{busy ? "Procesando…" : register ? "Crear cuenta" : "Entrar"}</button>
      </form>
      <button className="secondary" type="button" disabled={busy} onClick={() => { setRegister(!register); setError(""); }}>
        {register ? "Ya tengo cuenta" : "Crear una cuenta"}
      </button>
    </section>
  </main>;
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("ecomapa-session"));
  } catch {
    return null;
  }
}

function Workspace({ session, onExit, onUpdate }) {
  const [view, setView] = useState("map");
  const [notice, setNotice] = useState(null);

  const api = React.useCallback(async (path, options) => {
    try {
      return await request(path, { ...options, token: session.token });
    } catch (error) {
      if (error.status === 401) onExit("Tu sesión terminó. Inicia sesión de nuevo.");
      throw error;
    }
  }, [session.token, onExit]);

  return <>
    <header className="topbar">
      <div className="topbar-inner">
        <span className="brand"><b>♻</b> EcoMapa</span>
        <nav aria-label="Principal">
          <button className={view === "map" ? "selected" : "secondary"} aria-pressed={view === "map"} onClick={() => { setView("map"); setNotice(null); }}>Mapa</button>
          <button className={view === "catalogs" ? "selected" : "secondary"} aria-pressed={view === "catalogs"} onClick={() => { setView("catalogs"); setNotice(null); }}>Catálogos</button>
          <button className={view === "profile" ? "selected" : "secondary"} aria-pressed={view === "profile"} onClick={() => { setView("profile"); setNotice(null); }}>Mi cuenta</button>
        </nav>
        <div className="account"><span>{session.user.name}</span><button className="secondary" onClick={() => onExit()}>Cerrar sesión</button></div>
      </div>
    </header>
    <main className="workspace">
      {notice && <p className={"feedback notice " + (notice.error ? "error" : "success")} role={notice.error ? "alert" : "status"}>{notice.text}</p>}
      {view === "map" && <MapView api={api} notify={setNotice} />}
      {view === "catalogs" && <Catalogs api={api} notify={setNotice} />}
      {view === "profile" && <Profile api={api} notify={setNotice} onUpdate={onUpdate} onDelete={() => onExit()} />}
    </main>
  </>;
}

function App() {
  const [session, setSession] = useState(getSession);
  const [message, setMessage] = useState("");
  const exit = React.useCallback((reason = "") => {
    sessionStorage.removeItem("ecomapa-session");
    setSession(null);
    setMessage(reason);
  }, []);

  function saveSession(data) {
    sessionStorage.setItem("ecomapa-session", JSON.stringify(data));
    setSession(data);
    setMessage("");
  }

  if (session) return <Workspace session={session} onExit={exit} onUpdate={(user) => saveSession({ ...session, user })} />;
  return <>
    {message && <p className="feedback error session-message" role="alert">{message}</p>}
    <Access onSession={saveSession} />
  </>;
}

createRoot(document.getElementById("root")).render(<App />);
