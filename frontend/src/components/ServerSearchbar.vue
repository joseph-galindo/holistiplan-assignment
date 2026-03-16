<script>
export default {
  name: 'ServerSearchbar',
  props: {
    searchString: {
      type: String,
      default: '',
    },
  },
  emits: ['search-input'],
  setup(props, { emit }) {
    const handleChange = (event) => {
      emit('search-input', event.target.value);
    };

    return {
      handleChange,
    };
  },
};
</script>

<template>
  <div class="mb-8">
    <input
      id="search-server-input"
      type="text"
      placeholder="Search servers by name, IP, status, location..."
      class="min-w-full"
      :value="searchString"
      @input="handleChange"
    />
  </div>
</template>