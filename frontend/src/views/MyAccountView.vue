<script>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { authAPI } from '../services/api';

export default {
  name: 'MyAccountView',
  setup() {
    const authStore = useAuthStore();
    const isLoading = ref(false);
    const error = ref(null);
    const success = ref(null);
    const isEditing = ref(false);
    
    const formData = ref({
      username: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const initializeForm = () => {
      if (authStore.user) {
        Object.keys(authStore.user).forEach(key => {
          formData.value[key] = authStore.user[key];
        });
      }
    };

    const updateProfile = async () => {
      error.value = null;
      success.value = null;
      
      // Validate passwords if changing
      if (formData.value.newPassword) {
        if (!formData.value.currentPassword) {
          error.value = 'Current password is required to change password';
          return;
        }
        if (formData.value.newPassword !== formData.value.confirmPassword) {
          error.value = 'New passwords do not match';
          return;
        }
        if (formData.value.newPassword.length < 6) {
          error.value = 'New password must be at least 6 characters';
          return;
        }
      }

      isLoading.value = true;
      
      try {
        // Prepare update data
        const updateData = {...formData.value };
        
        // Add password fields if changing password
        if (formData.value.newPassword) {
          updateData.current_password = formData.value.currentPassword;
          updateData.new_password = formData.value.newPassword;
        }

        const response = await authAPI.updateProfile(updateData);
        
        // Update the auth store with new user data
        authStore.user = response.data.user;
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        success.value = 'Profile updated successfully!';
        isEditing.value = false;
        
        // Clear password fields
        formData.value.currentPassword = '';
        formData.value.newPassword = '';
        formData.value.confirmPassword = '';
        
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to update profile';
      } finally {
        isLoading.value = false;
      }
    };

    const cancelEdit = () => {
      isEditing.value = false;
      error.value = null;
      success.value = null;
      initializeForm();
      // Clear password fields
      formData.value.currentPassword = '';
      formData.value.newPassword = '';
      formData.value.confirmPassword = '';
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    onMounted(() => {
      initializeForm();
    });

    return {
      authStore,
      isLoading,
      error,
      success,
      isEditing,
      formData,
      updateProfile,
      cancelEdit,
      formatDate
    };
  }
};
</script>

<template>
  <div class="px-6 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">My Account</h1>
      <p class="text-gray-600 dark:text-gray-400">Manage your profile and account settings</p>
    </div>

    <!-- Success message -->
    <div
      v-if="success"
      class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4"
    >
      {{ success }}
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4"
    >
      {{ error }}
    </div>

    <div class="max-w-2xl">
      <!-- Profile Information Card -->
      <div class="card mb-6">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h2>
            <button
              v-if="!isEditing"
              @click="isEditing = true"
              class="btn btn-primary"
            >
              Edit Profile
            </button>
          </div>
        </div>
        
        <div class="px-6 py-4">
          <form @submit.prevent="updateProfile">
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  v-model="formData.username"
                  type="text"
                  :readonly="!isEditing"
                  :class="[
                    'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none',
                    isEditing 
                      ? 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  ]"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  v-model="formData.email"
                  type="email"
                  :readonly="!isEditing"
                  :class="[
                    'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none',
                    isEditing 
                      ? 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  ]"
                  required
                />
              </div>

              <div v-if="isEditing">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                  <span class="text-xs text-gray-500 dark:text-gray-400">(required to change password)</span>
                </label>
                <input
                  v-model="formData.currentPassword"
                  type="password"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div v-if="isEditing">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                  <span class="text-xs text-gray-500 dark:text-gray-400">(leave blank to keep current password)</span>
                </label>
                <input
                  v-model="formData.newPassword"
                  type="password"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div v-if="isEditing && formData.newPassword">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  v-model="formData.confirmPassword"
                  type="password"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div v-if="isEditing">
                <div class="mb-4">
                  <label class="flex items-center">
                    <input
                      v-model="formData.is_admin"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Admin User</span>
                  </label>
                </div>
              </div>
            </div>
            <div
              v-if="isEditing"
              class="mt-6 flex justify-end space-x-4"
            >
              <button
                type="button"
                @click="cancelEdit"
                class="btn btn-secondary"
                :disabled="isLoading"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isLoading"
              >
                <span v-if="isLoading">Saving...</span>
                <span v-else>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Account Details Card -->
      <div class="card">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Account Details</h2>
        </div>
        
        <div class="px-6 py-4">
          <dl class="grid grid-cols-1 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</dt>
              <dd class="mt-1">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="authStore.user?.is_active 
                    ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'"
                >
                  {{ authStore.user?.is_active ? 'Active' : 'Inactive' }}
                </span>
              </dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Account Type</dt>
              <dd class="mt-1">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="authStore.user?.is_admin 
                    ? 'text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30'
                    : 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'"
                >
                  {{ authStore.user?.is_admin ? 'Administrator' : 'Standard User' }}
                </span>
              </dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {{ formatDate(authStore.user?.created_at) }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>