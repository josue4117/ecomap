const base = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

export async function request(path, { token, method = "GET", body, signal } = {}) {
  const response = await fetch(base + path, {
    method, signal,
    headers: {
      ...(token && { Authorization: "Bearer " + token }),
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.message || "No se pudo completar la solicitud");
    error.status = response.status;
    throw error;
  }
  return result;
}
