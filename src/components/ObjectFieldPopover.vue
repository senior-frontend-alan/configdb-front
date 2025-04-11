<template>
  <div class="object-field-popover">
    <Button type="button" :label="getButtonLabel()" @click="toggle" class="p-button-sm" />

    <Popover ref="popoverRef" :showCloseIcon="true" style="max-width: 500px">
      <div class="flex flex-col gap-2 p-3">
        <pre class="text-sm bg-surface-100 p-2 rounded overflow-auto max-h-60">{{
          JSON.stringify(fieldData, null, 2)
        }}</pre>
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import Button from 'primevue/button';
  import Popover from 'primevue/popover';

  const props = defineProps({
    fieldData: {
      type: [Object, Array],
      required: true,
    },
  });

  const popoverRef = ref();

  // Определяем тип содержимого (JSON, YAML, HTML)
  const detectContentType = (value: any): string => {
    // Для объектов проверяем, можно ли их сериализовать в JSON
    if (typeof value === 'object' && value !== null) {
      try {
        JSON.stringify(value);
        return 'JSON';
      } catch (e) {
        // Если не удалось сериализовать, это не JSON
        return 'Object';
      }
    }

    if (typeof value !== 'string') return '';

    // Проверяем на JSON строки
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        JSON.parse(value);
        return 'JSON';
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
      return 'HTML';
    }

    // Проверяем на YAML
    if (
      value.includes(':') &&
      value.includes('\n') &&
      !value.includes('{') &&
      !value.includes('[') &&
      (value.includes('  ') || value.includes('- '))
    ) {
      return 'YAML';
    }

    // Проверяем на CSS
    if (value.includes('{') && value.includes('}') && value.includes(':') && value.includes(';')) {
      return 'CSS';
    }

    // Проверяем на SQL
    if (
      (value.toUpperCase().includes('SELECT') && value.toUpperCase().includes('FROM')) ||
      value.toUpperCase().includes('INSERT INTO') ||
      (value.toUpperCase().includes('UPDATE') && value.toUpperCase().includes('SET'))
    ) {
      return 'SQL';
    }

    return '';
  };

  // Получаем текст для кнопки
  const getButtonLabel = () => {
    // Для строковых значений определяем тип содержимого
    if (typeof props.fieldData === 'string') {
      const contentType = detectContentType(props.fieldData);
      if (contentType) {
        return `[${contentType}]`;
      }
      return 'Данные';
    }

    // Для массивов показываем количество элементов
    if (Array.isArray(props.fieldData)) {
      return `[${(props.fieldData as any[]).length}]`;
    }

    // Для объектов определяем тип
    if (typeof props.fieldData === 'object' && props.fieldData !== null) {
      const contentType = detectContentType(props.fieldData);
      return `[${contentType}]`;
    }

    // Для всех остальных типов просто возвращаем имя поля
    return 'Данные';
  };

  // Показываем/скрываем popover
  const toggle = (event: Event) => {
    popoverRef.value.toggle(event);
  };
</script>
