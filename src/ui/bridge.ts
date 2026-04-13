// Access React and SDK hooks from the Paperclip plugin bridge.
// Plugins don't bundle React — it's provided by the host at runtime.

declare global {
  var __paperclipPluginBridge__: {
    react: typeof import('react');
    sdkUi: {
      usePluginData: any;
      usePluginAction: any;
      usePluginToast: any;
      useHostContext: any;
      usePluginStream: any;
    };
  };
}

export function getReact() {
  return globalThis.__paperclipPluginBridge__?.react;
}

export function getHook<T = any>(name: string): T {
  return globalThis.__paperclipPluginBridge__?.sdkUi?.[name];
}
