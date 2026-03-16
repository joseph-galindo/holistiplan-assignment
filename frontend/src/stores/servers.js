import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { serversAPI, dashboardAPI } from '../services/api';

// Resuable fn to turn health score floats/percentages into enum strings expressing health level
// - 'DANGER' - Score in range of 0 to 0.60
// - 'WARN' - Score in range of 0.61 to 0.80
// - 'SAFE' - Score in range of 0.81 to 1.00
const healthScoreFloatToText = (scoreFloat) => {
  // Constants
  const DANGER_UPPER_THRESHOLD = 0.60;
  const WARN_UPPER_THRESHOLD = 0.80;

  // Only process numbers.
  if (typeof scoreFloat !== 'number') {
    return 'DANGER';
  }

  if (scoreFloat <= DANGER_UPPER_THRESHOLD) {
    return 'DANGER';
  }

  if (scoreFloat <= WARN_UPPER_THRESHOLD) {
    return 'WARN';
  }

  return 'SAFE';
};

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
    cpu_text: 'DANGER',
    memory: 0, // can be 0-40
    memory_text: 'DANGER',
    disk: 0, // can be 0-20
    disk_text: 'DANGER',
    total: 0, // can be 0-100 (sum of all 3 prior scores)
    total_text: 'DANGER',
  };
  const CPU_WEIGHTING = 0.40;
  const MEMORY_WEIGHTING = 0.40;
  const DISK_WEIGHTING = 0.20;

  // Only process usage objects. When given other data types, return a nil health score.
  if (typeof usageObject !== 'object') {
    return healthScoreObject;
  }

  // Expected resulting int values here are 0-100.
  // For negative outliers (negative usage), cast them to 0 (0% use)
  // For positive outliers (over 100% usage), cast them to 100 (100% use)
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
  //
  // Higher usage should result in a SMALLER health score.
  // The smaller the health score, the less healthy the server is (0 being worst health).
  //
  // Lower usage should result in a LARGER health score.
  // The larger the health score, the more healthy the server is (100 being perfect health).
  //
  // Also, use toFixed() string cast, and Number cast, to truncate decimal multi results to 2 decimal places

  // -- START CPU SCORE --
  let cpuHealthScore = CPU_WEIGHTING * (100 - cpuAsInt);
  cpuHealthScore = Number(cpuHealthScore.toFixed(2));

  // Represent CPU health score as a float from 0-1
  let cpuHealthScoreFloat = cpuHealthScore / (CPU_WEIGHTING * 100);
  cpuHealthScoreFloat = Number(cpuHealthScoreFloat.toFixed(2));

  // Map CPU health score float to a string enum used for humans, css classes
  const cpuHealthScoreText = healthScoreFloatToText(cpuHealthScoreFloat);
  // -- END CPU SCORE --

  // -- START MEMORY SCORE --
  let memoryHealthScore = MEMORY_WEIGHTING * (100 - memoryAsInt);
  memoryHealthScore = Number(memoryHealthScore.toFixed(2));

  let memoryHealthScoreFloat = memoryHealthScore / (MEMORY_WEIGHTING * 100);
  memoryHealthScoreFloat = Number(memoryHealthScoreFloat.toFixed(2));

  const memoryHealthScoreText = healthScoreFloatToText(memoryHealthScoreFloat);
  // -- END MEMORY SCORE --

  // -- START DISK SCORE --
  let diskHealthScore = DISK_WEIGHTING * (100 - diskAsInt);
  diskHealthScore = Number(diskHealthScore.toFixed(2));

  let diskHealthScoreFloat = diskHealthScore / (DISK_WEIGHTING * 100);
  diskHealthScoreFloat = Number(diskHealthScoreFloat.toFixed(2));

  const diskHealthScoreText = healthScoreFloatToText(diskHealthScoreFloat);
  // -- END DISK SCORE --

  // -- START TOTAL SCORE --
  let totalHealthScore = cpuHealthScore + memoryHealthScore + diskHealthScore;
  totalHealthScore = Number(totalHealthScore.toFixed(2));

  let totalHealthScoreFloat = totalHealthScore / 100;
  totalHealthScoreFloat = Number(totalHealthScoreFloat.toFixed(2));

  const totalHealthScoreText = healthScoreFloatToText(totalHealthScoreFloat);
  // -- END TOTAL SCORE --

  // Finally, wrap health scores in an object to expose to vue store
  healthScoreObject.cpu = cpuHealthScore;
  healthScoreObject.cpu_text = cpuHealthScoreText;
  healthScoreObject.memory = memoryHealthScore;
  healthScoreObject.memory_text = memoryHealthScoreText;
  healthScoreObject.disk = diskHealthScore;
  healthScoreObject.disk_text = diskHealthScoreText;
  healthScoreObject.total = totalHealthScore;
  healthScoreObject.total_text = totalHealthScoreText;

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

