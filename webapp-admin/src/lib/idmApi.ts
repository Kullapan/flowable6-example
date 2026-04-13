//export const FLOWABLE_AUTH = 'Basic cmVzdC1hZG1pbjp0ZXN0'; // rest-admin:test
export const FLOWABLE_AUTH = 'Basic YWRtaW46dGVzdA=='; // admin:test

// Helper to make IDM API requests
const fetchIdm = async (endpoint: string, options: RequestInit = {}) => {
  const url = new URL(`/idm-api${endpoint}`, window.location.origin);
  const headers = new Headers(options.headers);
  headers.set('Authorization', FLOWABLE_AUTH);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const res = await fetch(url.toString(), { ...options, headers });

  if (!res.ok) {
    let errorMessage = `IDM API Error: ${res.status}`;
    try {
      const errorJson = await res.json();
      errorMessage = errorJson.message || errorMessage;
    } catch {
      try {
        const errorText = await res.text();
        errorMessage = errorText || errorMessage;
      } catch {
        // ignore
      }
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null;
  }

  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return null; // Return null if it's not valid JSON
  }
};

export const idmApi = {
  // ─── Users ─────────────────────────────────────────────────────────────
  getUsers: async (filterText?: string, tenantId?: string) => {
    const params = new URLSearchParams();
    params.append('size', '1000');
    if (tenantId) {
      params.append('tenantId', tenantId);
    }
    const queryString = `?${params.toString()}`;
    const resp = await fetchIdm(`/users${queryString}`);

    if (!filterText) return resp;

    const lowerFilter = filterText.toLowerCase();
    const users = resp?.data || resp || [];
    const filtered = users.filter((u: any) =>
      (u.id && u.id.toLowerCase().includes(lowerFilter)) ||
      (u.firstName && u.firstName.toLowerCase().includes(lowerFilter)) ||
      (u.lastName && u.lastName.toLowerCase().includes(lowerFilter)) ||
      (u.email && u.email.toLowerCase().includes(lowerFilter))
    );

    if (resp?.data) {
      return { ...resp, data: filtered, size: filtered.length, total: filtered.length };
    }
    return filtered;
  },

  createUser: async (user: { id: string, firstName: string, lastName: string, email: string, password?: string, tenantId?: string }) => {
    return fetchIdm('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  },

  updateUser: async (userId: string, userUpdate: { firstName?: string, lastName?: string, email?: string, password?: string, tenantId?: string }) => {
    return fetchIdm(`/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userUpdate)
    });
  },

  deleteUser: async (userId: string) => {
    return fetchIdm(`/users/${userId}`, { method: 'DELETE' });
  },

  // ─── Groups ────────────────────────────────────────────────────────────
  getGroups: async (filterText?: string, tenantId?: string) => {
    const params = new URLSearchParams();
    params.append('size', '1000');
    if (tenantId) {
      params.append('tenantId', tenantId);
    }
    const queryString = `?${params.toString()}`;
    const resp = await fetchIdm(`/groups${queryString}`);

    if (!filterText) return resp;

    const lowerFilter = filterText.toLowerCase();
    const groups = resp?.data || resp || [];
    const filtered = groups.filter((g: any) =>
      (g.id && g.id.toLowerCase().includes(lowerFilter)) ||
      (g.name && g.name.toLowerCase().includes(lowerFilter)) ||
      (g.type && g.type.toLowerCase().includes(lowerFilter))
    );

    if (resp?.data) {
      return { ...resp, data: filtered, size: filtered.length, total: filtered.length };
    }
    return filtered;
  },

  createGroup: async (group: { id: string, name: string, type: string }) => {
    return fetchIdm('/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group)
    });
  },

  deleteGroup: async (groupId: string) => {
    return fetchIdm(`/groups/${groupId}`, { method: 'DELETE' });
  },

  getGroupMembers: async (groupId: string) => {
    // Flowable usually expects `/users?memberOfGroup={groupId}` natively, but spec asks for `/idm/groups/{groupId}/members`
    try {
      // Trying spec endpoint first if the backend is customized
      return await fetchIdm(`/groups/${groupId}/members`);
    } catch {
      // Fallback to standard Flowable API
      return await fetchIdm(`/users?memberOfGroup=${groupId}`);
    }
  },

  addGroupMember: async (groupId: string, userId: string) => {
    return fetchIdm(`/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  },

  removeGroupMember: async (groupId: string, userId: string) => {
    return fetchIdm(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
  },

  // ─── Privileges ────────────────────────────────────────────────────────
  getPrivileges: async () => {
    return fetchIdm('/privileges');
  },

  getPrivilegeUsers: async (privId: string) => {
    return fetchIdm(`/privileges/${privId}/users`);
  },

  getPrivilegeGroups: async (privId: string) => {
    return fetchIdm(`/privileges/${privId}/groups`);
  },

  assignPrivilegeToUser: async (privId: string, userId: string) => {
    return fetchIdm(`/privileges/${privId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  },

  revokePrivilegeFromUser: async (privId: string, userId: string) => {
    return fetchIdm(`/privileges/${privId}/users/${userId}`, { method: 'DELETE' });
  },

  assignPrivilegeToGroup: async (privId: string, groupId: string) => {
    return fetchIdm(`/privileges/${privId}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId })
    });
  },

  revokePrivilegeFromGroup: async (privId: string, groupId: string) => {
    return fetchIdm(`/privileges/${privId}/groups/${groupId}`, { method: 'DELETE' });
  }
};
