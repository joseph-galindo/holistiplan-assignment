import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { serversAPI, dashboardAPI } from '../services/api';

// Reusable fn, to generate health scores both for:
// - average dashboard stats (ALL servers holistically)
// - individual servers (for server table)
//
// Expected input is an object of the form { cpu: val, memory: val, disk: val }
// `val` in these fields should be a float from 0-1, although we handle floats out of this range as well
const generateHealthScore = (usageObject) => {
  // Constants
  const healthScoreObject = {
    cpu: 0, // can be 0-40
    memory: 0, // can be 0-40
    disk: 0, // can be 0-20
    total: 0, // can be 0-100 (sum of all 3 prior scores)
  };
  const CPU_WEIGHTING = 0.40;
  const MEMORY_WEIGHTING = 0.40;
  const DISK_WEIGHTING = 0.20;

  // Only process usage objects. When given other data types, return a nil health score.
  if (typeof usageObject !== 'object') {
    return healthScoreObject;
  }

  // Expected resulting int values here are 0-100.
  // For negative outliers (negative usage), cast them to 0 (most healthy)
  // For positive outliers (over 100% usage), cast them to 100 (most unhealthy)
  let cpuAsInt = Math.floor(usageObject.cpu * 100);
  cpuAsInt = (cpuAsInt < 0) ? 0 : cpuAsInt;
  cpuAsInt = (cpuAsInt > 100) ? 100 : cpuAsInt;

  let memoryAsInt = Math.floor(usageObject.memory * 100);
  memoryAsInt = (memoryAsInt < 0) ? 0 : memoryAsInt;
  memoryAsInt = (memoryAsInt > 100) ? 100 : memoryAsInt;

  let diskAsInt = Math.floor(usageObject.disk * 100);
  diskAsInt = (diskAsInt < 0) ? 0 : diskAsInt;
  diskAsInt = (diskAsInt > 100) ? 100 : diskAsInt;

  // Once we have raw int usage converted from 0 to 100%, turn each into granular health scores by applying weighting to the usage values
  // Also, use toFixed() string cast, and Number cast, to truncate decimal multi results to 2 decimal places
  let cpuHealthScore = CPU_WEIGHTING * (100 - cpuAsInt);
  cpuHealthScore = Number(cpuHealthScore.toFixed(2));
  let memoryHealthScore = MEMORY_WEIGHTING * (100 - memoryAsInt);
  memoryHealthScore = Number(memoryHealthScore.toFixed(2));
  let diskHealthScore = DISK_WEIGHTING * (100 - diskAsInt);
  diskHealthScore = Number(diskHealthScore.toFixed(2));
  let totalHealthScore = cpuHealthScore + memoryHealthScore + diskHealthScore;
  totalHealthScore = Number(totalHealthScore.toFixed(2));

  // Finally, wrap health scores in an object to expose to vue store
  healthScoreObject.cpu = cpuHealthScore;
  healthScoreObject.memory = memoryHealthScore;
  healthScoreObject.disk = diskHealthScore;
  healthScoreObject.total = totalHealthScore;

  return healthScoreObject;
};

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

    const serverUsageObject = {
      cpu: server.cpu_usage,
      memory: transformedMemoryUsage,
      disk: server.disk_usage,
    };
    const serverHealthScoreObject = generateHealthScore(serverUsageObject);

    return {
      ...server,
      memory_usage: transformedMemoryUsage,
      health_score: serverHealthScoreObject,
    };
  });

  return transformedServersList;
};

const generateTransformedDashboardStats = (dashboardStats) => {
  // Only process objects. When given other data types, just return them.
  if (typeof dashboardStats !== 'object') {
    return dashboardStats;
  }

  // -- TRANSFORMATIONS START --
  // dashboardStats.average_usage.memory
  // Shallow clone to keep the original raw data intact (dont mutate original object fields through ref)
  const transformedAverageUsage = typeof dashboardStats?.average_usage === 'object'
    ? { ...dashboardStats.average_usage }
    : { cpu: 0, disk: 0, memory: 0 };

  if (typeof transformedAverageUsage.memory === 'number') {
    transformedAverageUsage.memory = transformedAverageUsage.memory / 100;
  }

  // dashboardStats.health_score (new addition, task 1)
  // To generate these, use transformedAverageUsage (easier to reason about, all seeding values are 0-1)
  const dashboardHealthScore = generateHealthScore(transformedAverageUsage);

  // -- TRANSFORMATIONS END --
  const transformedDashboardStats = {
    ...dashboardStats,
    average_usage: transformedAverageUsage,
    health_score: dashboardHealthScore,
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
