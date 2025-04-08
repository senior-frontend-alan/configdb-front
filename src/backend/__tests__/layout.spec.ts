import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  layoutColumns,
  getPythonDefaultValue,
  FieldClassRepresentation,
  type LayoutField,
  type LayoutChoiceField,
  type LayoutRelatedField,
  type ViewSetInlineLayout,
} from '../layout';
import { AuditTransactionMeta } from './AxiosMockBe';
import { createNGCore } from '../../index';
import { createApp } from 'vue';


describe('Backend Layout', () => {
  it('layoutColumns', async () => {
    const columns1 = layoutColumns(AuditTransactionMeta.layout, {});
    expect(columns1.map(x => x.name)).toStrictEqual(
      ['user', 'transaction_num', 'description', 'state', 'scope', 'application',
        'date_opened', 'date_closed']);

    const columns2 = layoutColumns(AuditTransactionMeta.layout, {},
      ['transaction_num', 'not_existing_field', 'user', 'date_opened']);
    expect(columns2.map(x => x.name)).toStrictEqual(['transaction_num', 'user', 'date_opened']);

    const layout = {...AuditTransactionMeta.layout};
    layout.display_list = [];
    const columns3 = layoutColumns(layout, {},
      ['not_existing_field']);
    expect(columns3.map(x => x.name)).toStrictEqual(
      ['user', 'transaction_num', 'state', 'scope', 'application', 'description',
        'date_opened', 'date_updated', 'date_closed']);
  })
});


describe('Python Defaults', () => {
  it('getPythonDefaultValue', async () => {
    vi.setSystemTime(new Date(2025, 3, 3, 12, 5, 5));

    const now = getPythonDefaultValue('<now>');
    expect(now).toBe(new Date(2025, 3, 3, 12, 5, 5).toISOString());

    const today = getPythonDefaultValue('<date.today>');
    expect(today).toBe(new Date(2025, 3, 3, 0, 0, 0).toISOString());

    const tomorrow = getPythonDefaultValue('<date_tomorrow>');
    expect(tomorrow).toBe(new Date(2025, 3, 4, 0, 0, 0).toISOString());
  });
});


const LayoutFields: {[key: string]: LayoutField | LayoutChoiceField | LayoutRelatedField | ViewSetInlineLayout} = {
  Computedfield: {
    element_id: 'Computedfield',
    class_name: 'LayoutComputedField',
    field_class: 'ComputedField',
    js_item_repr: 'return jsi.core.beatifyUnits(row.duration, ["us", "ms", "s"])',
    name: 'comp_field',
    label: 'Computed Field',
  },

  Computedfield2: {
    element_id: 'Computedfield',
    class_name: 'LayoutComputedField',
    field_class: 'ComputedField',
    js_item_repr: 'return `${row.duration} ${fields.units.asString(row)}`;',
    name: 'comp_field',
    label: 'Computed Field',
  },


  IntegerField: {
    element_id: 'IntegerField',
    class_name: "LayoutField",
    name: "duration",
    label: "Integer Value",
    field_class: "IntegerField",
    js_item_repr: 'return jsi.core.beatifyUnits(row, ["us", "ms", "s"])',
    default: 10
  },

  DecimalField: {
    element_id: 'DecimalField',
    class_name: "LayoutField",
    name: "floatValue",
    label: "Float Value",
    field_class: "DecimalField",
    default: 10.1234
  },

  CharField: {
    element_id: 'CharField',
    class_name: "LayoutField",
    name: "charValue",
    label: "Char Value",
    field_class: "CharField",
  },

  ChoiceField: {
    element_id: 'ChoiceField',
    class_name: 'LayoutChoiceField',
    name: 'intEnum',
    label: 'Integer Enum',
    field_class: 'ChoiceField',
    choices: [
        { value: 1, display_name: "Option-A" },
        { value: 2, display_name: "Option-B" },
        { value: 3, display_name: "Option-C" }
    ],
    default: 1,
  },

  ChoiceField2: {
    element_id: 'ChoiceField',
    class_name: 'LayoutChoiceField',
    name: 'units',
    label: 'Integer Enum',
    field_class: 'ChoiceField',
    choices: [
        { value: 1, display_name: "us" },
        { value: 2, display_name: "ms" },
        { value: 3, display_name: "s" }
    ],
    default: 1,
  },

  DateTimeField: {
    element_id: 'DateTimeField',
    class_name: 'LayoutField',
    name: 'dateTimeValue',
    label: 'Date Time',
    field_class: 'DateTimeField',
  },

  DateField: {
    element_id: 'DateField',
    class_name: 'LayoutField',
    name: 'dateTimeValue',
    label: 'Date',
    field_class: 'DateField',
  },

  TimeField: {
    element_id: 'TimeField',
    class_name: 'LayoutField',
    name: 'dateTimeValue',
    label: 'Time',
    field_class: 'TimeField',
  },

  PrimaryKeyRelatedLookupField: {
    element_id: 'PrimaryKeyRelatedLookupField',
    class_name: 'LayoutRelatedField',
    name: 'foreignKeyValue',
    label: 'Foreign Key Reference',
    field_class: 'PrimaryKeyRelatedLookupField',
  },

  ManyRelatedField: {
    element_id: 'ManyRelatedField',
    class_name: 'LayoutRelatedField',
    name: 'foreignKeyValues',
    label: 'Foreign Key Reference',
    field_class: 'ManyRelatedField',
    list_view_items: 3,
    multiple: true,
  },

  ListSerializer: {
    element_id: 'ListSerializer',
    class_name: 'ViewSetInlineLayout',
    name: 'inlineObjects',
    label: 'Inline Object List',
    field_class: 'ListSerializer',
    list_view_items: 3,
  },

  Serializer: {
    element_id: 'InlineSerializer',
    class_name: 'ViewSetInlineLayout',
    name: 'inlineObject',
    label: 'Inline Object List',
    field_class: 'Serializer',
    max_cardinality: 1,
  },

  WeakRelatedLookupField: {
    element_id: 'WeakRelatedLookupField',
    class_name: 'LayoutField',
    name: 'weakRefValue',
    label: 'Weak Reference',
    field_class: 'WeakRelatedLookupField',
  },

}


