<template>
  <!-- Если не нужно показывать кнопку, просто выводим текст -->
  <template v-if="!shouldShowButton">
    {{ text }}
  </template>
  
  <!-- Если нужно показывать кнопку, выводим кнопку и popover -->
  <div v-else class="text-expand-button">
    <span>{{ truncatedText }}</span>
    <Button
      icon="pi pi-search-plus"
      class="p-button-rounded p-button-text p-button-sm"
      aria-label="Показать полный текст"
      @click="toggle($event)"
    />
    
    <Popover ref="popover" :pt="{ root: { class: 'text-popover' } }">
      <div class="text-popover-content">
        {{ text }}
        <Button
          icon="pi pi-times"
          class="p-button-rounded p-button-text p-button-sm close-button absolute-top-right"
          @click="close"
        />
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Popover from 'primevue/popover';

const props = defineProps<{
  text: string;
  maxLength?: number;
}>();

const popover = ref();

const shouldShowButton = computed(() => {
  if (!props.text) return false;
  return props.maxLength ? props.text.length > props.maxLength : false;
});

const truncatedText = computed(() => {
  if (!props.text) return '';
  if (!props.maxLength || props.text.length <= props.maxLength) return props.text;
  return `${props.text.substring(0, props.maxLength)}...`;
});

const toggle = (event: Event) => {
  popover.value.toggle(event);
};

const close = () => {
  popover.value.hide();
};
</script>

<style scoped>
.text-expand-button {
  display: inline-block;
  margin-left: 4px;
}

.text-popover-content {
  display: flex;
  align-items: center;
  min-width: 300px;
  max-width: 500px;
}

.text-popover-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

</style>
