<script>
import { onMounted, computed } from 'vue';
import { useServersStore } from '../stores/servers';
import StatusChart from '../components/StatusChart.vue';
import UsageChart from '../components/UsageChart.vue';

export default {
  name: 'DashboardView',
  components: {
    StatusChart,
    UsageChart
  },
  setup() {
    const serversStore = useServersStore();

    const statusCounts = computed(() => {
      if (!serversStore.dashboardStats) return {};
      return serversStore.dashboardStats.status_breakdown;
    });

    const averageUsage = computed(() => {
      if (!serversStore.dashboardStats) return {};
      return serversStore.dashboardStats.average_usage;
    });

    const getStatusColor = (status) => {
      const colors = {
        online: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        offline: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
        maintenance: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
        error: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      };
      return colors[status] || 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    };

    const getHealthScoreColor = (healthScoreText) => {
      const colors = {
        'DANGER': 'text-red-700 bg-red-100',
        'WARN': 'text-yellow-700 bg-yellow-100',
        'SAFE': 'text-green-700 bg-green-100',
      };
      const defaultColor = 'text-gray-900 dark:text-gray-100';

      return colors[healthScoreText] || defaultColor;
    };

    onMounted(async () => {
      await serversStore.fetchServers();
      await serversStore.fetchDashboardStats();
    });

    return {
      serversStore,
      statusCounts,
      averageUsage,
      getStatusColor,
      getHealthScoreColor,
    };
  }
};
</script>

<template>
  <div class="px-6 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400">Monitor your server infrastructure</p>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Servers</h3>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ serversStore.dashboardStats?.total_servers || 0 }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Online</h3>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">
          {{ statusCounts.online || 0 }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Offline</h3>
        <p class="text-3xl font-bold text-red-600 dark:text-red-400">
          {{ statusCounts.offline || 0 }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Maintenance</h3>
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
          {{ statusCounts.maintenance || 0 }}
        </p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Server Status Distribution</h3>
        <StatusChart :data="statusCounts" />
      </div>
      
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Average Resource Usage</h3>
        <UsageChart :data="averageUsage" />
      </div>
    </div>

    <!-- Recent Servers -->
    <div class="card">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Servers</h3>
      </div>
      
      <div class="overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                IP Address
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CPU Usage
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Health Score
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="server in serversStore.servers.slice(0, 10)"
              :key="server.id"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ server.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="inline-flex px-2 text-xs font-semibold rounded-full"
                  :class="getStatusColor(server.status)"
                >
                  {{ server.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ server.ip_address }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ server.location }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ server.cpu_usage }}%
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span 
                  class="text-sm"
                  :class="getHealthScoreColor(server.health_score.total_text)"
                >
                  {{ server.health_score.total }}/100
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right">
        <RouterLink 
          to="/servers"
          class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
        >
          View all servers →
        </RouterLink>
      </div>
    </div>
  </div>
</template>
