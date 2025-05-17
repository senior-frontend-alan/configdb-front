// src/composables/useModuleName.ts
import { computed } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Композабл для получения текущего имени модуля из параметров маршрута
 * Это позволяет всему приложению иметь доступ к текущему moduleName
 * без необходимости каждый раз извлекать его из URL
 */
export function useModuleName() {
  const route = useRoute();
  
  // Получаем moduleName из параметров маршрута
  const moduleName = computed(() => {
    return route.params.moduleName as string || '';
  });

  return {
    moduleName
  };
}
