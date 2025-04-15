<template>
  <div class="rich-edit-popover">
    <Button
      type="button"
      :label="buttonLabel"
      icon="pi pi-external-link"
      class="p-button-text p-button-sm"
      @click="toggle"
    />
    <Popover ref="popover">
      <pre>{{ formattedData }}</pre>
    </Popover>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import Button from 'primevue/button';
  import Popover from 'primevue/popover';

  const props = defineProps<{
    fieldData: any; // Данные поля (объект с полями label, value и formattedValue)
  }>();

  const popover = ref();

  const buttonLabel = computed(() => {
    return `[${props.fieldData.label || 'Object'}]`;
  });

  const formattedData = computed(() => {
    return props.fieldData.formattedValue || '';
  });

  const toggle = (event: Event) => {
    popover.value.toggle(event);
  };
</script>

<style scoped>
  .rich-edit-popover .p-button-text {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .rich-edit-panel {
    max-width: 90vw;
    max-height: 80vh;
    overflow: auto;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: monospace;
    font-size: 0.875rem;
    line-height: 1.5;
  }
</style>
