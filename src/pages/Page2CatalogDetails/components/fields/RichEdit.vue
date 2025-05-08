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
    value: any; // Сырые данные поля
  }>();

  const popover = ref();
  
  // Определяем тип и форматирование данных
  const contentType = computed(() => {
    return detectContentType(props.value);
  });

  const buttonLabel = computed(() => {
    return `[${contentType.value.label}]`;
  });

  const formattedData = computed(() => {
    return contentType.value.formattedValue;
  });

  const toggle = (event: Event) => {
    popover.value.toggle(event);
  };

  // Тип для значения поля
  type FieldValue = any;
  
  type ContentTypeResult = {
    label: string;
    value: FieldValue;
    formattedValue: string; // Отформатированное значение для отображения
  };

  /**
   * Определяет тип содержимого (JSON, YAML, HTML, CSS, SQL)
   */
  function detectContentType(value: any): ContentTypeResult {
    // Для массивов показываем количество элементов
    if (Array.isArray(value)) {
      return {
        label: `Array(${value.length})`,
        value,
        formattedValue: JSON.stringify(value, null, 2),
      };
    }

    // Для объектов проверяем, можно ли их сериализовать в JSON
    if (typeof value === 'object' && value !== null) {
      try {
        const formatted = JSON.stringify(value, null, 2);
        return {
          label: 'JSON',
          value,
          formattedValue: formatted,
        };
      } catch (e) {
        // Если не удалось сериализовать, это не JSON
        return {
          label: 'Object',
          value,
          formattedValue: String(value),
        };
      }
    }

    // Для других типов данных
    if (typeof value !== 'string') {
      return {
        label: typeof value,
        value,
        formattedValue: String(value),
      };
    }

    // Проверяем на JSON строки
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        JSON.parse(value);
        return {
          label: 'JSON',
          value,
          formattedValue: JSON.stringify(JSON.parse(value), null, 2),
        };
      } catch (e) {
        // Если не удалось распарсить, это не JSON
      }
    }

    // Проверяем на HTML
    if (
      value.includes('<html') ||
      value.includes('<!DOCTYPE html') ||
      (value.includes('<') && value.includes('</') && value.includes('>'))
    ) {
      return {
        label: 'HTML',
        value,
        formattedValue: value,
      };
    }

    // Проверяем на YAML
    if (
      value.includes(':') &&
      value.includes('\n') &&
      !value.includes('{') &&
      !value.includes('[') &&
      (value.includes('  ') || value.includes('- '))
    ) {
      return {
        label: 'YAML',
        value,
        formattedValue: value,
      };
    }

    // Проверяем на CSS
    if (value.includes('{') && value.includes('}') && value.includes(':') && value.includes(';')) {
      return {
        label: 'CSS',
        value,
        formattedValue: value,
      };
    }

    // Проверяем на SQL
    if (
      (value.toUpperCase().includes('SELECT') && value.toUpperCase().includes('FROM')) ||
      value.toUpperCase().includes('INSERT INTO') ||
      (value.toUpperCase().includes('UPDATE') && value.toUpperCase().includes('SET'))
    ) {
      return {
        label: 'SQL',
        value,
        formattedValue: value,
      };
    }

    return {
      label: 'String',
      value,
      formattedValue: value,
    };
  }
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
