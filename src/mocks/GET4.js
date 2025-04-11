// Пример GET-ответа с разными типами полей
export const GET4 = (() => {
    // Определяем значения для разных типов данных
    const row1 = 1.234;
    const row2 = '1.234';
    const row3 = '2025-03-17T14:30:39.454382+03:00';

    // (данные для поля LayoutRichEditField)
    // Вариант 1: Простой JSON объект
    const row4_0 = {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "version": "1.0.0",
        "content": {
            "title": "Заголовок документа",
            "sections": [
                {
                    "id": 1,
                    "name": "Раздел 1",
                    "content": "Содержимое раздела 1"
                },
                {
                    "id": 2,
                    "name": "Раздел 2",
                    "content": "Содержимое раздела 2"
                }
            ],
            "metadata": {
                "author": "Автор документа",
                "created_at": "2025-04-10T15:19:37+03:00",
                "tags": ["документ", "пример", "json"]
            }
        }
    };
    // Вариант 2: Форматированный текст
    const row4_1 = "<h1>Заголовок документа</h1><p>Это <strong>форматированный</strong> текст с <em>разными</em> стилями.</p><ul><li>Пункт 1</li><li>Пункт 2</li></ul>";
    // Вариант 3: YAML
    const row4_2 = "title: Заголовок документа\nversion: 1.0.0\nsections:\n  - name: Раздел 1\n    content: Содержимое раздела 1\n  - name: Раздел 2\n    content: Содержимое раздела 2";
    // Вариант 4: Код
    const row4_3 = "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}";

    return {
        // Общее количество результатов
        "count": 4,
        // Ссылка на следующую страницу (null, если это последняя страница)
        "next": null,
        // Ссылка на предыдущую страницу (null, если это первая страница)
        "previous": null,
        "results": [
            {
                "layout_field": row1,
                "layout_integer_field": row1,
                "integer_field": row1,
                "decimal_field": row1,
                "layout_char_field": row1,
                "char_field": row1,
                "date_time_field": row1,
                "date_field": row1,
                "time_field": row1,
                "layout_rich_edit_field": row1,
                // Доп поля
                "id": 1,
                "date_created": "2025-03-17T14:30:39.454382+03:00",
                "date_updated": "2025-04-03T15:24:33.747898+03:00",
            },
            {
                "layout_field": row2,
                "layout_integer_field": row2,
                "integer_field": row2,
                "decimal_field": row2,
                "layout_char_field": row2,
                "char_field": row2,
                "date_time_field": row2,
                "date_field": row2,
                "time_field": row2,
                "layout_rich_edit_field": row2,
                // Доп поля
                "id": 2,
                "date_created": "2025-03-17T14:30:39.454382+03:00",
                "date_updated": "2025-04-03T15:24:33.747898+03:00",
            },
            {
                "layout_field": row3,
                "layout_integer_field": row3,
                "integer_field": row3,
                "decimal_field": row3,
                "layout_char_field": row3,
                "char_field": row3,
                "date_time_field": row3,
                "date_field": row3,
                "time_field": row3,
                "layout_rich_edit_field": row3,
                // Доп поля
                "id": 3,
                "date_created": "2025-03-17T14:30:39.454382+03:00",
                "date_updated": "2025-04-03T15:24:33.747898+03:00",
            },
            {
                "layout_field": row4_0,
                "layout_integer_field": row4_0,
                "integer_field": row4_0,
                "decimal_field": row4_0,
                "layout_char_field": row4_0,
                "char_field": row4_0,
                "date_time_field": row4_0,
                "date_field": row4_0,
                "time_field": row4_0,
                "layout_rich_edit_field": row4_0,
                // Доп поля
                "id": 4,
                "date_created": "2025-03-17T14:30:39.454382+03:00",
                "date_updated": "2025-04-03T15:24:33.747898+03:00",
            },
            {
                "layout_field": row4_1,
                "layout_integer_field": row4_1,
                "integer_field": row4_1,
                "decimal_field": row4_1,
                "layout_char_field": row4_1,
                "char_field": row4_1,
                "date_time_field": row4_1,
                "date_field": row4_1,
                "time_field": row4_1,
                "layout_rich_edit_field": row4_1,
                // Доп поля
                "id": 4,
                "date_created": "2025-03-17T14:30:39.454382+03:00",
                "date_updated": "2025-04-03T15:24:33.747898+03:00",
            },
            {
                "layout_field": row4_2,
                "layout_integer_field": row4_2,
                "integer_field": row4_2,
                "decimal_field": row4_2,
                "layout_char_field": row4_2,
                "char_field": row4_2,
                "date_time_field": row4_2,
                "date_field": row4_2,
                "time_field": row4_2,
                "layout_rich_edit_field": row4_2,
                // Доп поля
                "id": 4,
                "date_created": "2025-03-17T14:30:39.454382+03:00",
                "date_updated": "2025-04-03T15:24:33.747898+03:00",
            },
            {
                "id": 2,
                "date_created": "2025-03-18T10:15:22.123456+03:00",
                "date_updated": "2025-04-02T09:45:11.987654+03:00",
                // Все поля из OPTIONS4.js
                "layout_computed_field": "Объект 2 (ID: 67890)",
                "layout_field": "550e8400-e29b-41d4-a716-446655440002",
                "layout_char_field": "test_object_2",
                "layout_integer_field": 50,
                "layout_rich_edit_field": {
                    "id": "550e8400-e29b-41d4-a716-446655440003",
                    "version": "1.1.0"
                },
                "layout_related_field": {
                    "id": 2,
                    "name": "Родитель 2",
                    "description": "Описание второго родительского объекта"
                },
                "layout_choice_field": "inactive",
                "layout_inline_layout": [
                    {
                        "id": 201,
                        "name": "Деталь A",
                        "value": "Значение A",
                        "created_at": "2025-03-19T11:30:00.000000+03:00"
                    }
                ],
                "float_field": 456.78,
                "boolean_field": false
            },
            {
                "id": 3,
                "date_created": "2025-03-19T08:45:33.654321+03:00",
                "date_updated": "2025-04-01T16:20:45.123456+03:00",
                // Все поля из OPTIONS4.js
                "layout_computed_field": "Объект 3 (ID: 24680)",
                "layout_field": "550e8400-e29b-41d4-a716-446655440004",
                "layout_char_field": "test_object_3",
                "layout_integer_field": 25,
                "layout_rich_edit_field": {
                    "id": "550e8400-e29b-41d4-a716-446655440005",
                    "version": "2.0.0"
                },
                "layout_related_field": null, // Пример с null для необязательного поля
                "layout_choice_field": "deleted",
                "layout_inline_layout": [], // Пустой массив для встроенного объекта
                "float_field": 0.01,
                "boolean_field": true
            },
            {
                "id": 4,
                "date_created": "2025-03-20T14:22:11.112233+03:00",
                "date_updated": "2025-03-31T10:10:10.101010+03:00",
                // Все поля из OPTIONS4.js
                "layout_computed_field": "Объект 4 (ID: 13579)",
                "layout_field": "550e8400-e29b-41d4-a716-446655440006",
                "layout_char_field": "test_object_4",
                "layout_integer_field": 100,
                "layout_rich_edit_field": {
                    "id": "550e8400-e29b-41d4-a716-446655440007",
                    "version": "1.0.0"
                },
                "layout_related_field": {
                    "id": 1,
                    "name": "Родитель 1",
                    "description": "Описание родительского объекта"
                },
                "layout_choice_field": "active",
                "layout_inline_layout": [
                    {
                        "id": 401,
                        "name": "Деталь X",
                        "value": "Значение X",
                        "created_at": "2025-03-15T09:00:00.000000+03:00"
                    },
                    {
                        "id": 402,
                        "name": "Деталь Y",
                        "value": "Значение Y",
                        "created_at": "2025-03-16T10:20:00.000000+03:00"
                    },
                    {
                        "id": 403,
                        "name": "Деталь Z",
                        "value": "Значение Z",
                        "created_at": "2025-03-17T11:40:00.000000+03:00"
                    }
                ],
                "float_field": 789.01,
                "boolean_field": false
            }
        ]
    };
})();