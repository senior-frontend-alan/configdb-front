<template>
  <div class="mb-1 p-2 border rounded-lg" :class="{ 'field-modified': props.isModified }">
    <div class="flex justify-content-between align-items-center mb-1">
      <label :for="id">{{ label }}</label>
      <div class="flex align-items-center">
        <Button
          v-if="editorMode === 'json'"
          icon="pi pi-code"
          class="p-button-text p-button-sm mr-2"
          @click="formatJson"
          v-tooltip="'Форматировать JSON'"
        />
        <span class="text-xs px-2 py-1 bg-gray-100 border-round-sm">{{ editorMode }}</span>
      </div>
    </div>
    <VAceEditor
      ref="aceEditorRef"
      :id="id"
      v-model:value="value"
      :lang="editorMode"
      :theme="'chrome'"
      :disabled="disabled"
      :readonly="readonly"
      :options="editorOptions"
      class="w-full"
      style="height: 300px"
      @init="editorInit"
    />
  </div>
  <div v-if="help_text" class="mb-2">
    <Message severity="secondary" variant="simple" size="small">{{ help_text }}</Message>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { VAceEditor } from 'vue3-ace-editor';
  import ace from 'ace-builds';
  import Message from 'primevue/message';
  import Button from 'primevue/button';
  import { FRONTEND } from '../../../../services/fieldTypeService';

  // Режимы и темы для AceEditor
  import 'ace-builds/src-noconflict/mode-json';
  import 'ace-builds/src-noconflict/mode-yaml';
  import 'ace-builds/src-noconflict/mode-html';
  import 'ace-builds/src-noconflict/mode-javascript';
  import 'ace-builds/src-noconflict/mode-typescript';
  import 'ace-builds/src-noconflict/mode-xml';
  import 'ace-builds/src-noconflict/mode-markdown';
  import 'ace-builds/src-noconflict/mode-css';
  import 'ace-builds/src-noconflict/theme-chrome';

  // Автодополнения и подсказок
  import 'ace-builds/src-noconflict/ext-language_tools';
  import 'ace-builds/src-noconflict/ext-searchbox';
  import 'ace-builds/src-noconflict/ext-error_marker';
  import 'ace-builds/src-noconflict/snippets/json';
  import 'ace-builds/src-noconflict/snippets/yaml';
  import 'ace-builds/src-noconflict/snippets/html';
  import 'ace-builds/src-noconflict/snippets/javascript';
  import 'ace-builds/src-noconflict/snippets/typescript';
  import 'ace-builds/src-noconflict/snippets/xml';
  import 'ace-builds/src-noconflict/snippets/markdown';
  import 'ace-builds/src-noconflict/snippets/css';

  // Для Vite не импортируем воркеры напрямую, а настраиваем их в onMounted

  interface FieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.RICH_EDIT;
    name: string;
    label?: string;
    readonly?: boolean;
    help_text?: string;
    class_name?: string;
    element_id?: string;
    field_class?: string;
    allow_null?: boolean;
    input_type?: string;
    edit_mode?:
      | 'json'
      | 'yaml'
      | 'xml'
      | 'html'
      | 'css'
      | 'javascript'
      | 'typescript'
      | 'markdown'
      | string;
    show_if?: Record<string, any>;

    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    modelValue?: string;
    options: FieldOptions;
    isModified?: boolean;
  }>();

  const id = computed(() => props.options.name);
  const label = computed(
    () => (props.options.label || props.options.name) + (required.value ? ' *' : ''),
  );
  const help_text = computed(() => props.options.help_text);
  const disabled = computed(() => props.options.readonly || false);
  const readonly = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);

  // Определяем режим редактора на основе edit_mode из опций
  const editorMode = computed(() => {
    const mode = props.options.edit_mode || 'json';
    // Приводим к формату, который понимает AceEditor
    return mode.toLowerCase();
  });

  const editorOptions = computed(() => ({
    fontSize: 14,
    showPrintMargin: false,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    showLineNumbers: true,
    tabSize: 2,
    wrap: true,
    showGutter: true,
    highlightActiveLine: true,
    // Настройки для отображения ошибок
    useWorker: true,
  }));

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();

  const value = ref(props.modelValue || '');

  // Оба вызова setUseWorker(true) действительно необходимы:
  // Вызов в editorInit срабатывает, когда редактор только инициализируется через событие @init
  // Вызов в onMounted необходим для случаев, когда редактор уже был инициализирован до регистрации воркеров
  // Инициализация редактора
  const editorInit = (editor: any) => {
    // Сохраняем ссылку на экземпляр редактора
    aceInstance.value = editor;

    // Включаем проверку синтаксиса и отображение ошибок
    editor.getSession().setUseWorker(true);

    // Дополнительные настройки в зависимости от режима
    if (editorMode.value === 'json') {
      // Для JSON добавляем автоформатирование
      formatJson();
    }
  };

  // Форматирование JSON
  const formatJson = () => {
    if (editorMode.value === 'json') {
      try {
        if (value.value && value.value.trim()) {
          const formatted = JSON.stringify(JSON.parse(value.value), null, 2);
          value.value = formatted;
        }
      } catch (e) {
        console.error('Ошибка при форматировании JSON:', e);
      }
    }
  };

  // Обновляем локальное значение при изменении props.modelValue
  watch(
    () => props.modelValue,
    (newValue) => {
      value.value = newValue || '';
    },
  );

  // Отправляем событие при изменении локального значения
  watch(value, (newValue) => {
    emit('update:modelValue', newValue);
  });

  // Ссылки на экземпляр редактора
  const aceEditorRef = ref<any>(null);
  const aceInstance = ref<any>(null);

  // Настраиваем редактор после монтирования компонента
  onMounted(async () => {
    // Динамически импортируем и регистрируем воркеры для проверки синтаксиса
    // Это работает с Vite, который поддерживает динамические импорты
    const jsonWorker = await import('ace-builds/src-noconflict/worker-json?url');
    const htmlWorker = await import('ace-builds/src-noconflict/worker-html?url');
    const jsWorker = await import('ace-builds/src-noconflict/worker-javascript?url');
    const cssWorker = await import('ace-builds/src-noconflict/worker-css?url');
    const xmlWorker = await import('ace-builds/src-noconflict/worker-xml?url');
    const yamlWorker = await import('ace-builds/src-noconflict/worker-yaml?url');

    // Регистрируем URL воркеров
    ace.config.setModuleUrl('ace/mode/json_worker', jsonWorker.default);
    ace.config.setModuleUrl('ace/mode/html_worker', htmlWorker.default);
    ace.config.setModuleUrl('ace/mode/javascript_worker', jsWorker.default);
    ace.config.setModuleUrl('ace/mode/css_worker', cssWorker.default);
    ace.config.setModuleUrl('ace/mode/xml_worker', xmlWorker.default);
    ace.config.setModuleUrl('ace/mode/yaml_worker', yamlWorker.default);

    // Проверяем, что экземпляр редактора доступен
    // Когда мы регистрируем URL-адреса воркеров с помощью ace.config.setModuleUrl(),
    // нам также нужно явно включить использование воркеров для уже существующих экземпляров редактора.
    if (aceEditorRef.value) {
      const editor = aceEditorRef.value.getAceInstance();
      if (editor) {
        // Включаем проверку синтаксиса
        editor.getSession().setUseWorker(true);
      }
    }
  });
</script>

<style scoped></style>
