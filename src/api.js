const BASE_URL = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = await response.json()
      message = data.message || data.error || message
    } catch {}
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const petApi = {
  owners: {
    all: () => request('/petowner'),
    create: body => request('/petowner', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/petowner/update/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: id => request(`/petowner/${id}`, { method: 'DELETE' })
  },
  pets: {
    all: () => request('/pet'),
    create: (ownerId, body) => request(`/pet?ownerId=${ownerId}`, { method: 'POST', body: JSON.stringify(body) }),
    update: (id, ownerId, body) => request(`/pet/update/${id}?ownerId=${ownerId}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: id => request(`/pet/${id}`, { method: 'DELETE' })
  },
  appointments: {
    all: () => request('/appointment'),
    create: (petId, body) => request(`/appointment?petId=${petId}`, { method: 'POST', body: JSON.stringify(body) }),
    update: (id, petId, body) => request(`/appointment/update/${id}?petId=${petId}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: id => request(`/appointment/${id}`, { method: 'DELETE' })
  }
}
