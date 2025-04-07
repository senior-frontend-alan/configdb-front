// import { createStore } from 'vuex';
// import { createPinia } from 'pinia';
// import { createI18n } from 'vue-i18n';
// import { Cookies } from 'quasar';
// import { ComputedRef, watch, Ref, ref, computed, inject } from 'vue';

// import components from './components';
// import directives from './directives';
// import plugins from './plugins.js';
// import enMessages from './locales/en.js';
// import ruMessages from './locales/ru.js';

// import { type Settings } from './stores/Settings';
// import { type CatalogOptions } from './stores/Catalog';

// import storeModules from './store/index.js'

// import { truncate, mergeDeep, isObject } from './utils/utils.js';

// import __META__  from './package.json';

// import {
//   type AppSettings,
//   type SettingsDescriptorFunction,
//   useAppSettingsStore,
// } from './settings';

// import {
//   type MainMenuDescriptorFunction,
//   type AppMenuDescriptorFunction,
//   type MenuItemPartial,
//   type MainMenu,
//   defaultMenuDescriptor,
//   DEFAULT_APPS_SECTION
// } from './menu.ts';

type CatalogIndex = {[catalogId: string]: ComputedRef<CatalogOptions> | CatalogOptions};

export const EXTENTION_DEFAULT_TARGET = '$default';

export type ExtentionCondFunction = (ctx: any) => boolean;

export interface ExtentionToolButtonDesc {
  icon?: string,
  label?: ComputedRef<string> | string,
  tooltip?: ComputedRef<string> | string,
  params?: any,
  action?: string,
  actionParams: any,
  disableIf?: string | ExtentionCondFunction,
  showIf?: string | ExtentionCondFunction,
  dropDownList?: ExtentionToolButtonDesc[],
}

export interface ExtentionToolButton extends ExtentionToolButtonDesc {
  disableIf?: ExtentionCondFunction,
  showIf?: ExtentionCondFunction,
  dropDownList?: ExtentionToolButton[],
}

export interface ExtentionComponentDesc {
  instanceId?: string, // equal to .component if not defined
  component: string,
  target?: string, // Slot Target
  params?: any,
  toolButtons?: ExtentionToolButtonDesc[],
  transactionRequired?: boolean,
  defaultActions: string[], // binding to default actions: put:before, put:after, etc.
}

export interface ExtentionComponent extends ExtentionComponentDesc {
  instanceId: string,
  toolButtons?: ExtentionToolButton[],
}

export interface ExtentionComponentInterface {
  onDefaultAction: (instanceId: string, action: string, ...params: any) => boolean,
  onAction: (instanceId: string, action?: string, ...params: any) => void,
  disabled: ComputedRef<boolean>,
}

export interface FormExtentionsIndex {
  [classname: string]: {  // Example: DReferenceList, DCatalog, etc.
    [instanceId: string]: ExtentionComponentDesc[],  // Example: <catalogId>:<view>
  }
}

export interface AppOptions {
  config?: any,
  messages?: any,  // apllication i18n messages
  routes?: any,  // application routes
  menuDesc?: AppMenuDescriptorFunction,  // application injections into main menu
  settingsDesc?: SettingsDescriptorFunction<Settings>,
  catalogs?: CatalogIndex,
  extentionsDesc?: (options: AppOptions) => FormExtentionsIndex,
  // Extra interface used in dynamic layout representation functions `js_item_repr`
  jsInterface?: {[fn: string]: Function},
}


export interface NGCoreOptions {
  router?: any,
  config?: Object,
  messages?: any,
  apps?: {[appName: string]: AppOptions},
  menuDesc?: MainMenuDescriptorFunction,
  catalogs: CatalogIndex,
  // Extra interface used in dynamic layout representation functions `js_item_repr`
  jsInterface?: {[fn: string]: Function},
}

export interface FormExtentions {
  extentions: {[instanceId: string]: ExtentionComponent},
  actionsIndex: {[action: string]: ExtentionComponent[]},
  targetsIndex: {[target: string]: ExtentionComponent[]},
}

