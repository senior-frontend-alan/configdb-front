// Пример GET-ответа с разными типами полей
export const GET4 = (() => {
    // Определяем значения для разных типов данных
    const Integer = 1.234;
    const ArrayInteger = [1.234, 2.345];
    const String = '1.234';
    const ArrayString = ['1.234', '2.345'];
    const DateString = '2025-03-17T14:30:39.454382+03:00';

    // (данные для поля LayoutRichEditField)
    // Вариант 1: Простой JSON объект
    const JSON = {
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
    const HTMLString = "<h1>Заголовок документа</h1><p>Это <strong>форматированный</strong> текст с <em>разными</em> стилями.</p><ul><li>Пункт 1</li><li>Пункт 2</li></ul>";
    // Вариант 3: YAML
    const YAMLString = "title: Заголовок документа\nversion: 1.0.0\nsections:\n  - name: Раздел 1\n    content: Содержимое раздела 1\n  - name: Раздел 2\n    content: Содержимое раздела 2";
    // Вариант 4: Код
    const CodeString = "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}";
    const Computed = "return {\"1\": \"ApplicationID\", \"2\": \"AVP\", \"3\": \"AVPExist\", \"4\": \"CommandCode\", \"5\": \"RequestType\", \"6\": \"DestinationHost\", \"7\": \"DestinationRealm\", \"8\": \"OriginHost\", \"9\": \"OriginRealm\", \"10\": \"PeerHost\", \"11\": \"PipelineProfile\", \"12\": \"TrafficFlow\", \"13\": \"InvokeHost\", \"14\": \"IMSI\", \"15\": \"IP\", \"16\": \"MessagePriority\", \"17\": \"ResultCode\", \"18\": \"ExperimentalResultCode\", \"19\": \"HttpUri\", \"20\": \"CTX\"}?.[row.attribute];"
    const RelatedObj = {id: 1, name: "Object Name-1"}; // всегда такой формы строгой формы и отобразим name
    const RelatedObjIncorrect = {id: 1}; // (красным) "<id: 1>"
    const RelatedIncorrect = 1 // придет 1 или строка "123" Отобразить как внутренний идентификатор (красным) "<id: 1>"
    const RelatedArrayObj = [{id: 1, name: "Object Name-1"}, {id: 2, name: "Object Name-2"}]; // смотреть всегда на ?mode=short отобразить чипсами (заранее из OPTIONS НЕ знаем! поэтому name приходит тут)
    const Choice = 1 // или строка "2" приводить все к строке
    const MultipleChoice = [1, 2] // дни недели например (заранее из OPTIONS знаем)
    // у Choice могут быть доп св-ва, widget? написать Жене Дорониной узнать information warning critical error

    return {
        // Общее количество результатов
        "count": 4,
        // Ссылка на следующую страницу (null, если это последняя страница)
        "next": null,
        // Ссылка на предыдущую страницу (null, если это первая страница)
        "previous": null,
        "results": [
            {
                "layout_field": Integer,
                "layout_integer_field": Integer,
                "integer_field": Integer,
                "decimal_field": Integer,
                "layout_char_field": Integer,
                "char_field": Integer,
                "date_time_field": Integer,
                "date_field": Integer,
                "time_field": Integer,
                "layout_rich_edit_field": Integer,
                "layout_computed_field": Integer,
                "layout_related_field": Integer,
                "layout_related_field_multiple": Integer,
                // Доп поля
                "id": 0,
                // "date_created": "2025-03-17T14:30:39.454382+03:00",
                // "date_updated": "2025-04-03T15:24:33.747898+03:00",
            },
            {
                "layout_field": String,
                "layout_integer_field": String,
                "integer_field": String,
                "decimal_field": String,
                "layout_char_field": String,
                "char_field": String,
                "date_time_field": String,
                "date_field": String,
                "time_field": String,
                "layout_rich_edit_field": String,
                "layout_computed_field": String,
                "layout_related_field": String,
                "layout_related_field_multiple": String,
                "id": 1,
            },
            {
                "layout_field": DateString,
                "layout_integer_field": DateString,
                "integer_field": DateString,
                "decimal_field": DateString,
                "layout_char_field": DateString,
                "char_field": DateString,
                "date_time_field": DateString,
                "date_field": DateString,
                "time_field": DateString,
                "layout_rich_edit_field": DateString,
                "layout_computed_field": DateString,
                "layout_related_field": DateString,
                "layout_related_field_multiple": DateString,
                "id": 2,
            },
            {
                "layout_field": JSON,
                "layout_integer_field": JSON,
                "integer_field": JSON,
                "decimal_field": JSON,
                "layout_char_field": JSON,
                "char_field": JSON,
                "date_time_field": JSON,
                "date_field": JSON,
                "time_field": JSON,
                "layout_rich_edit_field": JSON,
                "layout_computed_field": JSON,
                "layout_related_field": JSON,
                "layout_related_field_multiple": JSON,
                "id": 3,
            },
            {
                "layout_field": HTMLString,
                "layout_integer_field": HTMLString,
                "integer_field": HTMLString,
                "decimal_field": HTMLString,
                "layout_char_field": HTMLString,
                "char_field": HTMLString,
                "date_time_field": HTMLString,
                "date_field": HTMLString,
                "time_field": HTMLString,
                "layout_rich_edit_field": HTMLString,
                "layout_computed_field": HTMLString,
                "layout_related_field": HTMLString,
                "layout_related_field_multiple": HTMLString,
                "id": 4,
            },
            {
                "layout_field": YAMLString,
                "layout_integer_field": YAMLString,
                "integer_field": YAMLString,
                "decimal_field": YAMLString,
                "layout_char_field": YAMLString,
                "char_field": YAMLString,
                "date_time_field": YAMLString,
                "date_field": YAMLString,
                "time_field": YAMLString,
                "layout_rich_edit_field": YAMLString,
                "layout_computed_field": YAMLString,
                "layout_related_field": YAMLString,
                "layout_related_field_multiple": YAMLString,
                "id": 5,
            },
            {
                "layout_field": RelatedObj,
                "layout_integer_field": RelatedObj,
                "integer_field": RelatedObj,
                "decimal_field": RelatedObj,
                "layout_char_field": RelatedObj,
                "char_field": RelatedObj,
                "date_time_field": RelatedObj,
                "date_field": RelatedObj,
                "time_field": RelatedObj,
                "layout_rich_edit_field": RelatedObj,
                "layout_computed_field": RelatedObj,
                "layout_related_field": RelatedObj,
                "layout_related_field_multiple": RelatedObj,
                "id": 6,
            },
            {
                "layout_field": RelatedObjIncorrect,
                "layout_integer_field": RelatedObjIncorrect,
                "integer_field": RelatedObjIncorrect,
                "decimal_field": RelatedObjIncorrect,
                "layout_char_field": RelatedObjIncorrect,
                "char_field": RelatedObjIncorrect,
                "date_time_field": RelatedObjIncorrect,
                "date_field": RelatedObjIncorrect,
                "time_field": RelatedObjIncorrect,
                "layout_rich_edit_field": RelatedObjIncorrect,
                "layout_computed_field": RelatedObjIncorrect,
                "layout_related_field": RelatedObjIncorrect,
                "layout_related_field_multiple": RelatedObjIncorrect,
                "id": 7,
            },
            {
                "layout_field": RelatedIncorrect,
                "layout_integer_field": RelatedIncorrect,
                "integer_field": RelatedIncorrect,
                "decimal_field": RelatedIncorrect,
                "layout_char_field": RelatedIncorrect,
                "char_field": RelatedIncorrect,
                "date_time_field": RelatedIncorrect,
                "date_field": RelatedIncorrect,
                "time_field": RelatedIncorrect,
                "layout_rich_edit_field": RelatedIncorrect,
                "layout_computed_field": RelatedIncorrect,
                "layout_related_field": RelatedIncorrect,
                "layout_related_field_multiple": RelatedIncorrect,
                "id": 8,
            },
            {
                "layout_field": RelatedArrayObj,
                "layout_integer_field": RelatedArrayObj,
                "integer_field": RelatedArrayObj,
                "decimal_field": RelatedArrayObj,
                "layout_char_field": RelatedArrayObj,
                "char_field": RelatedArrayObj,
                "date_time_field": RelatedArrayObj,
                "date_field": RelatedArrayObj,
                "time_field": RelatedArrayObj,
                "layout_rich_edit_field": RelatedArrayObj,
                "layout_computed_field": RelatedArrayObj,
                "layout_related_field": RelatedArrayObj,
                "layout_related_field_multiple": RelatedArrayObj,
                "id": 9,
            },
            // {
            //     "id": 2,
            //     "date_created": "2025-03-18T10:15:22.123456+03:00",
            //     "date_updated": "2025-04-02T09:45:11.987654+03:00",
            //     // Все поля из OPTIONS4.js
            //     "layout_computed_field": "Объект 2 (ID: 67890)",
            //     "layout_field": "550e8400-e29b-41d4-a716-446655440002",
            //     "layout_char_field": "test_object_2",
            //     "layout_integer_field": 50,
            //     "layout_rich_edit_field": {
            //         "id": "550e8400-e29b-41d4-a716-446655440003",
            //         "version": "1.1.0"
            //     },
            //     "layout_related_field": {
            //         "id": 2,
            //         "name": "Родитель 2",
            //         "description": "Описание второго родительского объекта"
            //     },
            //     "layout_choice_field": "inactive",
            //     "layout_inline_layout": [
            //         {
            //             "id": 201,
            //             "name": "Деталь A",
            //             "value": "Значение A",
            //             "created_at": "2025-03-19T11:30:00.000000+03:00"
            //         }
            //     ],
            //     "float_field": 456.78,
            //     "boolean_field": false
            // },
            // {
            //     "id": 3,
            //     "date_created": "2025-03-19T08:45:33.654321+03:00",
            //     "date_updated": "2025-04-01T16:20:45.123456+03:00",
            //     // Все поля из OPTIONS4.js
            //     "layout_computed_field": "Объект 3 (ID: 24680)",
            //     "layout_field": "550e8400-e29b-41d4-a716-446655440004",
            //     "layout_char_field": "test_object_3",
            //     "layout_integer_field": 25,
            //     "layout_rich_edit_field": {
            //         "id": "550e8400-e29b-41d4-a716-446655440005",
            //         "version": "2.0.0"
            //     },
            //     "layout_related_field": null, // Пример с null для необязательного поля
            //     "layout_choice_field": "deleted",
            //     "layout_inline_layout": [], // Пустой массив для встроенного объекта
            //     "float_field": 0.01,
            //     "boolean_field": true
            // },
            // {
            //     "id": 4,
            //     "date_created": "2025-03-20T14:22:11.112233+03:00",
            //     "date_updated": "2025-03-31T10:10:10.101010+03:00",
            //     // Все поля из OPTIONS4.js
            //     "layout_computed_field": "Объект 4 (ID: 13579)",
            //     "layout_field": "550e8400-e29b-41d4-a716-446655440006",
            //     "layout_char_field": "test_object_4",
            //     "layout_integer_field": 100,
            //     "layout_rich_edit_field": {
            //         "id": "550e8400-e29b-41d4-a716-446655440007",
            //         "version": "1.0.0"
            //     },
            //     "layout_related_field": {
            //         "id": 1,
            //         "name": "Родитель 1",
            //         "description": "Описание родительского объекта"
            //     },
            //     "layout_choice_field": "active",
            //     "layout_inline_layout": [
            //         {
            //             "id": 401,
            //             "name": "Деталь X",
            //             "value": "Значение X",
            //             "created_at": "2025-03-15T09:00:00.000000+03:00"
            //         },
            //         {
            //             "id": 402,
            //             "name": "Деталь Y",
            //             "value": "Значение Y",
            //             "created_at": "2025-03-16T10:20:00.000000+03:00"
            //         },
            //         {
            //             "id": 403,
            //             "name": "Деталь Z",
            //             "value": "Значение Z",
            //             "created_at": "2025-03-17T11:40:00.000000+03:00"
            //         }
            //     ],
            //     "float_field": 789.01,
            //     "boolean_field": false
            // }
        ]
    };
})();