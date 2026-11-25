import { useEffect, useState } from "react";

const catalogs = [
  { path: "categories", title: "Categorías", description: "Clasifica las ubicaciones en el mapa." },
  { path: "materials", title: "Materiales", description: "Mantén un inventario de materiales reciclables." },
  { path: "organizations", title: "Organizaciones", description: "Registra a las organizaciones que participan en el reciclaje." },
];

function Catalog({ catalog, api, notify }) {
  const [records, setRecords] = useState(null);
  const [editing, setEditing] = useState(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api("/" + catalog.path, { signal: controller.signal }).then(({ data }) => setRecords(data)).catch((error) => {
      if (error.name !== "AbortError") setLoadError(error.message);
    });
    return () => controller.abort();
  }, [catalog.path, api, revision]);

  async function change(method, id, body) {
    setBusy(true);
    notify(null);
    try {
      const result = await api("/" + catalog.path + (id ? "/" + id : ""), { method, body });
      setEditing(null);
      setLoadError("");
      setRevision((value) => value + 1);
      notify({ text: result.message });
    } catch (error) {
      notify({ text: error.message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return <div className="catalog-layout">
    <section className="panel">
      <h2>{catalog.title}</h2>
      <p className="muted">{catalog.description}</p>
      {loadError && <p className="feedback error" role="alert">{loadError}</p>}
      {!records && !loadError && <p role="status">Cargando…</p>}
      {records?.length === 0 && <p className="muted">Todavía no hay registros.</p>}
      <ul className="records">
        {records?.map((record) => <li key={record._id}>
          <div><strong>{record.name}</strong><p>{record.description}</p></div>
          <div className="actions">
            <button type="button" className="secondary" disabled={busy} onClick={() => setEditing(record)}>Editar</button>
            <button type="button" className="danger" disabled={busy} onClick={() => {
              if (window.confirm("¿Eliminar " + record.name + "?")) change("DELETE", record._id);
            }}>Eliminar</button>
          </div>
        </li>)}
      </ul>
    </section>
    <section className="panel">
      <h2>{editing ? "Editar registro" : "Nuevo registro"}</h2>
      <form key={editing?._id || revision} onSubmit={(event) => {
        event.preventDefault();
        change(editing ? "PUT" : "POST", editing?._id, Object.fromEntries(new FormData(event.currentTarget)));
      }}>
        <label>Nombre<input name="name" defaultValue={editing?.name} required maxLength={100} /></label>
        <label>Descripción<textarea name="description" defaultValue={editing?.description} required maxLength={500} /></label>
        <div className="actions"><button disabled={busy}>Guardar</button>
          {editing && <button type="button" className="secondary" onClick={() => setEditing(null)}>Cancelar</button>}
        </div>
      </form>
    </section>
  </div>;
}

export default function Catalogs({ api, notify }) {
  const [active, setActive] = useState(0);
  return <>
    <div className="heading"><h1>Catálogos de reciclaje</h1></div>
    <nav className="tabs" aria-label="Catálogos">
      {catalogs.map((catalog, index) => <button key={catalog.path} type="button" aria-pressed={active === index} className={active === index ? "" : "secondary"} onClick={() => {
        setActive(index);
        notify(null);
      }}>{catalog.title}</button>)}
    </nav>
    <Catalog key={active} catalog={catalogs[active]} api={api} notify={notify} />
  </>;
}
