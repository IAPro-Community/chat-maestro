interface ChromeAlarm { name: string }
interface ChromeTab { id?: number; url?: string; active?: boolean; windowId?: number }
interface ChromeApi {
  runtime: {
    lastError?: {message: string};
    getURL: (path: string) => string;
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
    query: (criteria: {active: boolean; currentWindow?: boolean; lastFocusedWindow?: boolean}) => Promise<ChromeTab[]>;
    create: (options: {url: string; active?: boolean}) => Promise<ChromeTab>;
  };
  permissions: {
    contains: (permissions: {origins: string[]}) => Promise<boolean>;
    request: (permissions: {origins: string[]}) => Promise<boolean>;
  };
  scripting: {
    executeScript: <T>(args: {target: {tabId: number}; func: (...args: any[]) => T; args?: any[]}) => Promise<Array<{result: T}>>;
  }
}
declare const chrome: ChromeApi;
