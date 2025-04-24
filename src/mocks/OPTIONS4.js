export const OPTIONS4 = {
    "layout": {
        "class_name": "ViewSetLayout",
        "element_id": "options4",
        "name": "options4",
        "elements": [
            {
                "class_name": "LayoutField",
                "element_id": "options4/layout_field",
                "name": "layout_field",
                "label": "layout_field",
                "help_text": "LayoutField help_text",
                "field_class": "",
            },
            {
                "class_name": "LayoutIntegerField",
                "element_id": "options4/layout_integer_field",
                "name": "layout_integer_field",
                "label": "layout_integer_field",
                "help_text": "LayoutIntegerField help_text",
                "field_class": "",

                // 4 поля которые есть для любого типа поля
                // "required": false,
                // "allow_null": true,
                // "default": 0,
                // "read_only": false, // при добавлении показываем только те которые false а при редактировании показываем все, но с disabled


                // "input_type": "number",
                // "filterable": true,
                // "sortable": true,
                // "min_value": 0,
                // "max_value": 100
            },
            {
                "class_name": "",
                "element_id": "options4/integer_field",
                "name": "integer_field",
                "label": "integer_field",
                "help_text": "IntegerField help_text",
                "field_class": "IntegerField",
                // "multiple": false, // может придти 
                // "list_view_items": 10,
                // "required": false,
                // "allow_null": true,
                // "default": 0,
                // "read_only": false,
                // "input_type": "number",
                // "filterable": true,
                // "sortable": true,
                // "hidden": false,
                // "minimize": false,

                // "min_value": 0,
                // "max_value": 100
            },
            {
                "class_name": "",
                "element_id": "options4/decimal_field",
                "name": "decimal_field",
                "label": "decimal_field",
                "help_text": "DecimalField help_text",
                "field_class": "DecimalField",
                // "required": false,
                // "allow_null": true,
                // "default": 0,
                // "read_only": false,
                // "input_type": "number",
                // "filterable": true,
                // "sortable": true,
                // "hidden": false,
                // "minimize": false,
                // "multiple": false,
                // "list_view_items": 10,
                // "min_value": 0,
                // "max_value": 100
            },
            {
                "class_name": "LayoutCharField",
                "element_id": "options4/layout_char_field",
                "name": "layout_char_field",
                "label": "layout_char_field",
                "help_text": "LayoutCharField help_text",
                "field_class": "",
                // "required": true,
                // "allow_null": false,
                // "default": "",
                // "read_only": false,
                // "input_type": "text",
                // "pattern": "^[a-zA-Z0-9_-]+$",
                // "filterable": true,
                // "sortable": true,
                // "min_length": 15,
                // "max_length": 255,
                // "multiline": false
            },
            {
                "class_name": "",
                "element_id": "options4/char_field",
                "name": "char_field",
                "label": "char_field",
                "help_text": "CharField help_text",
                "field_class": "CharField",
                // "required": true,
                // "allow_null": false,
                // "default": "",
                // "read_only": false,
                // "input_type": "text",
                // "pattern": "^[a-zA-Z0-9_-]+$",
                // "filterable": true,
                // "sortable": true,
                // "max_length": 255,
                // "multiline": false
            },
            {
                "class_name": "",
                "element_id": "options4/date_time_field",
                "name": "date_time_field",
                "label": "date_time_field",
                "help_text": "DateTimeField help_text",
                "field_class": "DateTimeField",
                // "required": false,
                // "allow_null": true,
                // "default": null,
                // "read_only": false,
                // "input_type": "datetime-local",
                // "filterable": true,
                // "sortable": true,
                // "widget": {
                //     "display": "datetime" // Возможные значения: "date" или "datetime"
                // }
            },
            {
                "class_name": "",
                "element_id": "options4/date_field",
                "name": "date_field",
                "label": "date_field",
                "help_text": "DateField help_text",
                "field_class": "DateField",
                // "required": false,
                // "allow_null": true,
                // "default": null,
                // "read_only": false,
                // "input_type": "datetime-local",
                // "filterable": true,
                // "sortable": true,
                // "widget": {
                //     "display": "datetime" // Возможные значения: "date" или "datetime"
                // }
            },
            {
                "class_name": "",
                "element_id": "options4/time_field",
                "name": "time_field",
                "label": "time_field",
                "help_text": "TimeField help_text",
                "field_class": "TimeField",
                // "required": false,
                // "allow_null": true,
                // "default": null,
                // "read_only": false,
                // "input_type": "datetime-local",
                // "filterable": true,
                // "sortable": true,
                // "widget": {
                //     "display": "datetime" // Возможные значения: "date" или "datetime"
                // }
            },
            {
                "class_name": "LayoutCharField",
                "element_id": "options4/layout_char_field",
                "name": "layout_char_field",
                "label": "LayoutCharField",
                "help_text": "LayoutCharField help_text",
                "field_class": "CharField",
                "required": true,
                "allow_null": false,
                "default": "",
                "read_only": false,
                "input_type": "text",
                "pattern": "^[a-zA-Z0-9_-]+$",
                "filterable": true,
                "sortable": true,
                "max_length": 255,
                "multiline": false
            },
            {
                "class_name": "LayoutRichEditField",
                "element_id": "options4/layout_rich_edit_field",
                "name": "layout_rich_edit_field",
                "label": "LayoutRichEditField",
                "help_text": "LayoutRichEditField help_text",
                "field_class": "UUIDField",
                // "required": true,
                // "allow_null": false,
                // "default": null,
                // "read_only": true,
                // "input_type": "text",
                // "filterable": true,
                // "sortable": true,
                // "lookup": true,
                // "obj_repr": [ // ! Как должно использоваться?
                //     "id",
                //     "version" 
                // ],
                // "edit_mode": "plain", // подсказка что за данные содаржатся (JSON, YAML, HTML, CSS, SQL), посмотреть в RSC 
                // "multiline": true,
                // "max_length": 10000,
                // "widget": {
                //     "syntax_highlight": "json",
                //     "toolbar": true,
                //     "height": "300px"
                // }
            },
            {
                "class_name": "LayoutComputedField",
                "element_id": "options4/layout_computed_field",
                "name": "layout_computed_field",
                "label": "LayoutComputedField",
                "help_text": "LayoutComputedField help_text",
                "field_class": "ComputedField",
                "minimize": false,
                "js_item_repr": "return obj.name + ' (' + obj.id + ')'",
                // "list_view_items": "3",
                // "required": false,
                // "allow_null": true,
                // "read_only": true,
                // "filterable": true,
                // "sortable": true,
                // "multiple": false,
                // "default": null,
                // "input_type": "text",
                // "pattern": null,
                // "hidden": false,
                // "fk_relations": [],
                // "weak_ref": null,
                // "auto_field": false,
                // "js_validators": [],
                // "grid_cols": 12,
                // "widget": {},
                // "show_if": null,
                // "enable_if": null,
                // "discr_keys": [],
                // "dynamic_component": null
            },
            {
                "class_name": "LayoutRelatedField",
                "element_id": "options4/layout_related_field",
                "name": "layout_related_field",
                "label": "LayoutRelatedField",
                "help_text": "LayoutRelatedField help_text",
                "field_class": "PrimaryKeyRelatedLookupField", // 
                "multiple": false, // если field_class = PrimaryKeyRelatedLookupField связь один ко многим 
                // "multiple": true, // если field_class = ManyRelatedField связь многие ко многим
                "list_view_items": 3, // дефолтное значение 5 (остальное скрываем ... {еще число})
                // "required": false,
                // "allow_null": true,
                // "read_only": false,
                // "filterable": true,
                // "sortable": true,
                // "list_url": "/api/v1/parents/",
                // "view_name": "parent-detail",
                // "appl_name": "core",
                // "lookup": true,
                // "choices": [
                //     {
                //         "value": 1,
                //         "display_name": "Родитель 1"
                //     },
                //     {
                //         "value": 2,
                //         "display_name": "Родитель 2"
                //     }
                // ],
                // "item_repr": "name",
                // "obj_repr": ["name", "description"],
                // "auto_select_unique": true


                // related_fk?: FieldSubstitution - связанный внешний ключ
                // substitutions?: (string[] | FieldSubstitution) - подстановки
                // display_list?: string[] - список отображаемых полей
                // item_repr?: string - представление элемента
                // obj_repr?: string[] - представление объекта
                // auto_select_unique?: boolean - автовыбор уникального
                // required?: boolean - обязательное поле
                // allow_null?: boolean - разрешить null
                // default?: (string | number | object | (string | number | object)[]) - значение по умолчанию
                // read_only?: boolean - только для чтения
                // input_type?: string - тип ввода
                // pattern?: string - шаблон
                // filterable?: boolean - возможность фильтрации
                // sortable?: boolean - возможность сортировки
                // hidden?: boolean - скрытое поле
                // fk_relations?: string[] - отношения внешнего ключа
                // weak_ref?: any - слабая ссылка
                // auto_field?: boolean - автоматическое поле
                // js_validators?: string[] - JavaScript валидаторы
                // Из LayoutFieldBase:
                // field_class: string - класс поля
                // label: string - метка
                // minimize?: boolean - минимизировать
                // js_item_repr?: string - JavaScript представление элемента

                // Из LayoutElement:
                // class_name: string - имя класса
                // element_id: string - идентификатор элемента
                // dynamic_component?: string - динамический компонент
                // name: string - имя
                // label?: string - метка (дублируется в LayoutFieldBase)
                // help_text?: string - текст подсказки
                // grid_cols?: number - количество колонок в сетке
                // widget?: Widget - виджет
                // show_if?: FieldSubstitution | string - условие отображения
                // enable_if?: FieldSubstitution | string - условие активации
                // discr_keys?: string[] - ключи дискриминатора
                // Интерфейс Choice используется для поля choices и имеет следующую структуру:
            },
            {
                "class_name": "LayoutRelatedField",
                "element_id": "options4/layout_related_field_multiple",
                "name": "layout_related_field_multiple",
                "label": "LayoutRelatedFieldMultiple",
                "help_text": "LayoutRelatedFieldMultiple help_text",
                "field_class": "PrimaryKeyRelatedLookupField",
                "multiple": true,
                "list_view_items": 3,
            },
            {
                "class_name": "LayoutChoiceField",
                "element_id": "options4/layout_choice_field",
                "name": "layout_choice_field",
                "label": "LayoutChoiceField",
                "help_text": "LayoutChoiceField help_text",
                "field_class": "ChoiceField",
                // "required": true,
                // "allow_null": false,
                // "default": "active",
                // "read_only": false,
                // "filterable": true,
                // "sortable": true,
                "choices": [
                    {
                        "value": "active",
                        "display_name": "Активен"
                    },
                    {
                        "value": "inactive",
                        "display_name": "Неактивен"
                    },
                    {
                        "value": "deleted",
                        "display_name": "Удален"
                    }
                ],
                "multiple": false,
                "list_view_items": 3,
            },
            {
                "class_name": "LayoutSection", // просто обрамление элементов с label
                "element_id": "audittransaction/date_opened",
                "name": "additional-attributes",
                "label": "Additional Attributes",
                "elements": [
                    {
                        "class_name": "LayoutField",
                        "element_id": "audittransaction/date_opened",
                        "name": "date_opened",
                        "label": "Date opened",
                        "field_class": "DateTimeField",
                        "read_only": true,
                        "input_type": "text"
                    },
                    {
                        "class_name": "LayoutField",
                        "element_id": "audittransaction/date_updated",
                        "name": "date_updated",
                        "label": "Date updated",
                        "field_class": "DateTimeField",
                        "read_only": true,
                        "input_type": "text"
                    },
                    {
                        "class_name": "LayoutField",
                        "element_id": "audittransaction/date_closed",
                        "name": "date_closed",
                        "label": "Date closed",
                        "field_class": "DateTimeField",
                        "allow_null": true,
                        "read_only": true,
                        "input_type": "text"
                    }
                ]
            },
            {
                "class_name": "LayoutRow", // в ряд
                "element_id": "audittransaction/layout_row",
                "name": "layout_row",
                "elements": [
                    {
                        "class_name": "LayoutField",
                        "element_id": "audittransaction/date_opened",
                        "name": "date_opened",
                        "label": "Date opened",
                        "field_class": "DateTimeField",
                        "read_only": true,
                        "input_type": "text"
                    },
                    {
                        "class_name": "LayoutField",
                        "element_id": "audittransaction/date_updated",
                        "name": "date_updated",
                        "label": "Date updated",
                        "field_class": "DateTimeField",
                        "read_only": true,
                        "input_type": "text"
                    },
                    {
                        "class_name": "LayoutField",
                        "element_id": "audittransaction/date_closed",
                        "name": "date_closed",
                        "label": "Date closed",
                        "field_class": "DateTimeField",
                        "allow_null": true,
                        "read_only": true,
                        "input_type": "text"
                    }
                ]
            }

            // {
            //     "class_name": "ViewSetInlineLayout",
            //     "element_id": "options4/layout_inline_layout",
            //     "name": "layout_inline_layout",
            //     "label": "LayoutInlineLayout",
            //     "help_text": "LayoutInlineLayout help_text",
            //     "field_class": "InlineField",
            //     "read_only": false,
            //     "allow_null": true,
            //     "allow_empty": true,
            //     "min_cardinality": 0,
            //     "max_cardinality": 10,
            //     "list_view_items": 5,
            //     "js_default_order": ["name", "created_at"],
            //     "batch_create_by": "parent",
            //     "view_name": "details-view",
            //     "display_list": ["name", "value", "created_at"],
            //     "filterable_list": ["name", "value"],
            //     "sortable_list": ["name", "created_at"],
            //     "natural_key": ["name"],
            //     "primary_key": "id",
            //     "keyset": ["id", "name"],
            //     "item_repr": "name",
            //     "elements": [
            //         {
            //             "class_name": "LayoutCharField",
            //             "element_id": "options4/details/name",
            //             "name": "name",
            //             "label": "Название",
            //             "field_class": "CharField",
            //             "required": true,
            //             "allow_null": false,
            //             "default": "",
            //             "read_only": false,
            //             "input_type": "text",
            //             "pattern": "^[a-zA-Z0-9_-]+$",
            //             "filterable": true,
            //             "sortable": true,
            //             "max_length": 255,
            //             "multiline": false
            //         },
            //         {
            //             "class_name": "LayoutCharField",
            //             "element_id": "options4/details/value",
            //             "name": "value",
            //             "label": "Значение",
            //             "field_class": "CharField",
            //             "required": true,
            //             "allow_null": false,
            //             "default": "",
            //             "read_only": false,
            //             "input_type": "text",
            //             "pattern": "^[a-zA-Z0-9_-]+$",
            //             "filterable": true,
            //             "sortable": true,
            //             "max_length": 255,
            //             "multiline": false
            //         }
            //     ]
            // },
        ],
        "display_list": [ // список полей по умолчанию
            "layout_related_field_multiple",
            "layout_related_field",
            "layout_computed_field",
            "layout_rich_edit_field",
            "layout_field",
            "layout_integer_field",
            "integer_field",
            "decimal_field",
            "layout_char_field",
            "char_field",
            "date_time_field",
            "date_field",
            "time_field",
            // "layout_computed_field",
            // "layout_rich_edit_field",
            // "layout_related_field",
            // "layout_choice_field",
            // "layout_inline_layout"
        ],
        "view_name": "options4-view",
        // "natural_key": ["id", "name"],
        // "primary_key": "id",
        // "keyset": ["id", "name"],
        "set_operations": true, // рисуем чекбоксы первым стобцом
        // "display_list_modal": ["name", "state", "priority"]
    }
}
