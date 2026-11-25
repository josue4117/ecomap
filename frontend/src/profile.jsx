import { useEffect, useState } from "react";

export default function Profile({ api, notify, onUpdate, onDelete }) {
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api("/auth/me", { signal: controller.signal }).then(({ data }) => setProfile(data)).catch((error) => {
      if (error.name !== "AbortError") notify({ text: error.message, error: true });
    });
    return () => controller.abort();
  }, [api, notify]);

  async function submit(event, method) {
    event.preventDefault();
    if (method === "DELETE" && !window.confirm("¿Eliminar tu cuenta y todos tus registros?")) return;
    const form = event.currentTarget;
    setBusy(true);
    notify(null);
    try {
      const { data, message } = await api("/auth/me", { method, body: Object.fromEntries(new FormData(form)) });
      if (method === "DELETE") {
        onDelete();
      } else {
        form.reset();
        setProfile(data);
        onUpdate(data);
        notify({ text: message });
      }
    } catch (error) {
      notify({ text: error.message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="heading"><h1>Mi cuenta</h1></div>
    {profile && <div className="profile-panels">
      <section className="panel">
        <h2>Perfil</h2>
        <form key={JSON.stringify(profile)} onSubmit={(event) => submit(event, "PUT")}>
          <label>Nombre<input name="name" autoComplete="name" required maxLength={100} defaultValue={profile.name} /></label>
          <label>Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={profile.email} /></label>
          <label>Contraseña actual<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={72} /></label>
          <label>Nueva contraseña (opcional)<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} /></label>
          <button disabled={busy}>Guardar perfil</button>
        </form>
      </section>
      <section className="panel">
        <h2>Eliminar cuenta</h2>
        <p>También se eliminarán tus registros.</p>
        <form onSubmit={(event) => submit(event, "DELETE")}>
          <label>Confirma tu contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={72} /></label>
          <button className="danger" disabled={busy}>Eliminar mi cuenta</button>
        </form>
      </section>
    </div>}
  </>;
}
