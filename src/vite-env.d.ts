/// <reference types="vite/client" />

// Таким образом, хотя Vite и TypeScript работают независимо, они должны "договориться" о том,
// как интерпретировать специальные импорты. Файл vite-env.d.ts - это и есть такой "договор",
// который позволяет TypeScript понимать особенности Vite при проверке типов в IDE.

// Когда TypeScript Language Server анализирует код в IDE, он видит импорты с ?url
// Без декларации типов он выдаст ошибку "Cannot find module"
// Объявление типов для импортов с суффиксом ?url
declare module '*?url' {
  const src: string;
  export default src;
}