// Helper function to re-use server filtering logic for total servers and recent servers
// Input: Array of servers to filter (not a ref, the raw array), the search string, and sort options object
// Output: Array of filtered servers
const generateFilteredServerList = (optionsObject) => {
  const originalServers = optionsObject?.originalServers;
  const searchbarString = optionsObject?.searchbarString;
  const sortOptions = optionsObject?.sortOptions;

  // Only process when input is an array of servers.
  if (!Array.isArray(originalServers)) {
    return originalServers;
  }

  // Only attempt filtering and sorting when a search string and/or sort options object is given.
  if (typeof searchbarString !== 'string' && typeof sortOptions !== 'object') {
    return originalServers;
  }

  // When a non-empty search string is given, do frontend side filtering:
  const preparedSearchString = searchbarString.toLowerCase().trim();
  const filteredServers = originalServers.filter((server) => {
    // Normalize name, status, and location to lowercase
    // To ensure all strings used for substring matching are always the same case

    // Only attempt to do filtering when field data is a valid string
    // Filter by server name:
    let isNameMatch = false;
    if (typeof server.name === 'string') {
      const serverName = server.name.toLowerCase().trim();
      isNameMatch = serverName.includes(preparedSearchString);
    }

    // Filter by server status:
    let isStatusMatch = false;
    if (typeof server.status === 'string') {
      const serverStatus = server.status.toLowerCase().trim();
      isStatusMatch = serverStatus.includes(preparedSearchString);
    }

    // Filter by server ip:
    let isIpMatch = false;
    if (typeof server.ip_address === 'string') {
      const serverIp = server.ip_address.toLowerCase().trim();
      isIpMatch = serverIp.includes(preparedSearchString);
    }

    // Filter by server location
    let isLocationMatch = false;
    if (typeof server.location === 'string') {
      let serverLocation = server.location.toLowerCase().trim();
      isLocationMatch = serverLocation.includes(preparedSearchString);
    }

    // Finally, the server is preserved in result set, if it is any of the preceding matches:
    return isNameMatch || isIpMatch || isStatusMatch || isLocationMatch;
  });

  // Lastly, do frontend side sorting, if any sort options are given:
  // Only do the sorting when we have a column and direction given.
  const sortCol = sortOptions.col;
  const sortDirection = sortOptions.direction;

  if (sortCol && sortDirection) {
    const stringSorter = (first, second, direction) => {
      if (direction === 'asc') {
        return first.localeCompare(second, 'en', { sensitivity: 'base' });
      } else {
        return second.localeCompare(first, 'en', { sensitivity: 'base' });
      }
    };
    const numberSorter = (first, second, direction) => {
      if (direction === 'asc') {
        return first - second;
      } else {
        return second - first;
      }
    };
    const healthScoreSorter = (first, second, direction) => {
      return numberSorter(first.total, second.total, direction);
    };

    filteredServers.sort((firstServer, secondServer) => {
      const firstColValue = firstServer[sortCol];
      const secondColValue = secondServer[sortCol];

      let sorter = () => 0;
      const colType = typeof firstColValue;

      if (colType === 'string') {
        sorter = stringSorter;
      }

      if (colType === 'number') {
        sorter = numberSorter;
      }

      // Add special override for health_score column, since it's an object
      if (sortCol === 'health_score') {
        sorter = healthScoreSorter;
      }

      return sorter(firstColValue, secondColValue, sortDirection);
    });
  }

  return filteredServers;
};

