import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polygon, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

const center = [21.8853, -102.2916];
const states = ["Activo", "Temporalmente cerrado"];
const emptyFilters = { search: "", category: "", status: "" };
const toLatLng = ([longitude, latitude]) => [latitude, longitude];

function MapClicks({ onClick }) {
  useMapEvents({ click: ({ latlng }) => onClick([latlng.lng, latlng.lat]) });
  return null;
}

function MapResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function CategoryOptions({ categories }) {
  return categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>);
}

function StateOptions() {
  return states.map((status) => <option key={status}>{status}</option>);
}

function PointForm({ record, coordinates, categories, busy, onSave, onCancel }) {
  return <form onSubmit={(event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const { longitude, latitude, ...details } = fields;
    onSave({ ...details, geometry: { type: "Point", coordinates: record ? [Number(longitude), Number(latitude)] : coordinates } });
  }}>
    <label>Nombre<input name="name" required maxLength={100} defaultValue={record?.name} /></label>
    <label>Descripción<textarea name="description" required maxLength={500} defaultValue={record?.description} /></label>
    <label>Categoría<select name="category" required defaultValue={record?.category?._id || ""}>
      <option value="">Selecciona una categoría</option><CategoryOptions categories={categories} />
    </select></label>
    {!categories.length && <span>Crea una categoría en Catálogos.</span>}
    <label>Estado<select name="status" defaultValue={record?.status}><StateOptions /></select></label>
    {record && <>
      <label>Longitud<input name="longitude" type="number" step="any" min={-180} max={180} required defaultValue={coordinates[0]} /></label>
      <label>Latitud<input name="latitude" type="number" step="any" min={-90} max={90} required defaultValue={coordinates[1]} /></label>
    </>}
    <div className="actions"><button disabled={busy || !categories.length}>Guardar</button>
      <button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancelar</button></div>
  </form>;
}

function PointMarker({ record, categories, busy, change }) {
  const [editing, setEditing] = useState(false);
  return <CircleMarker center={toLatLng(record.geometry.coordinates)} radius={12}
    pathOptions={{ color: "#fff", weight: 2, fillColor: record.status === states[0] ? "#086652" : "#a65f19", fillOpacity: 1 }}>
    <Popup minWidth={205} maxWidth={258} maxHeight={320}>
      {editing ? <PointForm record={record} coordinates={record.geometry.coordinates} categories={categories} busy={busy}
        onCancel={() => setEditing(false)} onSave={async (body) => {
          if (await change("locations", "PUT", record._id, body)) setEditing(false);
        }} /> : <>
        <strong>{record.name}</strong>
        <p>{record.description}</p>
        <p>{record.category?.name || "Sin categoría"} · {record.status}</p>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setEditing(true)}>Editar</button>
          <button type="button" className="danger" disabled={busy} onClick={() => {
            if (window.confirm("¿Eliminar " + record.name + "?")) change("locations", "DELETE", record._id);
          }}>Eliminar</button>
        </div>
      </>}
    </Popup>
  </CircleMarker>;
}

