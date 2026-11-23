interface ChromeSender {tab?: ChromeTab;url?:string;frameId?:number;id?:string}
interface ChromeRegisteredScript {id:string;matches:string[];js:string[];runAt?:'document_idle';allFrames?:boolean;persistAcrossSessions?:boolean}
interface ChromeAlarm { name: string }
interface ChromeTab { id?: number; url?: string; active?: boolean; windowId?: number }
interface ChromeApi {
  runtime: {
    lastError?: {message: string};
    getURL: (path: string) => string;
    sendMessage: <T=unknown>(message: unknown) => Promise<T>;
    onMessage: {addListener: (listener: (message: unknown, sender: ChromeSender, sendResponse: (response: unknown) => void) => boolean | void) => void};
    onInstalled: {addListener: (callback: () => void) => void};
    onStartup: {addListener: (callback: () => void) => void};
  };
  sidePanel: {setPanelBehavior: (options: {openPanelOnActionClick: boolean}) => Promise<void>};
  alarms: {
    create: (name: string, options: {periodInMinutes: number}) => Promise<void>;
    clear: (name: string) => Promise<boolean>;
    onAlarm: {addListener: (listener: (alarm: ChromeAlarm) => void) => void};
  };
  storage: {
    local: {
      get: (keys: string | string[] | null) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
      setAccessLevel: (options: {accessLevel: 'TRUSTED_CONTEXTS'}) => Promise<void>;
    }
  };
  tabs: {
    get: (tabId: number) => Promise<ChromeTab>;
    query: (criteria: {active: boolean; currentWindow?: boolean; lastFocusedWindow?: boolean}) => Promise<ChromeTab[]>;
    create: (options: {url: string; active?: boolean}) => Promise<ChromeTab>;
  };
  permissions: {
    onAdded: {addListener: (listener: () => void) => void};
    onRemoved: {addListener: (listener: () => void) => void};
    contains: (permissions: {origins: string[]}) => Promise<boolean>;
    request: (permissions: {origins: string[]}) => Promise<boolean>;
  };
  scripting: {
    registerContentScripts: (scripts: ChromeRegisteredScript[]) => Promise<void>;
    unregisterContentScripts: (filter: {ids: string[]}) => Promise<void>;
    getRegisteredContentScripts: (filter?: {ids?: string[]}) => Promise<ChromeRegisteredScript[]>;
    executeScript: <T>(args: {target: {tabId: number}; func?: (...args: any[]) => T; args?: any[]; files?: string[]}) => Promise<Array<{result: T}>>;
  }
}
declare const chrome: ChromeApi;
