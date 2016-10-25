/**
 * Created by DavidIgnacio on 9/27/2016.
 */
export class TraceViewConfig {

  static components = [
    "navigation-gutter",
    "data-gutter",
    "trace-player",
    "trace-search",
    "console-window"
  ];
  static traceTypesToIgnore = {
    common: [],
    "navigation-gutter": [],
    "data-gutter": [],
    "trace-player": [],
    "trace-search": [],
    "console-window": []
  };

  static getIgnoreListByComponent(componentName) {

  }
}
