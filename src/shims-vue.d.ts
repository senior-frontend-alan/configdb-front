declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // Расширяем определение компонента для лучшей поддержки <script setup>
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Добавляем поддержку JSX элементов
declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any
  }
}