describe('Layout Data Representation', () => {
  const ngc = createNGCore();
  const app = createApp({});
  app.use(ngc);

  it('Computedfield', async () => {
    const field = new FieldClassRepresentation.ComputedField(LayoutFields.Computedfield, ngc.jsi, {}, {});

    expect(field.asString({id: 0, duration: 10000 })).toBe("10.00ms");
    expect(field.asValue({id: 0, duration: 10000 })).toBe("10.00ms");

    expect(field.asString({id: 0, duration: 1000000000 })).toBe("1000.00s");

    expect(field.asString({id: 0, duration: null })).toBeNull();
  });


  it('Computedfield (access to other field repr)', async () => {
    const fields: any = {};
    fields.units = new FieldClassRepresentation.ChoiceField(LayoutFields.ChoiceField2, ngc.jsi, fields, {});
    const field = new FieldClassRepresentation.ComputedField(LayoutFields.Computedfield2, ngc.jsi, fields, {});

    expect(field.asString({id: 0, duration: 10, units: 1 })).toBe("10 us");
    expect(field.asString({id: 0, duration: 10, units: 2 })).toBe("10 ms");
  });

  it('IntegerField (with js repr)', async () => {
    const field = new FieldClassRepresentation.IntegerField(LayoutFields.IntegerField, ngc.jsi, {}, {});

    expect(field.asString({id: 0, duration: 10000.001 })).toBe("10.00ms");
    expect(field.asValue({id: 0, duration: 10000.001 })).toBe(10000);
    expect(field.getDefault()).toBe(10);
  });

  it('DecimalField', async () => {
    const field = new FieldClassRepresentation.DecimalField(LayoutFields.DecimalField, ngc.jsi, {}, {roundDecimals: 3});

    expect(field.asValue({id: 0, floatValue: 100.12345 })).toBe(100.12345);
    expect(field.asString({id: 0, floatValue: 100.12345 })).toBe("100.123");
    expect(field.getDefault()).toBe(10.1234);
  });

  it('CharField (single)', async () => {
    const field = new FieldClassRepresentation.CharField(LayoutFields.CharField, ngc.jsi, {}, {});
    expect(field.asValue({id: 0, charValue: "abcd" })).toBe("abcd");
    expect(field.asString({id: 0, charValue: "abcd" })).toBe("abcd");

    expect(field.asValue({id: 0, charValue: 10 })).toBe("10");
    expect(field.asString({id: 0, charValue: 10 })).toBe("10");

    expect(field.getDefault()).toBe(undefined);
    expect(() => field.asValue({id: 0, charValue: ["abcd", "10"] }))
      .toThrowError('Field "CharField" error: got Array value for single-value field');
  });


  it('CharField (multiple)', async () => {
    const field = new FieldClassRepresentation.CharField({
      ...LayoutFields.CharField,
      multiple: true,
      list_view_items: 3,
    }, ngc.jsi, {}, {});

    expect(() => field.asValue({id: 0, charValue: "abcd" }))
      .toThrowError('Field "CharField" error: got non-Array value for multiple-value field');

    expect(field.asValue({id: 0, charValue: ["abcd", 10, "xyz", "20"] }))
      .toStrictEqual(["abcd", "10", "xyz", "20"]);
    expect(field.asString({id: 0, charValue: ["abcd", 10, "xyz", "20"] }))
      .toStrictEqual({
        total: 4,
        values: ["abcd", "10", "xyz",],
      });

    expect(field.asString({id: 0, charValue: null})).toBeNull();
  });

  it('ChoiceField (single)', async () => {
    const field = new FieldClassRepresentation.ChoiceField(LayoutFields.ChoiceField, ngc.jsi, {}, {});
    expect(field.asValue({id: 0, intEnum: 2 })).toBe(2);
    expect(field.asString({id: 0, intEnum: 2 })).toBe("Option-B");

    expect(field.asValue({id: 0, intEnum: "2" })).toBe("2");
    expect(field.asString({id: 0, intEnum: "2" })).toBe("Option-B");

    expect(field.asValue({id: 0, intEnum: 10 })).toBe(10);
    expect(field.asString({id: 0, intEnum: 10 })).toBe("<value: 10>");

    expect(field.getDefault()).toBe(1);
  });

  it('ChoiceField (multiple)', async () => {
    const _default = [1];
    const field = new FieldClassRepresentation.ChoiceField({
      ...LayoutFields.ChoiceField,
      default: _default,
      multiple: true,
      list_view_items: 3,
    }, ngc.jsi, {}, {});

    expect(field.asValue({id: 0, intEnum: [2, 10, 3, 2] })).toStrictEqual([2, 10, 3, 2]);
    expect(field.asString({id: 0, intEnum: [2, 10, 3, 2] })).toStrictEqual({
      total: 4,
      values: [
        "Option-B",
        "<value: 10>",
        "Option-C",
      ],
    });

    expect(field.asString({id: 0, intEnum: null})).toBeNull();

    const newValue = field.getDefault();
    expect(newValue).toStrictEqual([1]);
    if (newValue && newValue instanceof Array) {
      newValue.push([5]);
      expect(newValue).not.toStrictEqual(_default);
      expect(_default).toStrictEqual([1]);
    }
  });

  it('DateTimeField', async () => {
    expect(new Date().getTimezoneOffset()).toBe(0);

    const widget: any = {};
    const field = new FieldClassRepresentation.DateTimeField({...LayoutFields.DateTimeField, widget},
      ngc.jsi, {}, {locale: "en"});
    expect(field.asValue({id: 0, dateTimeValue: "2025-03-03T12:05:05.000Z" })).toBeInstanceOf(Date);
    expect(field.asString({id: 0, dateTimeValue: "2025-03-03T12:05:05.000Z" })).toBe("3/3/2025, 12:05:05 PM");

    expect(field.asValue({id: 0, dateTimeValue: 1741003505000 })).toBeInstanceOf(Date);
    expect(field.asString({id: 0, dateTimeValue: 1741003505000 })).toBe("3/3/2025, 12:05:05 PM");

    widget.display = 'date';
    expect(field.asString({id: 0, dateTimeValue: "2025-03-03T12:05:05.000Z" })).toBe("3/3/2025");
  });

  it('DateField', async () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
    const field = new FieldClassRepresentation.DateField(LayoutFields.DateTimeField, ngc.jsi, {}, {locale: "en"});
    expect(field.asValue({id: 0, dateTimeValue: "2025-03-03T12:05:05.000Z" })).toBeInstanceOf(Date);
    expect(field.asString({id: 0, dateTimeValue: "2025-03-03T12:05:05.000Z" })).toBe("3/3/2025");
  });

  it('TimeField', async () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
    const field = new FieldClassRepresentation.TimeField(LayoutFields.TimeField, ngc.jsi, {}, {locale: "en"});
    expect(field.asValue({id: 0, dateTimeValue: "12:05:05" })).toBeInstanceOf(Date);
    expect(field.asString({id: 0, dateTimeValue: "12:05:05" })).toBe("12:05:05 PM");
    expect(field.asString({id: 0, dateTimeValue: 0 })).toBe("12:00:00 AM");
    expect(field.asString({id: 0, dateTimeValue: 60*1000 })).toBe("12:01:00 AM");
  });


  it('RelatedField (single)', async () => {
    const field = new FieldClassRepresentation.PrimaryKeyRelatedLookupField(LayoutFields.PrimaryKeyRelatedLookupField,
      ngc.jsi, {}, {});
    expect(field.asValue({id: 0, foreignKeyValue: 10})).toBe(10);
    expect(field.asString({id: 0, foreignKeyValue: 10})).toBe("<id: 10>");

    expect(field.asValue({id: 0, foreignKeyValue: {id: 10, name: "Object Name-1"}}))
      .toStrictEqual({
        id: 10,
        name: "Object Name-1",
      });
    expect(field.asString({id: 0, foreignKeyValue: {id: 10, name: "Object Name-1"}})).toBe("Object Name-1");
    expect(field.asString({id: 0, foreignKeyValue: {id: 10}})).toBe("<id: 10>");
  });

  it('RelatedField (multiple)', async () => {
    const data = {
      id: 0,
      foreignKeyValues: [
        {id: 10, name: "Object Name-1"},
        11,
        {id: 23},
        {id: 24, name: "Object Name-4"},
      ],
    };

    const field = new FieldClassRepresentation.ManyRelatedField(LayoutFields.ManyRelatedField, ngc.jsi, {}, {});
    expect(field.asValue(data)).toStrictEqual([
      {id: 10, name: "Object Name-1"},
      11,
      {id: 23},
      {id: 24, name: "Object Name-4"},
    ]);

    expect(field.asString(data)).toStrictEqual({
      total: 4,
      values: [
        "Object Name-1",
        "<id: 11>",
        "<id: 23>",
      ]
    });

    expect(field.asString({id: 0, foreignKeyValues: null})).toBeNull();
  });

  it('InlineObjectField (single)', async () => {
    const data = {
      id: 0,
      inlineObject: {
        id: 10,
        name: "Object Name-1",
        code: "Code-1"
      }
    };

    let field = new FieldClassRepresentation.Serializer(LayoutFields.Serializer, ngc.jsi, {}, {});
    expect(field.asString(data)).toBe('Object Name-1');
    expect(field.asString({id: 0, inlineObject: {id: 10,}})).toBe('<id: 10>');

    field = new FieldClassRepresentation.Serializer(<ViewSetInlineLayout>{
      ...LayoutFields.Serializer,
      item_repr: 'code',
    }, ngc.jsi, {}, {});
    expect(field.asString(data)).toBe('Code-1');
  });


  it('InlineObjectField (multiple)', async () => {
    const data = {
      id: 0,
      inlineObjects: [
        {id: 10, name: "Object Name-1", code: "Code-1"},
        {id: 11, name: "Object Name-2", code: "Code-2"},
        {id: 23, name: "Object Name-3", code: "Code-3"},
        {id: 25, name: "Object Name-4", code: "Code-4"},
      ]
    };

    let field = new FieldClassRepresentation.ListSerializer(LayoutFields.ListSerializer, ngc.jsi, {}, {});
    expect(field.asString(data)).toStrictEqual({
      total: 4,
      values: [
        "Object Name-1",
        "Object Name-2",
        "Object Name-3",
      ]
    });

    field = new FieldClassRepresentation.ListSerializer(<ViewSetInlineLayout>{
      ...LayoutFields.ListSerializer,
      item_repr: 'code',
    }, ngc.jsi, {}, {});
    expect(field.asString(data)).toStrictEqual({
      total: 4,
      values: [
        "Code-1",
        "Code-2",
        "Code-3",
      ]
    });
  });

  it('WeakRelatedLookupField', async () => {
    const field = new FieldClassRepresentation.WeakRelatedLookupField(LayoutFields.WeakRelatedLookupField, ngc.jsi, {}, {});

    expect(field.asString({id: 0, weakRefValue: 10, })).toBe("10");
    expect(field.asString({id: 0, weakRefValue: "abc", })).toBe("abc");

    expect(field.asString({id: 0, weakRefValue: {name: "Object Name", refid: 10}, }))
      .toBe("Object Name");

    expect(field.asString({id: 0, weakRefValue: {error: "Lookup reference error", refid: 10}, }))
      .toStrictEqual({error: "Lookup reference error"});

    expect(field.asString({id: 0, weakRefValue: null, })).toBeNull();
  });

});