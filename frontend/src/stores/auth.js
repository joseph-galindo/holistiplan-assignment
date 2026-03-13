import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authAPI } from '../services/api';

// Made this a separate transformer fn,
// to re-use it for login (POST /auth/login) and for auth check (GET /auth/me)
const generateTransformedUserObject = (userObject) => {
  // Only process objects. When given other data types, just return them.
  if (typeof userObject !== 'object') {
    return userObject;
  }

  // Generate transformed data, using the raw backend user object as a base

  // -- TRANSFORMATIONS START --
  // user.created_at
  // Transform user.created_at timestamp from backend when needed, to ensure timezone info
  // TODO: handle in backend instead
  const standardCreationTimestamp = generateTimeWithTimezone(userObject.created_at);
  // -- TRANSFORMATIONS END --

  // Apply transformations by returning a shallow clone of the original user,
  // with transformations merged in afterwards
  return {
    ...userObject,
    created_at: standardCreationTimestamp,
  };
};

const generateTimeWithTimezone = (timeString) => {
  // Only process strings. When given non-strings, just return them.
  if (typeof timeString !== 'string') {
    return timeString;
  }

  // User date strings seem to be stored in db as ISO 8601 (local time):
  // YYYY-MM-DDTHH:mm:ss.sss
  //
  // ISO 8601 typically provides the Z suffix to clarify UTC+0 (Zulu) time, like so:
  // YYYY-MM-DDTHH:mm:ss.sssZ
  //
  // When building the app, I noticed the time value was really a UTC time, but
  // the Z was missing, resulting in JS `new Date()` following ISO spec and treating it as local time.
  //
  // Altogether, this results in the db returning a string like '2026-03-11T21:11:36.390358'
  // to represent 3/11/2026 9:11:36pm UTC+0. (aka 5:11:36pm EST or UTC-4)
  //
  // However, without the Z, the frontend interprets this as local time,
  // and shows users in the EST timezone this string:
  // "March 11, 2026 at 09:11 PM"
  //
  // I dug a bit and it seems to be a quirk specific to datetime.isoformat() and sqlalchemy
  // when using python3 older than py3.11.
  // In py3.9, isoformat() gives a suffix of '+00:00' instead of 'Z'.
  // In py3.11, fromisoformat() changed to support parsing out both '+00:00' and 'Z' style.
  // More info: https://discuss.python.org/t/parse-z-timezone-suffix-in-datetime/2220
  //
  // To address the bug, there's two ways to go about it
  // - backend (ideal in my opinion)
  //   - (fix problem for future user creation) fix the logic in the backend service that handles user creation.
  //   - (fix problem for pre-existing users in the db) after, prepare a sql migration to migrate existing timestamps in the db to append the 'Z'. Apply migration to the existing db
  // - frontend
  //   - leave backend data as it is. Have the frontend detect a missing suffix and replace with 'Z' as needed
  
  // Step 1 - determine if the time string returned from the backend already has timezone info
  // ISO 8601 allows timezone info to come in multiple formats, so check for all of them

  // match ISO 8601 strings ending in 'Z' for zulu time
  // match ISO 8601 strings ending in '-hh:mm' or '+hh:mm'
  // match ISO 8601 strings ending in '-hhmm' or '+hhmm'
  // match ISO 8601 strings ending in '-hh' or '+hh'
  const zuluRegex = /Z$/;
  const hourColonMinuteRegex = /[\-\+]\d{2}:\d{2}$/;
  const hourMinuteRegex = /[\-\+]\d{4}$/;
  const hourOnlyRegex = /[\-\+]\d{2}$/;

  const regexesToTest = [
    zuluRegex,
    hourColonMinuteRegex,
    hourMinuteRegex,
    hourOnlyRegex,
  ];

  const doesTimestringHaveTimezone = regexesToTest.some((reg) => {
    const regMatchArray = timeString.match(reg);
    const isMatchFound = regMatchArray !== null;

    return isMatchFound;
  });

  // Step 2 - if the original backend string already has timezone info, return it as-is
  if (doesTimestringHaveTimezone) {
    return timeString;
  }

  // Step 3 - the original backend string has no timezone info, so stub it in and return
  const timeStringWithTimezone = `${timeString}Z`;

  return timeStringWithTimezone;
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!user.value);

  const login = async (credentials) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Get original user auth API response
      const response = await authAPI.login(credentials);

      // Apply any transformations needed from original backend user object, to format frontend needs
      const transformedUser = generateTransformedUserObject(response.data.user);
      response.data.user = transformedUser;

      // Then pass it along to vue store, and localstorage (for auth persistence on different pages in the MPA)
      user.value = response.data.user;
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (userData) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Registration failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;
    
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      user.value = null;
      localStorage.removeItem('user');
      isLoading.value = false;
    }
  };

  const checkAuth = async () => {
    // Check localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
        // Verify with backend
        const response = await authAPI.getCurrentUser();

        // Apply any transformations needed from original backend user object, to format frontend needs
        const transformedUser = generateTransformedUserObject(response.data.user);
        response.data.user = transformedUser;

        // Then pass it along to the vue store
        user.value = response.data.user;
      } catch (err) {
        // If verification fails, clear local storage
        console.error('Auth check failed:', err);
        user.value = null;
        localStorage.removeItem('user');
      }
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    clearError
  };
});