export function prepareExtentions(extentions: ExtentionComponentDesc[]): FormExtentions {
  const exts: FormExtentions = {
    extentions: {},
    actionsIndex: {},
    targetsIndex: {},
  }

  function prepareButton_(tb: ExtentionToolButtonDesc): ExtentionToolButtonDesc {
    if (tb.disableIf && typeof tb.disableIf === 'string') {
      tb.disableIf = <ExtentionCondFunction>new Function("ctx", tb.disableIf);
    }
    if (tb.showIf && typeof tb.showIf === 'string') {
      tb.showIf = <ExtentionCondFunction>new Function("ctx", tb.showIf);
    }
    return tb;
  }

  extentions.forEach(x => {
    x.instanceId = x.instanceId || x.component;
    if (x.instanceId in exts.extentions) {
      throw Error(`Improperly configured, extention with instanceId="${x.instanceId}" already exists`);
    }

    x.toolButtons?.forEach(tb => {
      prepareButton_(tb);
      tb.dropDownList?.forEach(inner => prepareButton_);
    });

    const x_ = <ExtentionComponent>x;
    exts.extentions[x_.instanceId] = x_;

    x.defaultActions?.forEach(action => {
      if (!(action in exts.actionsIndex)) {
        exts.actionsIndex[action] = [];
      }
      exts.actionsIndex[action].push(x_);
    });

    const target = x.target || EXTENTION_DEFAULT_TARGET;
    if (!(target in exts.targetsIndex)) {
      exts.targetsIndex[target] = [];
    }
    exts.targetsIndex[target].push(x_);
  });

  return exts;
}

export class NGCore {
  router: any;
  version: string;
  config: any;
  menuDesc: MainMenuDescriptorFunction;
  i18n: any;
  apps: {[appName: string]: AppOptions};
  applNameIndex: {[applName: string]: string}; // Backend map applName -> appName
  appSettings: ComputedRef<AppSettings>;
  settingsNeedReload: Ref<boolean>;
  initialized: boolean;
  jsi: {[appName: string]: {[fn: string]: Function}};

  constructor (defaultConfig: any) {
    this.router = null;
    this.version = __META__.version;
    this.config = {...defaultConfig};
    this.menuDesc = defaultMenuDescriptor;
    this.i18n = null;
    this.apps = {};
    this.applNameIndex = {};
    this.settingsNeedReload = ref(false);
    this.initialized = false;

    this.jsi = {
      core: this.config.jsInterface,
    };
  }

  storeSetup_(app: any, options?: NGCoreOptions) {
    const store = createStore({modules: storeModules});
    app.use(store);

    const pinia = createPinia();
    app.use(pinia);

    this.appSettings = useAppSettingsStore(this.config.defaultSettings).settings;

    watch(
      () => this.appSettings.value.language,
      () => {
        if (this.i18n.global.locale !== this.locale.value) {
          this.i18n.global.locale = this.locale.value;
          Cookies.set('django_language', this.locale.value, {path:'/', expires: '3650d'});
          this.settingsNeedReload.value = true;
        }
      }
    );

  }

  i18nSetup_(app: any, options?: NGCoreOptions) {
    let compMessages = options?.messages ?? {en: enMessages, ru: ruMessages};

    if (options?.apps && isObject(options?.apps)) {
      for (const [appName, appOptions] of Object.entries(options.apps)) {
        if (appOptions.messages) {
          compMessages = mergeDeep(compMessages, appOptions.messages);
        }
      }
    }

    this.i18n = createI18n({
      allowComposition: true,
      legacy: true,
      locale: this.locale.value,
      messages: compMessages,
    });
    if (Cookies.get('django_language') !== this.locale.value) {
      Cookies.set('django_language', this.locale.value, {path:'/', expires: '3650d'});
    }

    app.use(this.i18n);
  }

  get isNeedReload(): ComputedRef<boolean> {
    return computed(() => (this.settingsNeedReload.value))
  };

  get locale(): ComputedRef<string> {
    return computed(() => (this.appSettings?.value.language ?? this.config.defaultSettings.language));
  }

  get filters() {
    return {
      truncate,
    }
  }

  get mainMenu(): MainMenu {
    return this.menuDesc();
  }