export const useServersStore = defineStore('servers', () => {
  const servers = ref([]);
  const dashboardStats = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Since the "all servers" and "recent servers" are two distinct views, this could
  // potentially be one set of search+sort state, that gets shared between both server tables.
  //
  // For the time being, I avoided this and made distinct state, just to sandbox the two table states
  // from eachother, to make it easier to reason about/iterate on, without worrying about user interaction
  // in the recent servers table affecting the all servers table, and vice versa.
  const searchbarStringServers = ref('');
  const searchbarStringRecentServers = ref('');
  const sortOptionsServers = ref({
    col: 'name',
    direction: 'asc',
  });
  const sortOptionsRecentServers = ref({
    col: 'name',
    direction: 'asc',
  });

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

  const filteredServers = computed(() => {
    const optionsObject = {
      originalServers: servers.value,
      searchbarString: searchbarStringServers.value,
      sortOptions: sortOptionsServers.value,
    };
    return generateFilteredServerList(optionsObject);
  });

  const filteredRecentServers = computed(() => {
    const optionsObject = {
      originalServers: servers.value.slice(0,10),
      searchbarString: searchbarStringRecentServers.value,
      sortOptions: sortOptionsRecentServers.value,
    };
    return generateFilteredServerList(optionsObject);
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

      // This creates a server in the backend, then appends the raw BE response to the vue store
      // However, the new health score stuff expects to have new health_score fields inserted frontend side
      // So, to keep that UI working without issue, only push the transformed server obj, with health_score, to the vue store
      // generateTransformedServersList handles generating and embedding the health_score field
      const [transformedResponse] = generateTransformedServersList([response.data.server]);
      servers.value.push(transformedResponse);
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

  // TODO: can consolidate these helpers by using a factory that takes both the new input and the vue ref to update
  const updateSearchbarStringServers = (newString) => {
    if (typeof newString === 'string') {
      searchbarStringServers.value = newString;
    }
  };

  const updateSearchbarStringRecentServers = (newString) => {
    if (typeof newString === 'string') {
      searchbarStringRecentServers.value = newString;
    }
  };

  const updateSortServers = (newSort) => {
    const supportedCols = ['name', 'status', 'location', 'uptime', 'health_score'];
    const supportedDirections = ['asc', 'desc'];
    const newCol = newSort?.col;
    const newDirection = newSort?.direction;

    if (supportedCols.includes(newCol) && supportedDirections.includes(newDirection)) {
      sortOptionsServers.value.col = newCol;
      sortOptionsServers.value.direction = newDirection;
    }
  };

  const updateSortRecentServers = (newSort) => {
    const supportedCols = ['name', 'status', 'location', 'uptime', 'health_score'];
    const supportedDirections = ['asc', 'desc'];
    const newCol = newSort?.col;
    const newDirection = newSort?.direction;

    if (supportedCols.includes(newCol) && supportedDirections.includes(newDirection)) {
      sortOptionsRecentServers.value.col = newCol;
      sortOptionsRecentServers.value.direction = newDirection;
    }
  };

  return {
    servers,
    dashboardStats,
    isLoading,
    error,
    searchbarStringServers,
    searchbarStringRecentServers,
    sortOptionsServers,
    sortOptionsRecentServers,
    serversByStatus,
    filteredServers,
    filteredRecentServers,
    totalServers,
    fetchServers,
    fetchDashboardStats,
    createServer,
    updateServer,
    deleteServer,
    getServerById,
    clearError,
    updateSearchbarStringServers,
    updateSearchbarStringRecentServers,
    updateSortServers,
    updateSortRecentServers,
  };
});
