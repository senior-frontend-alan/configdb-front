<!-- !!! ВНИМАНИЕ !!!
ManyRelatedObj = [{id: 1, name: "Object Name-1"}, {id: 2, name: "Object Name-2"}]; 
смотреть всегда на ?mode=short отобразить чипсами (заранее из OPTIONS НЕ знаем! поэтому name приходит тут)
-->

<template>
  <div class="many-related-chips">
    <template v-if="hasError">
      <span class="text-red-500">{{ INVALID_DATA_TYPE }}</span>
    </template>
    <template v-else>
      <Chip 
        v-for="item in items" 
        :key="item.id" 
        :label="item.name" 
        class="mr-1 mb-1"
      />
      <span v-if="!items.length" class="text-gray-500">—</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import Chip from 'primevue/chip';
import { computed } from 'vue';
import { FRONTEND } from '../../../../services/fieldTypeService';
import { INVALID_DATA_TYPE } from './ManyRelated';

interface ManyRelatedItem {
  id: number | string;
  name: string;
  [key: string]: any;
}

interface Props {
  value: ManyRelatedItem[] | null | undefined;
  field: {
    FRONTEND_CLASS: typeof FRONTEND.MANY_RELATED;
    [key: string]: any;
  };
}

const props = defineProps<Props>();

const items = computed<ManyRelatedItem[]>(() => {
  if (!props.value) {
    return [];
  }
  
  if (!Array.isArray(props.value)) {
    console.error('Ошибка в ManyRelated.vue: неверный тип данных', props.value);
    return [];
  }

  try {
    return props.value.map(item => {
      if (typeof item === 'object' && item !== null) {
        if (!item.hasOwnProperty('name') && !item.hasOwnProperty('id')) {
          throw new Error('Объект не содержит ни name, ни id');
        }
        return {
          id: item.id,
          name: item.name || String(item.id)
        };
      }
      return {
        id: item,
        name: String(item)
      };
    });
  } catch (error) {
    console.error('Ошибка при обработке many_related данных:', error, props.value);
    return [];
  }
});

const hasError = computed(() => {
  return !props.value || !Array.isArray(props.value) || 
    (Array.isArray(props.value) && props.value.some(item => 
      typeof item === 'object' && item !== null && 
      !item.hasOwnProperty('name') && !item.hasOwnProperty('id')
    ));
});
</script>

<style scoped>
.many-related-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
