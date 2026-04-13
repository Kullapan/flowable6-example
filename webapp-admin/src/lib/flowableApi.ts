//const FLOWABLE_AUTH = 'Basic cmVzdC1hZG1pbjp0ZXN0'; // rest-admin:test
const FLOWABLE_AUTH = 'Basic YWRtaW46dGVzdA=='; // admin:test

export const flowableApi = {
  /**
   * Search process instances by business key
   */
  getProcessInstances: async (businessKey?: string) => {
    const url = new URL('/process-api/runtime/process-instances', window.location.origin);
    if (businessKey) {
      url.searchParams.append('businessKey', businessKey);
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch process instances');
    return res.json();
  },

  /**
   * Search COMPLETED process instances by business key.
   * Uses GET with ?businessKey= (exact match) — confirmed working via browser tests.
   * NOTE: POST /query/historic-process-instances silently ignores body params in Flowable 7.
   */
  getCompletedProcessInstances: async (businessKey?: string) => {
    const url = new URL('/process-api/history/historic-process-instances', window.location.origin);
    if (businessKey && businessKey.trim()) {
      url.searchParams.append('businessKey', businessKey.trim());
    }
    url.searchParams.append('finished', 'true');
    url.searchParams.append('sort', 'endTime');
    url.searchParams.append('order', 'desc');

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch completed process instances');
    return res.json();
  },

  /**
   * Get variables for a specific process instance
   */
  getProcessVariables: async (processInstanceId: string) => {
    const res = await fetch(`/process-api/runtime/process-instances/${processInstanceId}/variables`, {
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch process variables');
    return res.json();
  },

  /**
   * Get variables for a COMPLETED process instance (using history API)
   */
  getHistoricProcessVariables: async (processInstanceId: string) => {
    const url = new URL('/process-api/history/historic-variable-instances', window.location.origin);
    url.searchParams.append('processInstanceId', processInstanceId);

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch historic process variables');
    const json = await res.json();
    const data = json.data || [];
    return data.map((v: any) => {
      if (v.variable) {
        return { name: v.variable.name, type: v.variable.type, value: v.variable.value };
      }
      return {
        name: v.variableName || v.name,
        type: v.variableTypeName || v.type,
        value: v.value
      };
    });
  },

  /**
   * Get image blob URL for a process instance
   */
  getProcessDiagramUrl: async (processInstanceId: string) => {
    const res = await fetch(`/process-api/runtime/process-instances/${processInstanceId}/diagram`, {
      headers: {
        'Authorization': FLOWABLE_AUTH
      }
    });
    if (!res.ok) throw new Error('Failed to fetch process diagram');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * Get active tasks
   */
  getTasks: async (filters: { unassigned?: boolean, assignee?: string, processInstanceId?: string } = {}) => {
    const url = new URL('/process-api/runtime/tasks', window.location.origin);
    if (filters.unassigned) {
      url.searchParams.append('unassigned', 'true');
    }
    if (filters.assignee) {
      url.searchParams.append('assigneeLike', `%${filters.assignee}%`);
    }
    if (filters.processInstanceId) {
      url.searchParams.append('processInstanceId', filters.processInstanceId);
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  /**
   * Get a historic process instance (contains processDefinitionId)
   */
  getHistoricProcessInstance: async (processInstanceId: string) => {
    const res = await fetch(`/process-api/history/historic-process-instances/${processInstanceId}`, {
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch historic process instance');
    return res.json();
  },

  /**
   * Get all historic activity instances for a process instance, sorted by startTime asc
   */
  getHistoricActivityInstances: async (processInstanceId: string) => {
    const url = new URL('/process-api/history/historic-activity-instances', window.location.origin);
    url.searchParams.append('processInstanceId', processInstanceId);
    url.searchParams.append('sort', 'startTime');
    url.searchParams.append('order', 'asc');
    url.searchParams.append('size', '500');

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch historic activity instances');
    return res.json();
  },

  /**
   * Get the raw BPMN XML for a process definition
   */
  getProcessDefinitionXml: async (processDefinitionId: string): Promise<string> => {
    const res = await fetch(`/process-api/repository/process-definitions/${processDefinitionId}/resourcedata`, {
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Accept': 'application/xml, text/xml, */*'
      }
    });
    if (!res.ok) throw new Error('Failed to fetch process definition XML');
    return res.text();
  },

  /**
   * Get process definition metadata by ID.
   * Step 2 of the 2-step deploymentId lookup:
   *   processInstanceId → processDefinitionId (runtime API)
   *                     → deploymentId        (this call)
   * Response contains: { id, key, version, deploymentId, resourceName, ... }
   */
  getProcessDefinition: async (processDefinitionId: string): Promise<any> => {
    const res = await fetch(`/process-api/repository/process-definitions/${processDefinitionId}`, {
      headers: { 'Authorization': FLOWABLE_AUTH, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch process definition');
    return res.json();
  },

  /**
   * List process definitions associated with a specific deployment.
   * Used as a robust fallback to fetch BPMN XML when the direct resource path fails
   * (e.g. old Spring Boot auto-deployments that store absolute Windows paths).
   */
  getProcessDefinitionsByDeployment: async (deploymentId: string): Promise<any> => {
    const url = new URL('/process-api/repository/process-definitions', window.location.origin);
    url.searchParams.append('deploymentId', deploymentId);
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': FLOWABLE_AUTH, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch process definitions for deployment');
    return res.json();
  },

  // ─── Deployment Management ────────────────────────────────────────────────

  /**
   * List all deployments (sorted newest first)
   */
  getDeployments: async (): Promise<any> => {
    const url = new URL('/process-api/repository/deployments', window.location.origin);
    url.searchParams.append('sort', 'deployTime');
    url.searchParams.append('order', 'desc');
    url.searchParams.append('size', '100');
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': FLOWABLE_AUTH, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch deployments');
    return res.json();
  },

  /**
   * Deploy a BPMN / XML file to the Flowable engine.
   * @param file       The file to upload.
   * @param deploymentName  Custom identifier stored as the deployment name.
   */
  deployBpmnFile: async (file: File, deploymentName: string): Promise<any> => {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('deploymentName', deploymentName);
    const res = await fetch('/process-api/repository/deployments', {
      method: 'POST',
      headers: { 'Authorization': FLOWABLE_AUTH },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Deployment failed (${res.status}): ${text}`);
    }
    return res.json();
  },

  /**
   * List resources belonging to a specific deployment.
   */
  getDeploymentResources: async (deploymentId: string): Promise<any> => {
    const res = await fetch(`/process-api/repository/deployments/${deploymentId}/resources`, {
      headers: { 'Authorization': FLOWABLE_AUTH, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch deployment resources');
    return res.json();
  },

  /**
   * Download the raw bytes of a deployment resource and return a Blob URL.
   * `resourceId` is the URL-encoded resource path returned by getDeploymentResources.
   */
  downloadDeploymentResource: async (deploymentId: string, resourceId: string): Promise<string> => {
    const res = await fetch(`/process-api/repository/deployments/${deploymentId}/resourcedata/${resourceId}`, {
      headers: { 'Authorization': FLOWABLE_AUTH }
    });
    if (!res.ok) throw new Error('Failed to download resource');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * Fetch the raw BPMN / XML text of a deployment resource (for in-browser rendering).
   * `resourceId` is the URL-encoded resource path returned by getDeploymentResources.
   */
  getDeploymentResourceXml: async (deploymentId: string, resourceId: string): Promise<string> => {
    const res = await fetch(`/process-api/repository/deployments/${deploymentId}/resourcedata/${resourceId}`, {
      headers: { 'Authorization': FLOWABLE_AUTH, 'Accept': 'application/xml, text/xml, */*' }
    });
    if (!res.ok) throw new Error('Failed to fetch resource XML');
    return res.text();
  },

  // ─── Management (Deadletter Jobs) ───────────────────────────────────────

  /**
   * List all deadletter jobs
   */
  getDeadLetterJobs: async (): Promise<any> => {
    const res = await fetch('/process-api/management/deadletter-jobs', {
      headers: { 'Authorization': FLOWABLE_AUTH, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch deadletter jobs');
    return res.json();
  },

  /**
   * Get the exception stacktrace for a specific deadletter job
   */
  getDeadLetterJobStacktrace: async (jobId: string): Promise<string> => {
    const res = await fetch(`/process-api/management/deadletter-jobs/${jobId}/exception-stacktrace`, {
      headers: { 'Authorization': FLOWABLE_AUTH }
    });
    if (!res.ok) throw new Error('Failed to fetch deadletter job stacktrace');
    return res.text();
  },

  /**
   * Move a deadletter job back to the executable job queue
   */
  moveDeadLetterJob: async (jobId: string): Promise<any> => {
    const res = await fetch(`/process-api/management/deadletter-jobs/${jobId}`, {
      method: 'POST',
      headers: {
        'Authorization': FLOWABLE_AUTH,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ action: 'move' })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to move deadletter job: ${text}`);
    }
    // The response might be 204 No Content, so we handle json selectively
    if (res.status === 204) return null;
    try {
      return await res.json();
    } catch {
      return null;
    }
  },
};