  get catalogs(): CatalogIndex {
    const catalogs: CatalogIndex = {...this.config.catalogs};

    if (this.apps) {
      for (const app of Object.keys(this.apps)) {
        const appConfig = this.apps[app];
        if (appConfig.catalogs) {
          for (const catalogId of Object.keys(appConfig.catalogs)) {
            if (catalogId in catalogs) {
              throw Error(`Duplicate catalog "${catalogId}" from application "${app}"`);
            }
            catalogs[catalogId] = appConfig.catalogs[catalogId];
          }
        }
      }
    }
    return catalogs;
  }

  get extentions(): ComputedRef<FormExtentionsIndex> {
    return computed(() => {
      const extentions: FormExtentionsIndex = {};
      if (!this.apps) {
        return extentions;
      }

      for (const app of Object.keys(this.apps)) {
        const appConfig = this.apps[app];
        if (appConfig.extentionsDesc) {
          const appExtentions = appConfig.extentionsDesc(appConfig);
          for (const classname of Object.keys(appExtentions)) {
            const formExtAdd = appExtentions[classname];
            let formExt = extentions[classname];
            if (!formExt) {
              formExt = {};
              extentions[classname] = formExt;
            }

            for (const instanceId of Object.keys(formExtAdd)) {
              const instExtAdd = formExtAdd[instanceId];
              let instExt = formExt[instanceId];

              if (!instExt) {
                instExt = [];
                formExt[instanceId] = instExt;
              }

              instExtAdd.reduce((agg, item) => (agg.push(item), agg), instExt);
            }
          }
        }
      }

      return extentions;
    })
  }

  get appsMenu(): {[submenu: string]: {[app: string]: MenuItemPartial[]}} {
    const appsMenu = {
      [DEFAULT_APPS_SECTION]: {},
    };

    if (this.apps) {
      for (const app of Object.keys(this.apps)) {
        const appMenuDesc = this.apps[app].menuDesc;
        if (!appMenuDesc) {
          continue;
        }

        const menu_ = appMenuDesc(this.apps[app]);
        if (Array.isArray(menu_)) {
          appsMenu[DEFAULT_APPS_SECTION][app] = menu_;
        }
        else {
          for (const section of Object.keys(menu_)) {
            if (!(section in appsMenu)) {
              appsMenu[section] = {};
            }
            appsMenu[section][app] = menu_[section];
          }
        }
      }
    }

    return appsMenu;
  }

  goLogin() {
    this.router.push(this.config.routes.login);
  }

  goIndex() {
    this.router.push(this.config.routes.index);
  }

  goBack() {
    if (window.history.length > 1) {
      this.router.go(-1);
    }
    else {
      this.goIndex();
    }
  }

  goReload() {
    this.router.go();
  }

  /**
   *  options = {
   *    config, - Main configuration overrides
   *    apps, - Applications options map
   *      config - application config
   *      storeModules - DEPRICATED: application store modules
   *      messages - apllication i18n messages
   *      routes - application routes
   *      mainMenu - application injections into main menu
   *    menuMenu - Main Menu
   *  }
   */
  install(app: any, options?: NGCoreOptions) {
    this.router = options?.router;
    if (this.router) {
      app.use(this.router);
    }

    if (isObject(options?.config) && options?.config) {
      this.config = mergeDeep(this.config, options.config);
    }
    if (options?.menuDesc) {
      this.menuDesc = options.menuDesc;
    }
    this.apps = options?.apps ?? {};
    Object.keys(this.apps).forEach(appName => {
      if (this.apps[appName].jsInterface) {
        this.jsi[appName] = this.apps[appName].jsInterface;
      }
    });

    app.provide('$ngc', this);
    app.config.globalProperties.$ngc = this;

    this.storeSetup_(app, options);
    this.i18nSetup_(app, options);

    components.forEach(([name, comp]) => app.component(name, comp));
    directives.forEach(dir => app.directive(dir.name, dir));
    plugins.forEach(p => app.use(p));

    this.initialized = true;
  }

}

let ngc: NGCore | undefined;

export function createNGCore(config: any) {
  if (ngc) {
    throw Error("NGCore already exists");
  }
  ngc = new NGCore(config);
  return ngc;
}

export function useNGCore(): NGCore {
  if (!ngc || !ngc.initialized) {
    throw Error("NGCore not installed");
  }
  return ngc;
}

export function _t(...args: any): string {
  if (!ngc || !ngc.initialized) {
    throw Error("NGCore not installed");
  }
  return ngc.i18n.global.t(...args);
}
