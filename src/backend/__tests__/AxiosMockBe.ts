export const AxiosErrors = {
  ConnectionAborted: {
    isAxiosError: true,
    message: 'timeout of 5000ms exceeded',
    stack: 'AxiosError: timeout of 5000ms exceeded\n',
    config: {
      method: 'get',
      url: '/api/v1/abcde/',
      headers: {},
    },
    code: 'ECONNABORTED',
    status: null
  },

  InternalError: {
    isAxiosError: true,
    message: 'Request failed with status code 500',
    stack: 'AxiosError: Request failed with status code 500\n',
    config: {
      method: 'get',
      url: '/api/v1/abcde/',
      headers: {},
    },
    code: 'ERR_BAD_RESPONSE',
    status: 500,
    response: {
      data: 'A server error occurred.  Please contact the administrator.',
      status: 500,
      statusText: "Internal Server Error",
      headers: {'content-type': 'text/plain'},
    }
  },

  Unathorised: {
    isAxiosError: true,
    message: 'Request failed with status code 401',
    stack: 'AxiosError: Request failed with status code 401\n',
    config: {
      method: 'get',
      url: '/api/v1/abcde/',
      headers: {},
    },
    code: 'ERR_BAD_RESPONSE',
    status: 401,
    response: {
      data: {detail: 'Authentication credentials were not provided.'},
      status: 401,
      statusText: 'Unauthorized',
      headers: {'content-type': 'application/json'},
    }
  },

  SessionUnathorised: {
    isAxiosError: true,
    message: 'Request failed with status code 401',
    stack: 'AxiosError: Request failed with status code 401\n',
    config: {
      method: 'post',
      url: '/api/v1/abcde/',
      headers: {},
    },
    code: 'ERR_BAD_REQUEST',
    status: 401,
    response: {
      data: {detail: 'Invalid username or password.'},
      status: 401,
      statusText: 'Unauthorized',
      headers: {'content-type': 'application/json'},
    }
  },

  NotFound: {
    isAxiosError: true,
    message: 'Request failed with status code 404',
    stack: 'AxiosError: Request failed with status code 404\n',
    config: {
      method: 'get',
      url: '/api/v1/abcde/',
      headers: {},
    },
    code: 'ERR_BAD_REQUEST',
    status: 404,
    response: {
      data: '<!DOCTYPE html>...</html>',
      status: 404,
      statusText: 'Not Found',
      headers: {'content-type': 'text/html; charset=utf-8'},
    }
  },

  DeleteNotFound: {
    isAxiosError: true,
    message: 'Request failed with status code 404',
    stack: 'AxiosError: Request failed with status code 404\n',
    config: {
      method: 'delete',
      url: '/api/v1/abcde/',
      headers: {}
    },
    code: 'ERR_BAD_REQUEST',
    status: 404,
    response: {
      data: '<!DOCTYPE html>...</html>',
      status: 404,
      statusText: 'Not Found',
      headers: {'content-type': 'text/html; charset=utf-8'},
    }
  },

  PostFieldRequired: {
    isAxiosError: true,
    message: 'Request failed with status code 400',
    stack: 'AxiosError: Request failed with status code 400\n',
    config: {
      method: 'post',
      url: '/api/v1/abcde/',
      headers: {}
    },
    code: 'ERR_BAD_REQUEST',
    status: 400,
    response: {
      data: {
        password: [ "This field is required." ]
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {'content-type': 'application/json'},
    }
  },

  TransactionInvalidTransaction: {
    isAxiosError: true,
    message: 'Request failed with status code 400',
    stack: 'AxiosError: Request failed with status code 400\n',
    config: {
      method: 'post',
      url: '/api/v1/abcde/',
      headers: {}
    },
    code: 'ERR_BAD_REQUEST',
    status: 400,
    response: {
      data:{
        detail: "Specified transaction doesn`t exist or not authorized"
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {'content-type': 'application/json'},
    }
  }
}


export const CatalogResource = [
  {
    "name": "system",
    "verbose_name": "System",
    "description": null,
    "display": true,
    "items": [
      {
        "name": "objectSchemaDomain",
        "verbose_name": "Object schema domains",
        "description": "Domains are used for object schemas isolation.",
        "appl_name": "dashboard",
        "viewname": "objectSchemaDomain",
        "href": "http://localhost:8000/api/v1/objectSchemaDomain/",
        "methods": {
          "copy": true,
          "delete": true,
          "get": true,
          "objectLayout": true,
          "patch": true,
          "post": true,
          "put": true
        },
        "display": true,
        "export": true,
        "discriminators": null,
        "tags": null,
        "model_name": "ObjectSchemaDomain",
        "model_info": {
          "date_updated": "2024-10-03T17:58:18.080286Z",
          "valid_date": "2024-10-03T17:58:27.777817Z",
          "content_type": 25
        }
      },
      {
        "name": "objectSchema",
        "verbose_name": "Object schemas",
        "description": "Object schemas local registry.",
        "appl_name": "dashboard",
        "viewname": "objectSchema",
        "href": "http://localhost:8000/api/v1/objectSchema/",
        "methods": {
          "copy": true,
          "delete": true,
          "get": true,
          "patch": true,
          "post": true,
          "put": true
        },
        "display": true,
        "export": true,
        "discriminators": null,
        "tags": null,
        "model_name": "ObjectSchema",
        "model_info": null
      },
      {
        "name": "contentType",
        "verbose_name": "Content Type",
        "description": "Content types: models, etc.",
        "appl_name": "dashboard",
        "viewname": "contentType",
        "href": "http://localhost:8000/api/v1/contentType/",
        "methods": {
          "count": true,
          "exportData": true,
          "get": true
        },
        "display": false,
        "export": false,
        "discriminators": null,
        "tags": null,
        "model_name": "ContentType",
        "model_info": null
      }
    ],
    "tags": [
      "system"
    ]
  },
  {
    "name": "audit",
    "verbose_name": "Audit transactions",
    "description": null,
    "display": true,
    "items": [
      {
        "name": "auditTransaction",
        "verbose_name": "Transactions",
        "description": "Change management (CM) Transaction is a list of all data changes, which comprise a single configuration unit.",
        "appl_name": "dashboard",
        "viewname": "auditTransaction",
        "href": "http://localhost:8000/api/v1/auditTransaction/",
        "methods": {
          "batch": true,
          "copy": true,
          "count": true,
          "delete": true,
          "export": true,
          "exportData": true,
          "get": true,
          "importData": true,
          "lastTransaction": true,
          "maxUpdated": true,
          "patch": true,
          "post": true,
          "put": true
        },
        "display": true,
        "export": false,
        "discriminators": null,
        "tags": null,
        "model_name": "AuditTransaction",
        "model_info": null
      },
      {
        "name": "auditTransactionLog",
        "verbose_name": "Transaction logs",
        "description": "Audit record of all data changes.",
        "appl_name": "dashboard",
        "viewname": "auditTransactionLog",
        "href": "http://localhost:8000/api/v1/auditTransactionLog/",
        "methods": {
          "count": true,
          "exportData": true,
          "get": true,
          "purge": true
        },
        "display": true,
        "export": false,
        "discriminators": null,
        "tags": null,
        "model_name": "AuditTransactionLog",
        "model_info": null
      }
    ],
    "tags": [
      "audit",
      "security"
    ]
  }
]

export const AuditTransactionResource = [
  {
      "id": 3,
      "user": "admin",
      "transaction_num": "2024-1002/COM/ADM/0003",
      "application": null,
      "description": "Third Tx",
      "state": 3,
      "scope": 1,
      "date_opened": "2024-10-02T12:39:43.319239+03:00",
      "date_updated": "2024-10-02T12:39:43.320451+03:00",
      "date_closed": "2024-10-02T12:39:43.319124+03:00"
  },
  {
      "id": 2,
      "user": "admin",
      "transaction_num": "2024-1002/COM/ADM/0002",
      "application": null,
      "description": "Second Tx",
      "state": 2,
      "scope": 1,
      "date_opened": "2024-10-02T12:39:32.619722+03:00",
      "date_updated": "2024-10-02T12:39:32.621102+03:00",
      "date_closed": "2024-10-02T12:39:32.619604+03:00"
  },
  {
      "id": 1,
      "user": "admin",
      "transaction_num": "2024-1002/COM/ADM/0001",
      "application": null,
      "description": "First Tx",
      "state": 2,
      "scope": 1,
      "date_opened": "2024-10-02T12:39:23.997304+03:00",
      "date_updated": "2024-10-02T12:39:24.001363+03:00",
      "date_closed": null
  },
  {
    "id": 4,
    "user": "admin",
    "transaction_num": "2024-1002/COM/ADM/0005",
    "application": null,
    "description": "Forth Tx",
    "state": 4,
    "scope": 1,
    "date_opened": "2024-10-02T20:23:30.032354+03:00",
    "date_updated": "2024-10-02T20:23:30.034368+03:00",
    "date_closed": null
  },
]

export const AuditTransactionMeta = {
  "name": "Audit Transaction List",
  "description": "",
  "renders": [
    "application/json",
    "text/html"
  ],
  "parses": [
    "application/json",
    "multipart/form-data"
  ],
  "layout": {
    "class_name": "ViewSetLayout",
    "element_id": "audittransaction",
    "name": "audittransaction",
    "elements": [
      {
        "class_name": "LayoutField",
        "element_id": "audittransaction/user",
        "name": "user",
        "label": "User",
        "field_class": "StringRelatedField",
        "read_only": true,
        "input_type": "text",
        "filterable": true
      },
      {
        "class_name": "LayoutCharField",
        "element_id": "audittransaction/transaction_num",
        "name": "transaction_num",
        "label": "Transaction number",
        "help_text": "Unique composite number of the transaction.",
        "field_class": "CharField",
        "allow_null": true,
        "read_only": true,
        "input_type": "text",
        "max_length": 0,
        "multiline": true
      },
      {
        "class_name": "LayoutChoiceField",
        "element_id": "audittransaction/state",
        "name": "state",
        "label": "State",
        "field_class": "ChoiceField",
        "default": 2,
        "input_type": "text",
        "filterable": true,
        "choices": [
          {
            "value": 1,
            "display_name": "Planing"
          },
          {
            "value": 2,
            "display_name": "Open"
          },
          {
            "value": 3,
            "display_name": "Closed"
          },
          {
            "value": 4,
            "display_name": "Published"
          }
        ]
      },
      {
        "class_name": "LayoutChoiceField",
        "element_id": "audittransaction/scope",
        "name": "scope",
        "label": "Scope",
        "field_class": "ChoiceField",
        "default": 1,
        "input_type": "text",
        "choices": [
          {
            "value": 1,
            "display_name": "Owner"
          },
          {
            "value": 2,
            "display_name": "Group"
          },
          {
            "value": 3,
            "display_name": "Global"
          }
        ]
      },
      {
        "class_name": "LayoutRelatedField",
        "element_id": "audittransaction/application",
        "name": "application",
        "label": "Application",
        "field_class": "PrimaryKeyRelatedLookupField",
        "allow_null": true,
        "input_type": "text",
        "filterable": true,
        "list_url": "/api/v1/application/",
        "view_name": "application",
        "appl_name": "dashboard",
        "lookup": true
      },
      {
        "class_name": "LayoutCharField",
        "element_id": "audittransaction/description",
        "name": "description",
        "label": "Description",
        "field_class": "CharField",
        "required": true,
        "input_type": "text",
        "filterable": true,
        "max_length": 1024,
        "multiline": true
      },
      {
        "class_name": "LayoutSection",
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
      }
    ],
    "view_name": "audittransaction",
    "display_list": [
      "user",
      "transaction_num",
      "description",
      "state",
      "scope",
      "application",
      "date_opened",
      "date_closed"
    ],
    "filterable_list": [
      "application",
      "description",
      "state",
      "user"
    ],
    "natural_key": [
      "code"
    ],
    "primary_key": "id",
    "keyset": [
      "code"
    ],
    "item_repr": "transaction_num",
    "set_operations": true,
    "extentions": {
      "DReferenceList": [
        {
          "component": "TransactionHandler",
          "defaultActions": ["export", "delete"],
          "toolButtons": [
            {
              "icon": "check_circle",
              "tooltip": "Validate transaction",
              "actionParams": "verify",
              "disableIf": "return !ctx.selected;"
            }
          ]
        }
      ]
    }
  },
  "transaction_required": false,
  "permitted_actions": {
    "post": false,
    // "delete": false,
    "put": true,
    "get": true,
    "patch": true,
    "batch": {
      "detail": false,
      "methods": [
        "post"
      ]
    },
    "count": {
      "detail": false,
      "methods": [
        "get"
      ]
    },
    "export": {
      "detail": true,
      "methods": [
        "get"
      ]
    },
    "exportData": {
      "detail": false,
      "methods": [
        "get",
        "post"
      ]
    },
    "importData": {
      "detail": false,
      "methods": [
        "post"
      ]
    },
    "lastTransaction": {
      "detail": true,
      "methods": [
        "get"
      ]
    },
    "maxUpdated": {
      "detail": false,
      "methods": [
        "get"
      ]
    },
    "copy": true
  },
  "filterset_fields": [
    {
      "filter_name": "application",
      "lookup_expr": "exact",
      "label": "Application",
      "class_name": "ModelChoiceFilter",
      "field_name": "application"
    },
    {
      "filter_name": "user",
      "lookup_expr": "exact",
      "label": "User",
      "class_name": "ModelChoiceFilter",
      "field_name": "user"
    },
    {
      "filter_name": "user__username",
      "lookup_expr": "exact",
      "label": "User username",
      "class_name": "CharFilter",
      "field_name": "user"
    },
    {
      "filter_name": "state",
      "lookup_expr": "exact",
      "label": "State",
      "class_name": "ChoiceFilter",
      "field_name": "state"
    },
    {
      "filter_name": "description",
      "lookup_expr": "exact",
      "label": "Description",
      "class_name": "CharFilter",
      "field_name": "description"
    }
  ],
  "search_fields": [
    "user__username",
    "description",
    "state"
  ],
  "model_name": "dashboard.audittransaction",
  "verbose_name": "Transaction",
  "verbose_name_plural": "Transactions",
  "help": "AuditTransaction(id, user, application, transaction_num, description, state, scope, date_opened, date_updated, date_closed)"
}

export const SessionResource = {
  "id": "rt9x4wzuc4xoa6yb4krqj4591us4na3x",
  "url": "http://localhost:8000/api/v1/session/rt9x4wzuc4xoa6yb4krqj4591us4na3x/",
  "session_key": "rt9x4wzuc4xoa6yb4krqj4591us4na3x",
  "expiry_date": "2024-08-26 08:48:00.624605+00:00",
  "username": "admin",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@admin.ru",
    "groups": [],
    "first_name": "",
    "last_name": "",
    "is_staff": true,
    "is_superuser": true,
    "is_active": true,
    "last_login": "2024-08-12T11:47:56.856071+03:00",
    "date_joined": "2024-07-23T17:43:12.042863+03:00"
  },
  "last_login_backend": null,
  "providers": [],
  "groups": [],
  "appconfig": {}
}

const Headers = {'X-CSRFToken': 'POLWpTlQRYuunrsX3sqde5C3DFOQzu5nbC08928yJNyE2Ukjbt094EekHtQs2mDL'};

export interface MockOptions {
  authorized?: boolean,
  txId?: number,
  backends?: string[],
  disableLocalAuth?: boolean,
};

const ResponseHandlers = {
  NoData: (uri, data?) => ({
    headers: Headers,
    status: 204,
  }),
  UpdateWithData: (uri, data?) => ({
    headers: Headers,
    status: 200,
    data: JSON.parse(JSON.stringify(data))
  }),
  CreateWithData: (uri, data?) => ({
    headers: Headers,
    status: 201,
    data: JSON.parse(JSON.stringify(data))
  }),
}

export function mockAxios(axios: any, options?: MockOptions) {
  axios.isAxiosError.mockImplementation(() => true);

  axios.delete.mockClear();
  axios.delete.mockImplementation((uri: string) => {
    const uriMap = {
      '/api/v1/appA/auditTransaction/2/': ResponseHandlers.NoData,
      [`/api/v1/session/${SessionResource.id}/`]: ResponseHandlers.NoData,
      [`/api/v1/session/${SessionResource.id}/auditTransaction/`]: ResponseHandlers.NoData,
    };

    const fn = uriMap[uri];
    if (!fn) {
      console.log(`DELETE: Unknown URI: ${uri}`)
    }
    return fn(uri);
  });

  axios.patch.mockClear();
  axios.patch.mockImplementation((uri: string, data: any) => {
    const uriMap = {
      '/api/v1/appA/auditTransaction/3/?mode=short': ResponseHandlers.UpdateWithData,
      '/api/v1/appA/auditTransaction/4/?mode=short': ResponseHandlers.UpdateWithData,
    };

    const fn = uriMap[uri];
    if (!fn) {
      console.log(`PATCH: Unknown URI: ${uri}`)
    }
    return fn(uri, data);
  });

  axios.post.mockClear();
  axios.post.mockImplementation((uri: string, data: any) => {
    const uriMap = {
      '/api/v1/session/': (uri, data) => ({
        headers: Headers,
        status: 201,
        data: SessionResource,
      }),
      '/api/v1/appA/auditTransaction/?mode=short': ResponseHandlers.CreateWithData,
      [`/api/v1/session/${SessionResource.id}/logoutSSO/`]: ResponseHandlers.NoData,
      [`/api/v1/session/${SessionResource.id}/auditTransaction/`]: (uri, data) => ({
        headers: Headers,
        status: 200,
        data: AuditTransactionResource.find(x => x.id === data.id),
      }),
    };

    const fn = uriMap[uri];
    if (!fn) {
      console.log(`POST: Unknown URI: ${uri}`)
    }
    return fn(uri, data);
  });

  axios.options.mockClear();
  axios.options.mockImplementation((uri: string) => {
    const uriMap = {
      '/api/v1/appA/auditTransaction/': () => ({
        status: 200,
        data: JSON.parse(JSON.stringify(AuditTransactionMeta))
      }),
    };

    const fn = uriMap[uri];
    if (!fn) {
      console.log(`OPTIONS: Unknown URI: ${uri}`)
    }
    return fn(uri);
  });

  axios.get.mockClear();
  axios.get.mockImplementation((uri: string) => {
    const uriMap = {
      '/api/v1/session/': () => ({
        headers: (options?.disableLocalAuth) ? {allow: 'GET, HEAD, OPTIONS', ...Headers} : Headers,
        status: 200,
        data: (options?.authorized) ? [SessionResource] : [],
      }),
      '/api/v1/session/ssoBackends/': () => ({
        headers: Headers,
        status: 200,
        data: {backends: options?.backends ?? []},
      }),
      [`/api/v1/session/${SessionResource.id}/auditTransaction/`]: () => ({
        headers: Headers,
        status: (options?.authorized) ? ( (options?.txId) ? 200 : 204 ) : 404,
        data: (options?.txId) ? AuditTransactionResource.find(x => x.id === options?.txId) : null,
      }),
      //
      '/api/v1/-catalog/':  () => ({
        status: 200,
        data: JSON.parse(JSON.stringify(CatalogResource))
      }),
      // AppA Begin
      '/api/v1/appA/-catalog/': () => ({
        status: 200,
        data: JSON.parse(JSON.stringify(CatalogResource))
      }),
      '/api/v1/appA/auditTransaction/?id=4&mode=short&limit=1': () => ({
          status: 200,
          data: {
            count: 1,
            next: null,
            previous: null,
            results: JSON.parse(JSON.stringify(AuditTransactionResource.slice(3,4)))
          }
      }),
      '/api/v1/appA/auditTransaction/?id=3&mode=short&limit=1': () => ({
        status: 200,
        data: {
          count: 1,
          next: null,
          previous: null,
          results: JSON.parse(JSON.stringify(AuditTransactionResource.slice(0,1)))
        }
      }),
      '/api/v1/appA/auditTransaction/?mode=short': () => ({
        status: 200,
        data: {
          count: AuditTransactionResource.length,
          next: '/api/v1/appA/auditTransaction/?mode=short&offset=2',
          previous: null,
          results: JSON.parse(JSON.stringify(AuditTransactionResource.slice(0,2)))
        }
      }),
      '/api/v1/appA/auditTransaction/?mode=short&offset=2': () => ({
        status: 200,
        data: {
          count: AuditTransactionResource.length,
          next: null,
          previous: '/api/v1/auditTransaction/?limit=2&mode=short',
          results: JSON.parse(JSON.stringify(AuditTransactionResource.slice(2,4)))
        }
      }),
      '/api/v1/appA/auditTransaction/?mode=short&limit=10': () => ({
        status: 200,
        data: {
          count: AuditTransactionResource.length,
          next: null,
          previous: null,
          results: JSON.parse(JSON.stringify(AuditTransactionResource))
        }
      }),
      '/api/v1/appA/auditTransaction/?id=100&mode=short&limit=1': () => ({
        status: 200,
        data: {
          count: 0,
          next: null,
          previous: null,
          results: []
        }
      }),
    }

    const fn = uriMap[uri];
    if (!fn) {
      console.log(`GET: Unknown URI: ${uri}`)
    }
    return fn();
  });
}
