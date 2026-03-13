import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { serversAPI, dashboardAPI } from '../services/api';

const generateTransformedServersList = (serversList) => {
  // Only process arrays. When given other data types, just return them.
  if (!Array.isArray(serversList)) {
    return serversList;
  }

  const transformedServersList = serversList.map((server) => {
    let transformedMemoryUsage = server.memory_usage;

    if (typeof transformedMemoryUsage === 'number') {
      transformedMemoryUsage = transformedMemoryUsage / 100;
    }

    return {
      ...server,
      memory_usage: transformedMemoryUsage,
    };
  });

  return transformedServersList;
};

const generateTransformedDashboardStats = (dashboardStats) => {
  // Only process objects. When given other data types, just return them.
  if (typeof dashboardStats !== 'object') {
    return dashboardStats;
  }

  // Shallow clone to keep the original raw data intact (dont mutate original object fields through ref)
  const transformedAverageUsage = typeof dashboardStats?.average_usage === 'object'
    ? { ...dashboardStats.average_usage }
    : { cpu: 0, disk: 0, memory: 0 };

  if (typeof transformedAverageUsage.memory === 'number') {
    transformedAverageUsage.memory = transformedAverageUsage.memory / 100;
  }

  const transformedDashboardStats = {
    ...dashboardStats,
    average_usage: transformedAverageUsage,
  };

  return transformedDashboardStats;
};

export const useServersStore = defineStore('servers', () => {
  const servers = ref([]);
  const dashboardStats = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  const serversByStatus = computed(() => {
    const grouped = {
      online: [],
      offline: [],
      maintenance: [],
      error: []
    };
    
    servers.value.forEach(server => {
      if (grouped[server.status]) {
        grouped[server.status].push(server);
      }
    });
    
    return grouped;
  });

  const totalServers = computed(() => servers.value.length);

  const fetchServers = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await serversAPI.getServers();

      // Apply any frontend-side transformations to the raw backend server list data, then pass to vue
      const transformedServersList = generateTransformedServersList(response.data.servers);
      servers.value = transformedServersList;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch servers';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();

      // Apply any frontend-side transformations to the raw backend dashboard stats data, then pass to vue
      const transformedDashboardStats = generateTransformedDashboardStats(response.data);
      dashboardStats.value = transformedDashboardStats;
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const createServer = async (serverData) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await serversAPI.createServer(serverData);
      servers.value.push(response.data.server);
      return response.data.server;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateServer = async (id, serverData) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await serversAPI.updateServer(id, serverData);
      const index = servers.value.findIndex(s => s.id === id);
      if (index !== -1) {
        servers.value[index] = response.data.server;
      }
      return response.data.server;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteServer = async (id) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      await serversAPI.deleteServer(id);
      servers.value = servers.value.filter(s => s.id !== id);
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getServerById = (id) => {
    return servers.value.find(s => s.id === parseInt(id));
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    servers,
    dashboardStats,
    isLoading,
    error,
    serversByStatus,
    totalServers,
    fetchServers,
    fetchDashboardStats,
    createServer,
    updateServer,
    deleteServer,
    getServerById,
    clearError
  };
});