export default function MapView({ api, notice, notify }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState(null);
  const [zones, setZones] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [revision, setRevision] = useState(0);
  const [mode, setMode] = useState("browse");
  const [draft, setDraft] = useState(null);
  const [vertices, setVertices] = useState([]);
  const [editingZone, setEditingZone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    function closeOnEscape(event) {
      if (event.key === "Escape") setExpanded(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [expanded]);

  useEffect(() => {
    const controller = new AbortController();
    api("/categories", { signal: controller.signal }).then(({ data }) => setCategories(data)).catch((error) => {
      if (error.name !== "AbortError") notify({ text: error.message, error: true });
    });
    return () => controller.abort();
  }, [api, notify]);

  useEffect(() => {
    const controller = new AbortController();
    api("/zones", { signal: controller.signal }).then(({ data }) => setZones(data)).catch((error) => {
      if (error.name !== "AbortError") notify({ text: error.message, error: true });
    });
    return () => controller.abort();
  }, [api, notify]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
    api("/locations?" + query, { signal: controller.signal }).then(({ data }) => {
      setLocations(data);
      setLocationError("");
    }).catch((error) => {
      if (error.name !== "AbortError") setLocationError(error.message);
    });
    return () => controller.abort();
  }, [api, filters, revision]);

  async function change(resource, method, id, body) {
    setBusy(true);
    notify(null);
    try {
      const result = await api("/" + resource + (id ? "/" + id : ""), { method, body });
      if (resource === "locations") {
        setRevision((value) => value + 1);
      } else {
        setZones((records) => {
          if (method === "POST") return [...records, result.data];
          if (method === "PUT") return records.map((record) => record._id === id ? result.data : record);
          return records.filter((record) => record._id !== id);
        });
      }
      notify({ text: result.message });
      return true;
    } catch (error) {
      notify({ text: error.message, error: true });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function selectMode(nextMode, zone = null) {
    setMode(nextMode);
    setDraft(null);
    setEditingZone(zone);
    setVertices(zone ? zone.geometry.coordinates[0].slice(0, -1) : []);
  }

  function onMapClick(coordinates) {
    if (busy) return;
    if (mode === "point") setDraft(coordinates);
    if (mode === "zone" && vertices.length < 200) setVertices((current) => [...current, coordinates]);
  }

  async function saveZone(event) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    const geometry = { type: "Polygon", coordinates: [[...vertices, vertices[0]]] };
    if (await change("zones", editingZone ? "PUT" : "POST", editingZone?._id, { name, geometry })) selectMode("browse");
  }

  return <>
    <div className="heading">
      <h1>Mapa de reciclaje</h1>
      <div className="actions">
        <button disabled={busy} aria-pressed={mode === "point"} className={mode === "point" ? "active-tool" : ""} onClick={() => selectMode("point")}>Nuevo punto</button>
        <button disabled={busy} aria-pressed={mode === "zone"} className={mode === "zone" ? "active-tool" : "secondary"} onClick={() => selectMode("zone")}>Dibujar zona</button>
      </div>
    </div>
    <section className={"panel map-panel" + (expanded ? " map-expanded" : "")} aria-label="Mapa y filtros">
      <div className="map-actions">
        <button className="secondary filter-toggle" type="button" aria-expanded={showFilters} aria-controls="map-filters" onClick={() => setShowFilters(!showFilters)}>Filtros</button>
        <button className="secondary" type="button" aria-pressed={expanded} onClick={() => { setExpanded(!expanded); setShowFilters(false); }}>{expanded ? "Salir del mapa ampliado" : "Ampliar mapa"}</button>
      </div>
      {expanded && notice && <p className={"feedback " + (notice.error ? "error" : "success")} role={notice.error ? "alert" : "status"}>{notice.text}</p>}
      <form id="map-filters" className={"filters" + (showFilters ? " filters-open" : "")} onSubmit={(event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        setFilters({ ...values, search: values.search.trim() });
        setShowFilters(false);
      }} onReset={() => setFilters(emptyFilters)}>
        <label>Nombre<input name="search" type="search" maxLength={100} /></label>
        <label>Categoría<select name="category"><option value="">Todas</option><CategoryOptions categories={categories} /></select></label>
        <label>Estado<select name="status"><option value="">Todos</option><StateOptions /></select></label>
        <div className="actions"><button>Aplicar</button><button className="secondary" type="reset">Limpiar</button></div>
      </form>
      {mode !== "browse" && <div className="map-tools">
        <p>{mode === "point" ? "Elige un punto en el mapa." : "Marca al menos tres vértices."}</p>
        {mode === "zone" && <form key={editingZone?._id || "new"} className="zone-form" onSubmit={saveZone}>
          <label>Nombre de la zona<input name="name" defaultValue={editingZone?.name} required maxLength={100} /></label>
          <span>{vertices.length} vértices</span>
          <button disabled={busy || vertices.length < 3}>Guardar zona</button>
          <button type="button" className="secondary" disabled={busy || !vertices.length} onClick={() => setVertices(vertices.slice(0, -1))}>Quitar último</button>
          {editingZone && <button type="button" className="secondary" disabled={busy || !vertices.length} onClick={() => setVertices([])}>Redibujar zona</button>}
        </form>}
        <button disabled={busy} type="button" className="secondary" onClick={() => selectMode("browse")}>Cancelar</button>
      </div>}
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} closePopupOnClick={false}>
        <MapResize />
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' maxZoom={19} />
        <MapClicks onClick={onMapClick} />
        {zones.filter((zone) => zone._id !== editingZone?._id).map((zone) => <Polygon key={zone._id} positions={zone.geometry.coordinates[0].map(toLatLng)}
          interactive={mode === "browse"} pathOptions={{ color: "#2c8275" }}>
          <Popup><strong>{zone.name}</strong>
            <div className="actions">
            <button type="button" className="secondary" disabled={busy} onClick={() => selectMode("zone", zone)}>Editar zona</button>
            <button type="button" className="danger" disabled={busy} onClick={() => {
              if (window.confirm("¿Eliminar la zona " + zone.name + "?")) change("zones", "DELETE", zone._id);
            }}>Eliminar zona</button>
            </div>
          </Popup>
        </Polygon>)}
        {locations?.map((record) => <PointMarker key={record._id} record={record} categories={categories} busy={busy} change={change} />)}
        {vertices.length >= 3 ? <Polygon positions={vertices.map(toLatLng)} interactive={false} pathOptions={{ dashArray: "6 5" }} /> :
          <Polyline positions={vertices.map(toLatLng)} interactive={false} />}
        {vertices.map((vertex, index) => <CircleMarker key={index} center={toLatLng(vertex)} radius={4} interactive={false} />)}
        {draft && <Popup key={draft.join(",")} position={toLatLng(draft)} minWidth={205} maxWidth={258} maxHeight={320}>
          <PointForm coordinates={draft} categories={categories} busy={busy} onCancel={() => selectMode("browse")}
            onSave={async (body) => { if (await change("locations", "POST", null, body)) selectMode("browse"); }} />
        </Popup>}
      </MapContainer>
    </section>
    <section className="panel table-panel">
      <div className="table-heading"><h2>Ubicaciones registradas</h2>{locations && <span>{locations.length} {locations.length === 1 ? "registro" : "registros"}</span>}</div>
      {locationError && <p className="feedback error" role="alert">{locationError}</p>}
      {!locations && !locationError && <p role="status">Cargando ubicaciones…</p>}
      {locations?.length === 0 && <p className="muted">Sin ubicaciones.</p>}
      {!!locations?.length && <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de ubicaciones"><table>
        <thead><tr>{["Nombre", "Descripción", "Categoría", "Estado", "Longitud", "Latitud", "Creación", "Última edición"].map((title) => <th key={title} scope="col">{title}</th>)}</tr></thead>
        <tbody>{locations.map((record) => <tr key={record._id}>
          <th scope="row">{record.name}</th><td>{record.description}</td><td>{record.category?.name || "Sin categoría"}</td><td>{record.status}</td>
          <td>{record.geometry.coordinates[0]}</td><td>{record.geometry.coordinates[1]}</td>
          <td>{new Date(record.createdAt).toLocaleString("es-MX")}</td><td>{new Date(record.updatedAt).toLocaleString("es-MX")}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </>;
}
