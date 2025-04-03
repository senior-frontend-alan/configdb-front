import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  layoutColumns,
  getPythonDefaultValue,
  layoutElementGetRepresentation,
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
    const columns1 = layoutColumns(AuditTransactionMeta.layout);
    expect(columns1.map(x => x.name)).toStrictEqual(
      ['user', 'transaction_num', 'description', 'state', 'scope', 'application',
        'date_opened', 'date_closed']);

    const columns2 = layoutColumns(AuditTransactionMeta.layout,
      ['transaction_num', 'not_existing_field', 'user', 'date_opened']);
    expect(columns2.map(x => x.name)).toStrictEqual(['transaction_num', 'user', 'date_opened']);

    const layout = {...AuditTransactionMeta.layout};
    layout.display_list = [];
    const columns3 = layoutColumns(layout,
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

  DecimalField: {
    element_id: 'DecimalField',
    class_name: "LayoutField",
    name: "floatValue",
    label: "Float Value",
    field_class: "DecimalField"
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
    list_view_items: 2,
  },

  ListSerializer: {
    element_id: 'ListSerializer',
    class_name: 'ViewSetInlineLayout',
    name: 'inlineObjects',
    label: 'Inline Object List',
    field_class: 'ListSerializer',
    list_view_items: 2,
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

  it('layoutElementGetRepresentation: Computedfield', async () => {
    let value = layoutElementGetRepresentation(LayoutFields.Computedfield, { duration: 10000, });
    expect(value).toBe("10.00ms");

    value = layoutElementGetRepresentation(LayoutFields.Computedfield, { duration: 1000000000, });
    expect(value).toBe("1000.00s");

    value = layoutElementGetRepresentation(LayoutFields.Computedfield, { duration: null, });
    expect(value).toBeNull();
  });

  it('layoutElementGetRepresentation: DecimalField', async () => {
    ngc.appSettings.value.roundDecimals = 3;
    let value = layoutElementGetRepresentation(LayoutFields.DecimalField, { floatValue: 100.12345, });
    expect(value).toBe("100.123");

    ngc.appSettings.value.roundDecimals = 2;
    value = layoutElementGetRepresentation(LayoutFields.DecimalField, { floatValue: 100.12345, });
    expect(value).toBe("100.12");
  });

  it('layoutElementGetRepresentation: ChoiceField', async () => {
    let value = layoutElementGetRepresentation(LayoutFields.ChoiceField, { intEnum: 2, });
    expect(value).toBe("Option-B");

    value = layoutElementGetRepresentation(LayoutFields.ChoiceField, { intEnum: 10, });
    expect(value).toBe(10);
  });

  it('layoutElementGetRepresentation: Date/Time/DateTime(Field)', async () => {
    const data = { dateTimeValue: "2025-03-03T12:05:05.000Z", };
    let value = layoutElementGetRepresentation(LayoutFields.DateTimeField, data);
    expect(value).toBe(new Date(data.dateTimeValue).toLocaleString(ngc.locale.value));

    value = layoutElementGetRepresentation({
        ...LayoutFields.DateTimeField,
        widget: {display: 'date'}
      },
      data);
    expect(value).toBe(new Date(data.dateTimeValue).toLocaleDateString(ngc.locale.value));

    value = layoutElementGetRepresentation(LayoutFields.DateField, data);
    expect(value).toBe(new Date(data.dateTimeValue).toLocaleDateString(ngc.locale.value));

    value = layoutElementGetRepresentation(LayoutFields.TimeField, data);
    expect(value).toBe(new Date(data.dateTimeValue).toLocaleTimeString(ngc.locale.value));
  });

  it('layoutElementGetRepresentation: PrimaryKeyRelatedLookupField', async () => {
    let value = layoutElementGetRepresentation(LayoutFields.PrimaryKeyRelatedLookupField, { foreignKeyValue: 10, });
    expect(value).toBe(10);

    value = layoutElementGetRepresentation(LayoutFields.PrimaryKeyRelatedLookupField, { foreignKeyValue: {id: 10, name: "Object Name"}, });
    expect(value).toBe("Object Name");

    value = layoutElementGetRepresentation(LayoutFields.PrimaryKeyRelatedLookupField, { foreignKeyValue: null, });
    expect(value).toBeNull();
  });

  it('layoutElementGetRepresentation: ManyRelatedField', async () => {
    let value = layoutElementGetRepresentation(LayoutFields.ManyRelatedField, { foreignKeyValues: [10, 11, 23], });
    expect(value).toStrictEqual([10, 11, 23]);

    value = layoutElementGetRepresentation(LayoutFields.ManyRelatedField, { foreignKeyValues: [10, 11, 23, 24], });
    expect(value).toStrictEqual([10, 11, "2 more..."]);

    value = layoutElementGetRepresentation(LayoutFields.ManyRelatedField,
      {
        foreignKeyValues: [
          {id: 10, name: "Object Name-1"},
          {id: 11, name: "Object Name-2"},
          {id: 23, name: "Object Name-3"},
        ],
      }
    );
    expect(value).toStrictEqual(["Object Name-1", "Object Name-2", "Object Name-3"]);

    value = layoutElementGetRepresentation(LayoutFields.ManyRelatedField,
      {
        foreignKeyValues: [
          {id: 10, name: "Object Name-1"},
          {id: 11, name: "Object Name-2"},
          {id: 23, name: "Object Name-3"},
          {id: 24, name: "Object Name-4"},
        ],
      }
    );
    expect(value).toStrictEqual(["Object Name-1", "Object Name-2", "2 more..."]);

    value = layoutElementGetRepresentation(LayoutFields.ManyRelatedField, { foreignKeyValues: null, });
    expect(value).toBeNull();
  });


  it('layoutElementGetRepresentation: ListSerializer', async () => {
    let value = layoutElementGetRepresentation(LayoutFields.ListSerializer,
      {
        inlineObjects: [
          {id: 10, name: "Object Name-1", code: "Code-1"},
          {id: 11, name: "Object Name-2", code: "Code-2"},
          {id: 23, name: "Object Name-3", code: "Code-3"},
        ],
      }
    );
    expect(value).toStrictEqual(["Object Name-1", "Object Name-2", "Object Name-3"]);

    value = layoutElementGetRepresentation(LayoutFields.ListSerializer,
      {
        inlineObjects: [
          {id: 10, name: "Object Name-1", code: "Code-1"},
          {id: 11, name: "Object Name-2", code: "Code-2"},
          {id: 23, name: "Object Name-3", code: "Code-3"},
          {id: 24, name: "Object Name-4", code: "Code-4"},
        ],
      }
    );
    expect(value).toStrictEqual(["Object Name-1", "Object Name-2", "2 more..."]);

    value = layoutElementGetRepresentation({...LayoutFields.ListSerializer, item_repr: 'code' },
      {
        inlineObjects: [
          {id: 10, name: "Object Name-1", code: "Code-1"},
          {id: 11, name: "Object Name-2", code: "Code-2"},
          {id: 23, name: "Object Name-3", code: "Code-3"},
        ],
      }
    );
    expect(value).toStrictEqual(["Code-1", "Code-2", "Code-3"]);

    value = layoutElementGetRepresentation({...LayoutFields.ListSerializer, js_item_repr: 'return row.code' },
      {
        inlineObjects: [
          {id: 10, name: "Object Name-1", code: "Code-1"},
          {id: 11, name: "Object Name-2", code: "Code-2"},
          {id: 23, name: "Object Name-3", code: "Code-3"},
        ],
      }
    );
    expect(value).toStrictEqual(["Code-1", "Code-2", "Code-3"]);

    value = layoutElementGetRepresentation(LayoutFields.ListSerializer, { inlineObjects: null, });
    expect(value).toBeNull();
  });


  it('layoutElementGetRepresentation: WeakRelatedLookupField', async () => {
    let value = layoutElementGetRepresentation(LayoutFields.WeakRelatedLookupField, { weakRefValue: 10, });
    expect(value).toBe(10);

    value = layoutElementGetRepresentation(LayoutFields.WeakRelatedLookupField, { weakRefValue: {name: "Object Name", refid: 10}, });
    expect(value).toBe("Object Name");

    value = layoutElementGetRepresentation(LayoutFields.WeakRelatedLookupField, { weakRefValue: {error: "Lookup reference error", refid: 10}, });
    expect(value).toStrictEqual({error_message: "Lookup reference error"});

    value = layoutElementGetRepresentation(LayoutFields.WeakRelatedLookupField, { weakRefValue: null, });
    expect(value).toBeNull();
  });
});