<script>
import { ref, onMounted, computed } from 'vue';
import { useServersStore } from '../stores/servers';
import EditServerModal from '../components/EditServerModal.vue';
import ServerSearchbar from '../components/ServerSearchbar.vue';
import filterMethods from '../helpers/filterMethods';

export default {
  name: 'ServersView',
  components: {
    EditServerModal,
    ServerSearchbar,
  },
  setup() {
    const searchbarString = ref('');
    const serversStore = useServersStore();
    const servers = computed(() => serversStore.servers);
    const filteredServers = computed(() => {
      // When no search string given, return the raw server list
      if (searchbarString.value === '') {
        return servers.value;
      }

      // When a non-empty search string is given, do frontend side filtering:
      const preparedSearchString = searchbarString.value.toLowerCase().trim();
      const filteredServers = servers.value.filter((server) => {
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

        // Filter by server location:
        // Location is special, default location rendered in UI is 'US-East'
        // but the actual server object value in this case is `location: ''`
        // For now, to support us-east search, stub in 'US-East' as needed
        let isLocationMatch = false;
        if (typeof server.location === 'string') {
          let serverLocation = server.location;

          // When server location is empty string, treat it as the UI default ('US-East')
          if (serverLocation.length === 0) {
            serverLocation = 'US-East';
          }

          // Then AFTER, normalize like the other fields
          serverLocation = server.location.toLowerCase().trim();

          // Last, do substring matching for table filtering
          isLocationMatch = serverLocation.includes(preparedSearchString);
        }

        // Finally, the server is preserved in result set, if it is any of the preceding matches:
        return isNameMatch || isIpMatch || isStatusMatch || isLocationMatch;
      });

      return filteredServers;
    });
    const showDeleteModal = ref(false);
    const serverToDelete = ref(null);
    const showEditModal = ref(false);
    const serverToEdit = ref(null);

    const handleSearchbarInput = (newInputString) => {
      // The parent component (ServersView) sets up the search text state
      // The child component (ServerSearchbar) simply lets the parent know when the user provides input
      // From there, the parent ServersView updates the search string, and then directly handles result filtering
      searchbarString.value = newInputString;
    };

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

    const confirmDelete = (server) => {
      serverToDelete.value = server;
      showDeleteModal.value = true;
    };

    const deleteServer = async () => {
      if (serverToDelete.value) {
        try {
          await serversStore.deleteServer(serverToDelete.value.id);
          showDeleteModal.value = false;
          serverToDelete.value = null;
        } catch (error) {
          console.error('Failed to delete server:', error);
        }
      }
    };

    const editServer = (server) => {
      serverToEdit.value = server;
      showEditModal.value = true;
    };

    const handleEditClose = () => {
      showEditModal.value = false;
      serverToEdit.value = null;
    };

    const handleEditSaved = (updatedServer) => {
      // The store will automatically update the servers list
      // but we can add any additional logic here if needed
      console.warn('Server updated:', updatedServer);
    };

    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h`;
      return `${Math.floor(seconds / 60)}m`;
    };

    onMounted(() => {
      serversStore.fetchServers();
    });

    return {
      servers,
      filteredServers,
      showDeleteModal,
      serverToDelete,
      showEditModal,
      serverToEdit,
      searchbarString,
      handleSearchbarInput,
      getStatusColor,
      getHealthScoreColor,
      confirmDelete,
      deleteServer,
      editServer,
      handleEditClose,
      handleEditSaved,
      formatUptime,
      ...filterMethods
    };
  }
};
</script>

<template>
  <div class="px-6 py-8">
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Servers</h1>
          <p class="text-gray-600 dark:text-gray-400">Manage your server infrastructure</p>
        </div>
        <RouterLink
          to="/servers/new"
          class="btn btn-primary"
        >
          Add Server
        </RouterLink>
      </div>
    </div>

    <!-- Servers Searchbar-->
    <ServerSearchbar
      :search-string="searchbarString"
      @search-input="handleSearchbarInput"
    />

    <!-- Servers Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Server
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usage
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Health
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Uptime
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="server in filteredServers"
              :key="server.id"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ server.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.hostname }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.ip_address }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 text-xs font-semibold rounded-full"
                  :class="getStatusColor(server.status)"
                >
                  {{ server.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">{{ server.location }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.os }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  CPU: {{ formatPercent(server.cpu_usage) }}%
                </div>
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  Memory: {{ formatPercent(server.memory_usage) }}%
                </div>
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  Disk: {{ formatPercent(server.disk_usage) }}%
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div 
                  class="text-sm"
                  :class="getHealthScoreColor(server.health_score.cpu_text)"
                >
                  CPU: {{ server.health_score.cpu }}/40
                </div>
                <div
                  class="text-sm"
                  :class="getHealthScoreColor(server.health_score.memory_text)"
                >
                  Memory: {{ server.health_score.memory }}/40
                </div>
                <div
                  class="text-sm"
                  :class="getHealthScoreColor(server.health_score.disk_text)"
                >
                  Disk: {{ server.health_score.disk }}/20
                </div>
                <div 
                  class="text-sm"
                  :class="getHealthScoreColor(server.health_score.total_text)"
                >
                  Total: {{ server.health_score.total }}/100
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatUptime(server.uptime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editServer(server)"
                  class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(server)"
                  class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="filteredServers.length === 0"
        class="text-center py-12"
      >
        <p class="text-gray-500 dark:text-gray-400">No servers found.</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Delete Server</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <strong class="text-gray-900 dark:text-gray-100">{{ serverToDelete?.name }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="showDeleteModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="deleteServer"
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Server Modal -->
    <EditServerModal
      v-if="serverToEdit"
      :server="serverToEdit"
      :is-visible="showEditModal"
      @close="handleEditClose"
      @saved="handleEditSaved"
    />
  </div>
</template>
