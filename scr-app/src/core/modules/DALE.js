import debounce from 'lodash/debounce';

import {configureLocToMonacoRange} from 'monaco-jsx-highlighter';
import {monacoProps} from "../../utils/monacoUtils";
import {
   ScopeTypes,
   TraceEvents,
   LiveZoneTypes,
   LiveZoneDecorationStyles, ScopeExitTypes
} from "./ALE";

export const ViewZoneEventType = {
   CREATE: 'CREATE',
   READ: 'READ',
   UPDATE: 'UPDATE',
   DELETE: 'DELETE',
};

export const DECORATION_Z_INDEX = {
   normal: 1,
   active: 2,
   hover: 3,
};

export const ZoneDecorationType = {
   resolveType: function (
      {liveZoneType, scopeType},
      liveZoneDecorationStyle = LiveZoneDecorationStyles.normal
   ) {
      
      switch (liveZoneType) {
         case LiveZoneTypes.B:
            if (scopeType === ScopeTypes.F) {
               return this.FunctionBranch[liveZoneDecorationStyle];
            }
            
            return this.ControlBranch[liveZoneDecorationStyle];
         
         case  LiveZoneTypes.P:
            return this.Import[liveZoneDecorationStyle];
         default:
            return this.LiveValue[liveZoneDecorationStyle];
      }
   },
   FunctionBranch: {
      normal: {
         zIndex: DECORATION_Z_INDEX.normal,
         inlineClassName: 'ale.branch.function.normal'
      },
      active: {
         zIndex: DECORATION_Z_INDEX.active,
         inlineClassName: 'ale.branch.function.active'
      },
      hover: {
         zIndex: DECORATION_Z_INDEX.hover,
         inlineClassName: "ale.branch.function.hover"
      }
   },
   ControlBranch: {
      normal: {
         zIndex: DECORATION_Z_INDEX.normal,
         inlineClassName: 'ale.branch.control.normal'
      },
      active: {
         zIndex: DECORATION_Z_INDEX.active,
         inlineClassName: 'ale.branch.control.active'
      },
      hover: {
         zIndex: DECORATION_Z_INDEX.hover,
         inlineClassName: "ale.branch.control.hover"
      }
   },
   LiveValue: {
      normal: {
         zIndex: DECORATION_Z_INDEX.normal,
         inlineClassName: 'ale.value.normal'
      },
      active: {
         zIndex: DECORATION_Z_INDEX.active,
         inlineClassName: 'ale.value.active'
      },
      hover: {
         zIndex: DECORATION_Z_INDEX.hover,
         inlineClassName: "ale.value.hover"
      }
   },
   Import: {
      normal: {
         zIndex: DECORATION_Z_INDEX.normal,
         inlineClassName: 'ale.import.normal'
      },
      active: {
         zIndex: DECORATION_Z_INDEX.active,
         inlineClassName: 'ale.import.active'
      },
      hover: {
         zIndex: DECORATION_Z_INDEX.hover,
         inlineClassName: "ale.import.hover"
      }
   },
};

export const resetMonacoEditorViewZones = (editor, viewZoneIdsRef) => {
   editor.changeViewZones(changeAccessor => {
      const {
         current: viewZoneIds,
         onViewZoneDOMChange,
      } = viewZoneIdsRef;
      
      const vLineCount = viewZoneIds?.length;
      
      for (let i = 1; i <= vLineCount; i++) {
         if (viewZoneIds[i]) {
            onViewZoneDOMChange(
               ViewZoneEventType.DELETE, changeAccessor, viewZoneIds, i, null
            );
         }
      }
      viewZoneIdsRef.current = [viewZoneIds];
   });
};

export const updateMonacoEditorViewZones = (editor, viewZoneIdsRef) => {
   editor.changeViewZones(changeAccessor => {
      const {
         current: viewZoneIds,
         onViewZoneDOMChange,
      } = viewZoneIdsRef;
      const lineCount = editor.getModel().getLineCount();
      const newViewZoneIds = [viewZoneIds];
      
      const vLineCount = viewZoneIds ? viewZoneIds.length : 0;
      
      const count = Math.max(lineCount, vLineCount);
      for (let i = 1; i <= count; i++) {
         if (i > lineCount) {
            if (viewZoneIds?.[i]) {
               onViewZoneDOMChange(
                  ViewZoneEventType.DELETE, changeAccessor, viewZoneIds, i, null
               );
            }
         } else {
            if (viewZoneIds?.[i]) {
               onViewZoneDOMChange(
                  ViewZoneEventType.UPDATE,
                  changeAccessor, newViewZoneIds, i, viewZoneIds[i]
               );
               continue;
            }
            
            onViewZoneDOMChange(
               ViewZoneEventType.CREATE,
               changeAccessor, newViewZoneIds, i, null
            );
         }
      }
      viewZoneIdsRef.current = newViewZoneIds;
   });
};


const makeOnViewZoneDOMChange = (
   onChange,
   createViewZone = (i) => {
      const domNode = document.createElement('div');
      // domNode.style.background = 'transparent';
      // domNode.style.border = '1px dashed grey';
      return {
         afterLineNumber: i,
         heightInPx: 0,
         domNode
      };
   },
) => {
   
   return (...params) => {
      const [
         ViewZoneEventType, changeAccessor, viewZoneIds, i, viewZoneId
      ] = params;
      switch (ViewZoneEventType) {
         case ViewZoneEventType.CREATE:
            viewZoneIds[i] = changeAccessor.addZone(createViewZone(i));
            break;
         case ViewZoneEventType.UPDATE:
            changeAccessor.layoutZone(viewZoneId);
            viewZoneIds[i] = viewZoneId;
            break;
         case ViewZoneEventType.DELETE:
            changeAccessor.removeZone(viewZoneIds[i]);
            break;
         case ViewZoneEventType.READ:
         default:
            console.warn(`unsupported event: ${ViewZoneEventType}`);
      }
      
      onChange?.(...params);
   }
};


export function sortedIndex(array, value, property, property2) {
   let low = 0,
      high = array.length;
   
   while (low < high) {
      let mid = (low + high) >>> 1;
      let isLessThan = null;
      if (property) {
         if (property2) {
            isLessThan =
               parseFloat(array[mid][property][property2], 10) <
               parseFloat(value[property][property2], 10);
         } else {
            isLessThan =
               parseFloat(array[mid][property], 10) <
               parseFloat(value[property], 10);
         }
      } else {
         isLessThan = array[mid] < value;
      }
      
      if (isLessThan) {
         low = mid + 1;
      } else {
         high = mid;
      }
   }
   return low;
}

export function sortedUniquePush(array, value, ...rest) {
   if (array.indexOf(value) < 0) {
      array.splice(sortedIndex(array, value, ...rest), 0, value);
   }
}

export const mouseActionTypes = {
   mousemove: "mousemove",
   mousedown: "mousedown",
   mouseleave: "mouseleave",
   contextmenu: "contextmenu"
};

// export function setContentWidgetDomNodeStyle(domNode, className, style) {
//    if(className??false){
//       domNode.className = className;
//    }
//
//    for (let prop in (style??{})) {
//       domNode.style[prop] = style[prop];
//    }
//
//    return domNode;
// }

export function styleContentWidgetDomNode(domNode/*, ...rest*/) {
   domNode.style.overflow = 'hidden';
   domNode.style.whiteSpace = 'nowrap';
   domNode.style.marginTop = `-${monacoProps.widgetOffsetHeight}px`;
   domNode.style.height = `${monacoProps.widgetMaxHeight}px`;
   domNode.style.maxHeight = `${monacoProps.widgetMaxHeight}px`;
   domNode.style.minWidth = `${monacoProps.widgetMinWidth}px`;
   domNode.style.backgroundColor = monacoProps.widgetBackgroundColor;
   domNode.style.fontSize = `${monacoProps.widgetFontSize}px`;
   
   // return setContentWidgetDomNodeStyle(domNode,...rest);
}

class ContentWidgetManager {
   resizeDelay = 10;
   layoutAllDelay = 100;
   resolveMouseActionEnterDelay = 150;
   resolveMouseActionLeaveDelay = 300;
   contentWidgets = {};
   pendingToResize = [];
   resolveMouseActionDecorationIds = [];
   lastMouseActionRange = null;
   editor = null;
   monaco = null;
   handleMouseActionDecoration = null;
   style = {
      minWidth: '8px',
      maxWidth: '600px',
   };
   
   constructor(
      editor, monaco, handleMouseActionDecoration
   ) {
      this.editor = editor;
      this.monaco = monaco;
      this.handleMouseActionDecoration = handleMouseActionDecoration;
      
      this._layoutAll = debounce(
         this.layoutAll,
         this.layoutAllDelay
      );
      
      this._resize = debounce(
         this.resize,
         this.resizeDelay
      );
      
      this._resolveMouseActionReset = debounce(
         this.resolveMouseActionReset,
         this.resolveMouseActionLeaveDelay
      );
      
      this._resolveMouseActionMoveEnter = debounce(
         this.resolveMouseActionMove,
         this.resolveMouseActionEnterDelay
      );
      
      this._resolveMouseActionMoveLeave = debounce(
         this.resolveMouseActionMove,
         this.resolveMouseActionLeaveDelay
      );
   }
   
   getContentWidgets = () => {
      return this.contentWidgets;
   };
   
   makeContentWidget = (id, locLiveZoneActiveDecoration) => {
      const {monaco, editor, pendingToResizePush} = this;
      
      const getId = () => {
         return id;
      };
      
      const getRange = () => {
         return editor.getModel()?.getDecorationRange(id);
      };
      
      const contentWidget = {
         allowEditorOverflow: true,
         suppressMouseDown: true,
         domNode: null,
         locLiveZoneActiveDecoration,
         getId,
         getRange,
         getDomNode: function () {
            if (!this.domNode) {
               this.domNode = document.createElement("div");
               styleContentWidgetDomNode(this.domNode);
            }
            return this.domNode;
         },
         getPosition: function () {
            pendingToResizePush(this);
            return {
               range: getRange(),
               preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
            };
         }
      };
      
      contentWidget.layout = () => {
         this.layoutContentWidget(contentWidget);
      }
      return contentWidget;
   };
   
   
   removeContentWidgetById = (id) => {
      const contentWidget = this.getContentWidgets()[id];
      contentWidget && this.editor.removeContentWidget(contentWidget);
   };
   
   layoutContentWidget = (contentWidget) => {
      this.editor?.layoutContentWidget(contentWidget);
   };
   
   layoutAll = () => {
      const contentWidgets = this.getContentWidgets();
      for (let id in contentWidgets) {
         this.layoutContentWidget(contentWidgets[id]);
      }
   };
   
   filterTimelineDataVisibleWidgets = (timelineDataVisible) => {
      
      if (!timelineDataVisible) {
         return [];
      }
      
      const contentWidgets = this.getContentWidgets();
      
      return Object.keys(timelineDataVisible)
         .filter(id => timelineDataVisible[id])
         .map(id => contentWidgets[id]);
   };
   
   calculateMaxWidthString = (right, left, minWidth) => {
      const maxWidth = parseFloat(right) - parseFloat(left);
      if (maxWidth > 0) {
         return `${
            Math.max(maxWidth, minWidth)
         }px`
      }
      
      return null;
   };
   
   resize = (timelineDataVisible) => {
      this.doResize(this.pendingToResize);
      this.pendingToResize = [];
      this.doResize(this.filterTimelineDataVisibleWidgets(timelineDataVisible));
   };
   
   doResize = (contentWidgetsArray) => {
      const lineNodes = {};
      contentWidgetsArray.forEach((contentWidget) => {
         const domNode = contentWidget?.getDomNode();
         const domNodeStyle = domNode?.style;
         if (domNodeStyle) {
            if (lineNodes[domNodeStyle.top]) {
               sortedUniquePush(
                  lineNodes[domNodeStyle.top], domNode, "style", "left"
               );
            } else {
               lineNodes[domNodeStyle.top] = [domNode];
            }
         }
      })
      
      const minWidth = parseFloat(this.style.minWidth);
      
      for (let top in lineNodes) {
         let leftDomNode = null;
         lineNodes[top].forEach((rightDomNode) => {
            if (leftDomNode) {
               const maxWidthString = this.calculateMaxWidthString(
                  rightDomNode.style.left,
                  leftDomNode.style.left,
                  minWidth
               );
               
               if (maxWidthString) {
                  // console.log(">>" + top, leftDomNode, rightDomNode, maxWidth);
                  leftDomNode.style.maxWidth = maxWidthString;
                  leftDomNode = rightDomNode;
               }
            } else {
               leftDomNode = rightDomNode;
            }
         });
         
         // if (rightDomNode) {
         //    console.log(">>" + top + '>>last', leftDomNode, rightDomNode);
         //    rightDomNode.style.maxWidth = this.style.maxWidth;
         // }
      }
   };
   
   pendingToResizePush = (entry) => {
      this._resize();
      return this.pendingToResize.push(entry);
   };
   
   resolveMouseActionMove = (currentRange, mouseActionDecorations) => {
      this.lastMouseActionRange = currentRange;
      this.resolveMouseActionDecorationIds =
         this.editor.deltaDecorations(
            this.resolveMouseActionDecorationIds,
            mouseActionDecorations
         );
   };
   
   resolveMouseActionReset = () => {
      this.resolveMouseActionDecorationIds =
         this.editor.deltaDecorations(
            this.resolveMouseActionDecorationIds,
            []
         );
   };
   
   resolveMouseAction = (eventType, eventInfo) => {
      this._resolveMouseActionMoveEnter.cancel();
      this._resolveMouseActionMoveLeave.cancel();
      this._resolveMouseActionReset.cancel();
      
      switch (eventType) {
         case mouseActionTypes.mousedown:
         case mouseActionTypes.mousemove:
            const currentRange =
               eventInfo.target.range ??
               this.contentWidgets[eventInfo.target.detail]?.getRange();
            if (
               currentRange &&
               (!this.lastMouseActionRange ||
                  !this.monaco.Range.equalsRange(
                     this.lastMouseActionRange,
                     currentRange
                  ))
            ) {
               let mouseActionDecorations = this.editor
                  .getModel()
                  .getDecorationsInRange(currentRange)
                  .filter(
                     (decoration) => !!this.contentWidgets[decoration.id]
                  );
               
               mouseActionDecorations =
                  this.handleMouseActionDecoration?.(mouseActionDecorations) ??
                  mouseActionDecorations;
               
               mouseActionDecorations.length ?
                  this._resolveMouseActionMoveEnter(
                     currentRange, mouseActionDecorations
                  )
                  : this._resolveMouseActionMoveLeave(
                     currentRange, mouseActionDecorations
                  );
               
            }
            break;
         default:
            this._resolveMouseActionReset();
      }
   };
   
   handleLayoutContentWidgetById = (id) => {
      const contentWidget = this.getContentWidgets()[id];
      
      if (!contentWidget) {
         return false;
      }
      
      this.editor.layoutContentWidget(contentWidget);
      return true;
   };
   
   handleLayoutContentWidgetByDecoration = (decoration) => {
      return this.handleLayoutContentWidgetById(decoration?.id);
   }
   
   observe = (forceReset = false) => {
      if (this.disposers) {
         if (!forceReset) {
            return this.unobserve;
         }
         
         this.unobserve();
      }
      
      const {monaco, editor} = this;
      
      const onDidChangeModelContentDisposer =
         editor.onDidChangeModelContent((event) => {
            let changeStartPosition = null;
            event.changes.forEach((change) => {
               const currentStartPosition =
                  monaco.Range.getStartPosition(change.range);
               if (changeStartPosition) {
                  if (currentStartPosition.isBefore(changeStartPosition)) {
                     changeStartPosition = currentStartPosition;
                  }
               } else {
                  changeStartPosition = currentStartPosition;
               }
               const modelEndPosition = editor
                  .getModel()
                  .getFullModelRange()
                  .getEndPosition();
               const affectedRange = monaco.Range.fromPositions(
                  changeStartPosition,
                  modelEndPosition
               );
               editor
                  .getModel()
                  .getDecorationsInRange(affectedRange)
                  .forEach(this.handleLayoutContentWidgetByDecoration);
            });
         });
      
      
      let width, height;
      
      const onDidLayoutChangeDisposer = editor.onDidLayoutChange((info) => {
         if (height !== info.height || width !== info.width) {
            height = info.height;
            width = info.width;
            this._layoutAll();
         }
      });
      
      // editor.onContextMenu(function (...e) {
      //   contentWidgetManager.resolveMouseAction(
      //   mouseActionTypes.contextmenu, ...e);
      // });
      
      const onMouseMoveDisposer = editor.onMouseMove((...e) => {
         this.resolveMouseAction(
            mouseActionTypes.mousemove, ...e
         );
      });
      
      const onMouseDownDisposer = editor.onMouseDown((...e) => {
         this.resolveMouseAction(
            mouseActionTypes.mousedown, ...e
         );
      });
      
      const onMouseLeaveDisposer = editor.onMouseLeave((...e) => {
         this.resolveMouseAction(
            mouseActionTypes.mouseleave, ...e
         );
      });
      
      this.disposers = [
         onDidChangeModelContentDisposer,
         onDidLayoutChangeDisposer,
         onMouseMoveDisposer,
         onMouseDownDisposer,
         onMouseLeaveDisposer,
      ];
      
      return this.unobserve;
   }
   
   unobserve = () => {
      if (!this.disposers) {
         return false;
      }
      
      this.disposers.forEach(disposer => disposer.dispose());
      
      this.disposers = null;
      return true;
   }
   
   onDecorationsChange = (ids, locLiveZoneActiveDecorations) => {
      const contentWidgets = {};
      const {prevIds} = this;
      const toRemove = {};
      
      prevIds?.forEach((id) => {
         toRemove[id] = true;
      });
      
      ids.forEach((id, i) => {
         toRemove[id] = false;
         
         if (!this.handleLayoutContentWidgetById(id)) {
            const contentWidget = this.makeContentWidget(id, locLiveZoneActiveDecorations[i]);
            contentWidgets[id] = contentWidget;
            this.editor.addContentWidget(contentWidget);
         } else {
            contentWidgets[id] = this.contentWidgets[id];
         }
      });
      
      for (const id in toRemove) {
         if (toRemove[id]) {
            this.removeContentWidgetById(id);
         }
      }
      
      this.prevIds = ids;
      this.contentWidgets = contentWidgets;
      
      return toRemove;
   }
}

// const getZoneParentScopeUIDs = (zone) => {
//    const parentScopeUIDs = [];
//    let parentZone = zone?.parentSnapshot;
//
//    while (parentZone) {
//       parentScopeUIDs.push(parentZone.uid);
//       parentZone = parentZone.parentSnapshot;
//    }
//
//    return parentScopeUIDs;
//
// };

class BranchNavigator {
   _uid = null;
   _zone = null;
   _paths = [];
   _min = null;
   _max = null;
   _tryBlockType = null;
   _scopeExitType = null;
   currentBranch = -1;
   branches = [];
   _paramsIdentifiers = [];
   
   
   constructor(uid, zone) {
      this._uid = uid;
      this._zone = zone;
   }
   
   uid() {
      return this._uid;
   }
   
   zone() {
      return this._zone;
   }
   
   tryBlockType(tryBlockType) {
      if (tryBlockType) {
         this._tryBlockType = tryBlockType;
      }
      return this._tryBlockType;
   }
   
   scopeExitType(scopeExitType) {
      if (scopeExitType) {
         this._scopeExitType = scopeExitType;
      }
      return this._scopeExitType;
   }
   
   paths() {
      return this._paths;
   }
   
   min() {
      return this._min;
   }
   
   max() {
      return this._max;
   }
   
   current(paramsIdentifier) {
      if (paramsIdentifier) {
         return this.allBranches().find(b => b?.paramsIdentifier === paramsIdentifier);
      }
      
      return this.allBranches().reverse().find(b => b?.out === -1);
   }
   
   currentEnter(paramsIdentifier, zone) {
      let i = -1;
      if (paramsIdentifier) {
         i = this.allBranches().findIndex(b => b?.paramsIdentifier === paramsIdentifier);
      }
      
      if (i < 0) {
         i = this._paramsIdentifiers.push({paramsIdentifier, zone}) - 1;
      }
      
      return i;
   }
   
   last() {
      return this.branches[this.branches.length - 1];
   }
   
   allBranches() {
      return this.paths().reduce((r, e) => [...r, ...e], []);
   }
   
   enter(i, zone, paramsIdentifier) {
      this.currentBranch = this.currentEnter(
         paramsIdentifier ?? `${i}`, zone
      );
      
      if (this.currentBranch === 0) {
         const branches = [];
         this._paths.push(branches);
         this.branches = branches;
      }
      
      this.branches[this.currentBranch] = {
         paramsIdentifier,
         i: this.currentBranch,
         in: i,
         out: -1,
         zones: {in: zone, out: null}
      };
      
      this._min = Math.min(this.min(), i);
   }
   
   exit(i, zone, paramsIdentifier) {
      const current = this.current(paramsIdentifier);
      if (current?.out === -1) {
         current.out = i;
         current.zones.out = zone;
         this._max = Math.max(this.max(), i);
      }
   }
   
   getScopeType() {
      return this.zone()?.scopeType;
   }
   
   getScopeExit(scopeExitType) {
      return this.zone()?.scopeExits[scopeExitType];
   }
   
   getLoopScopeUID() {
      return this.zone()?.loopScopeUID;
   }
   
   toString() {
      return this.uid();
   }
   
   relativePaths(branchNavigator) {
      const relativePaths = [];
      if (this === branchNavigator) {
         return relativePaths;
      }
      
      const branchNavigatorPaths = branchNavigator?.paths?.();
      if (!branchNavigatorPaths?.length) {
         return relativePaths;
      }
      
      if (this.min() > branchNavigator.max() ||
         this.max() < branchNavigator.min()) {
         return relativePaths;
      }
      
      this.paths().forEach((parentPath, parentPathI) => {
         parentPath.forEach((parentBranch, parentBranchI) => {
            branchNavigatorPaths.forEach((path, pathI) => {
               path.forEach((branch, branchI) => {
                  if (branch.in > parentBranch.in && branch.out < parentBranch.out) {
                     relativePaths.push({
                        branch,
                        branchI,
                        path,
                        pathI,
                        parentBranch,
                        parentBranchI,
                        parentPath,
                        parentPathI
                     });
                  }
               })
            })
         })
      });
      
      return relativePaths;
   }
}


export class BranchNavigatorManager {
   aleInstance = null
   lastTimelineLength = 0;
   navigators = {};
   programStartTimelineI = null;
   programEndTimelineI = null;
   _values = {};
   _programZone = null;
   _programUID = null;
   _currentThrow = {};
   
   constructor(aleInstance) {
      this.aleInstance = aleInstance;
   }
   
   values(newValues) {
      if (newValues) {
         this._values = newValues;
      }
      return this._values;
   }
   
   programUID(newZone) {
      if (newZone) {
         this._programZone = newZone;
         this._programUID = newZone.uid;
      }
      return this._programUID;
   }
   
   currentThrow(newCurrentThrow) {
      if (newCurrentThrow) {
         this._currentThrow = newCurrentThrow;
      }
      return this._currentThrow;
   }
   
   getNavigators = () => {
      return this.navigators;
   };
   
   getNavigator = (uid) => {
      return this.getNavigators()?.[uid];
   };
   
   setLastTimelineLength = (lastTimelineLength) => {
      this.lastTimelineLength = lastTimelineLength;
   };
   
   getLastTimelineLength = () => {
      return this.lastTimelineLength;
   };
   
   setLocLiveZoneActiveDecorations = (locLiveZoneActiveDecorations) => {
      this.locLiveZoneActiveDecorations = locLiveZoneActiveDecorations;
   };
   
   getLocLiveZoneActiveDecorations = () => {
      return this.locLiveZoneActiveDecorations;
   };
   
   setProgramEndTimelineI = (programEndTimelineI) => {
      this.programEndTimelineI = programEndTimelineI;
   };
   
   getProgramEndTimelineI = () => {
      return this.programEndTimelineI;
   };
   
   setProgramStartTimelineI = (programStartTimelineI) => {
      this.programStartTimelineI = programStartTimelineI;
   };
   
   getProgramEndTimelineI = () => {
      return this.programStartTimelineI;
   };
   
   resolveScope(uid, zone) {
      let branchNavigator = this.getNavigator(uid);
      if (!branchNavigator) {
         branchNavigator = new BranchNavigator(
            uid, zone
         );
         this.navigators[uid] = branchNavigator;
      }
      
      const loopScopeUID = zone?.loopScopeUID;
      if (loopScopeUID) {
         this.navigators[loopScopeUID] = branchNavigator;
      }
      return branchNavigator;
   }
   
   getNavigatorsByScopeExitType(uid, scopeExitType) {
      const navigators = this.getNavigators();
      const currentNavigator = navigators[uid];
      const currentScopeExitUID =
         currentNavigator?.getScopeExit(scopeExitType).uid;
      
      const result = [];
      
      for (const navigatorKey in navigators) {
         const navigator = navigators[navigatorKey];
         const tryUID = navigator?.getScopeExit(scopeExitType).uid;
         if (currentScopeExitUID === tryUID) {
            result.push(navigator);
         }
      }
      
      return result;
   }
   
   
   getTryBlockNavigator(uid, tryBlockType) {
      const navigators =
         this.getNavigatorsByScopeExitType(uid, ScopeExitTypes.T);
      return navigators.find(navigator => {
         if (navigator.uid() === uid) {
            return false;
         }
         
         if (navigator.tryBlockType() === tryBlockType) {
            return true;
         }
         
         return false;
         
      });
   }
   
   enterScope(uid, i, zone, tryBlockType, extraZone, paramsIdentifier) {
      
      const scope = this.resolveScope(uid, zone);
      if (tryBlockType) {
         scope.tryBlockType(tryBlockType);
         let previousTryBlockType =
            tryBlockType === 'handler' ? 'block'
               : tryBlockType === 'finalizer' ? 'handler' : null;
         
         if (previousTryBlockType) {
            const tryBlockNavigator =
               this.getTryBlockNavigator(uid, previousTryBlockType);
            
            const boundaryBranch = tryBlockNavigator?.current(paramsIdentifier);
            const tryUID = tryBlockNavigator?.uid();
            if (boundaryBranch?.out === -1) {
               tryBlockNavigator.exit(
                  this.currentThrow().i ?? i,
                  this.currentThrow().zone ?? zone
               );
               this.exitSubScopes(tryUID, boundaryBranch, ScopeExitTypes.T);
            }
         }
      }
      
      if (extraZone?.type === "SwitchCase" && scope.current(paramsIdentifier)) {
         return scope;
      }
      scope.enter(i, zone, paramsIdentifier);
      return scope;
   }
   
   exitSubScopes(uid, boundaryBranch, scopeExitType, isScopeExit) {
      
      if (!boundaryBranch) {
         return;
      }
      
      const navigators = this.getNavigators();
      const currentNavigator = navigators[uid];
      
      if (!currentNavigator) {
         return;
      }
      
      const exitUID =
         isScopeExit ? uid : currentNavigator.getScopeExit(scopeExitType)?.uid;
      
      if (!exitUID) {
         return;
      }
      
      for (const navigatorKey in navigators) {
         const navigator = navigators[navigatorKey];
         
         // if (uid == navigator.uid()) {
         //    continue;
         // }
         
         if ((
            scopeExitType === ScopeExitTypes.R ||
            scopeExitType === ScopeExitTypes.Y
         ) && (
            navigator.getScopeType() === ScopeTypes.F
         )
         ) {
            continue;
         }
         
         const isInScope = scopeExitType === ScopeExitTypes.T ||
            (navigator.getScopeExit(scopeExitType)?.uid === exitUID);
         
         const branches =
            scopeExitType === ScopeExitTypes.T ?
               navigator.allBranches()
               : [navigator.current()];
         
         branches.forEach(branch => {
            if (branch && isInScope) {
               if (boundaryBranch.in <= branch.in && branch.out === -1) {
                  navigator.exit(boundaryBranch.out, boundaryBranch.zones.out);
                  //  console.log('>>', uid, navigator.uid(), boundaryBranch.in, branch.in, branch.out, scopeExitType);
               }
            }
         });
      }
      
   }
   
   exitScope(uid, i, zone, scopeExitType, paramsIdentifier) {
      let scope = null;
      let boundaryBranch = null;
      switch (scopeExitType) {
         case ScopeExitTypes.R:
         case ScopeExitTypes.Y:
         case ScopeExitTypes.C:
         case ScopeExitTypes.B:
            scope = this.resolveScope(uid);
            boundaryBranch = scope?.current(paramsIdentifier);
            if (boundaryBranch?.out === -1) {
               scope.exit(i, zone, paramsIdentifier);
            }
            
            this.exitSubScopes(
               uid, boundaryBranch, scopeExitType, true
            );
            break;
         case ScopeExitTypes.T:
            this.currentThrow({
               uid, i, zone, scopeExitType
            });
            scope = this.resolveScope(uid);
            break;
         case ScopeExitTypes.N:
         default:
            scope = this.resolveScope(uid);
            scope?.exit(i, zone, paramsIdentifier);
      }
      
      scopeExitType && scope?.scopeExitType(scopeExitType);
      return scope;
   }
   
   getZoneByUID(bale, zale, uid) {
      if (!bale || !zale) {
         return null;
      }
      return zale.zones[bale.scopesMaps[uid]?.expressionId];
   }
   
   isTraceReset = (timeline) => {
      return this._timeline !== timeline;
   }
   
   handleTraceReset = (timeline, zones, scopesMaps, locToMonacoRange /*, ref, monacoEditor*/) => {
      if (!this.isTraceReset(timeline)) {
         return false;
      }
      
      this._timeline = timeline;
      // monacoEditor.deltaDecorations?.(
      //    ref?.current?.activeIds ?? [],
      //    []
      // );
      this.locLiveZoneActiveDecorationsReset(
         zones, scopesMaps, locToMonacoRange
      );
      this.setLastTimelineLength(0);
      this.setProgramStartTimelineI(null);
      this.setProgramEndTimelineI(null);
      this.values({});
      return true;
   };
   
   locLiveZoneActiveDecorationsReset = (
      zones, scopesMaps, locToMonacoRange
   ) => {
      this.setLocLiveZoneActiveDecorations([]);
      for (let uid in scopesMaps) {
         const scopeMap = scopesMaps[uid];
         const zone = zones[scopeMap.expressionId];
         if (zone) {
            const getBranchNavigator = () => this.resolveScope(uid, zone);
            this.locLiveZoneActiveDecorationsPush(zone, [], locToMonacoRange, getBranchNavigator);
         }
      }
   }
   
   locLiveZoneActiveDecorationsPush = (zone, logValues, locToMonacoRange, getBranchNavigator, forcePush) => {
      const options = ZoneDecorationType.resolveType(
         zone, LiveZoneDecorationStyles.active
      );
      
      // zone.locLiveZones.getHighlights().forEach(loc => {
      //    locLiveZoneActiveDecorations.push({
      //       options,
      //       range: locToMonacoRange?.(loc),
      //    });
      // });
      const loc = zone.locLiveZones.getMainAnchor();
      const range = locToMonacoRange?.(loc);
      const found = this.locLiveZoneActiveDecorations.find(
         d => d.range.equalsRange(range)
      );
      
      // if(zone?.type === 'BinaryExpression'){
      //    console.log('BinaryExpression', {zone, range, logValues, found});
      // }
      
      if (forcePush || !found) {
         
         //  !found && console.log('FF', zone, loc);
         this.locLiveZoneActiveDecorations.push({
            zone,
            logValues,
            options,
            range,
            getBranchNavigator,
         });
      }
   }
   
   handleTimelineChange = () => {
      if (!this.aleInstance) {
         return;
      }
      
      const {
         zale, bale, scr, dale, afterTraceChange, resetTimelineChange
      } = this.aleInstance.getModel();
      
      if (!(zale?.zones && bale?.scopesMaps && scr?.timeline)) {
         return;
      }
      const {
         locToMonacoRange,
         ref,
         monacoEditor,
         contentWidgetManager,
      } = dale ?? {};
      
      let isTraceReset = this.handleTraceReset(
         scr.timeline, zale.zones, bale.scopesMaps, locToMonacoRange,
         /*, ref, monacoEditor*/
      );
      
      const from = this.getLastTimelineLength();
      const to = scr.timeline.length;
      
      const timelineDataDelta = {};
      const values = this.values();
      let logValues = [];
      
      for (let i = from; i < to; i++) {
         const entry = scr.timeline[i];
         const {
            pre, traceEventType, uid, scopeType, extraExpressionId,
            tryBlockType, scopeExitType, paramsIdentifier,
         } = entry;
         let zone = null;
         let branchNavigator = null;
         
         let ignore = false;
         switch (traceEventType) {
            case TraceEvents.L:
               const expressionId = pre?.expressionId;
               zone = zale.zones[pre?.expressionId];
               values[expressionId] = values[expressionId] ?? [];
               logValues = values[expressionId];
               const logValue = {
                  i,
                  uid,
                  zone,
                  entry,
                  isReady: false,
                  getValue: entry?.logValue?.getSnapshot
               };
               
               logValues.push(logValue);
               break;
            case TraceEvents.O:
               zone = zale.zones[extraExpressionId];
               //  console.log('O', extraExpressionId, zone, entry);
               branchNavigator = this.exitScope(
                  uid, i, zone, scopeExitType, paramsIdentifier
               );
               break;
            case TraceEvents.I:
               zone = this.getZoneByUID(bale, zale, uid);
               const extraZone = zale.zones[extraExpressionId];
               //  console.log('I', zone, extraExpressionId, extraZone);
               branchNavigator = this.enterScope(
                  uid, i, zone, tryBlockType, extraZone, paramsIdentifier
               );
               break;
            case TraceEvents.R:
            case TraceEvents.E:
            case TraceEvents.P:
            case TraceEvents.D:
            default:
               ignore = true;
         }
         
         zone = zone ?? zale.zones[entry.extraExpressionId];
         
         if (scopeType === ScopeTypes.P) {
            if (traceEventType === TraceEvents.I) {
               this.setProgramStartTimelineI(i);
               this.programUID(zone);
            } else {
               this.setProgramEndTimelineI(i);
            }
            
         } else {
            // console.log(entry);
         }
         
         if (!zone) {
            continue;
         }
         const getBranchNavigator = () => branchNavigator;
         
         this.locLiveZoneActiveDecorationsPush(
            zone, logValues, locToMonacoRange, getBranchNavigator
         );
      }
      
      this.setLastTimelineLength((scr.timeline.length || 1) - 1);
      // todo: adds anchors deltas, group locs by anchor,
      //  and pass only delta anchors to afterTC, then render in RALE
      const locLiveZoneActiveDecorations =
         this.getLocLiveZoneActiveDecorations();
      if (monacoEditor) {
         const activeIds = monacoEditor.deltaDecorations?.(
            ref?.current?.activeIds ?? [],
            locLiveZoneActiveDecorations
         );
         
         if (ref?.current) {
            ref.current.activeIds = activeIds;
         }
         
         activeIds.forEach((id, i) => {
            timelineDataDelta[id] = {
               i,
               data: locLiveZoneActiveDecorations[i],
            }
         });
         
      }
      contentWidgetManager?.onDecorationsChange(ref?.current?.activeIds ?? [], locLiveZoneActiveDecorations);
      
      this._getActiveZoneByDecorationId = (id) => {
         const i = (ref?.current?.activeIds ?? []).indexOf(id);
         if (i < 0) {
            return null;
         }
         
         return locLiveZoneActiveDecorations[i];
      };
      
      afterTraceChange?.(
         scr.timeline, isTraceReset, timelineDataDelta, [from, to], this.getProgramEndTimelineI(), values
      );
   };
   
   handleMouseActionDecoration = (mouseActionDecorations) => {
      if (!this.aleInstance) {
         return;
      }
      
      const {
         dale
      } = this.aleInstance.getModel();
      
      if (!dale?.locToMonacoRange) {
         return;
      }
      
      
      const zoneDecorations = [];
      mouseActionDecorations.forEach(decoration => {
         const zoneDecoration = this._getActiveZoneByDecorationId?.(decoration.id);
         const zone = zoneDecoration?.zone;
         zone?.locLiveZones.getHighlights().forEach(loc => {
            zoneDecorations.push({
               options: ZoneDecorationType.resolveType(
                  zone, LiveZoneDecorationStyles.hover
               ),
               range: dale.locToMonacoRange(loc),
            });
         });
      });
      
      return zoneDecorations;
   };
}

export default function decorateALEExpressions(
   aleInstance,
   monaco,
   monacoEditor,
   onDecorationsReady,
   onViewZoneChange
) {
   const locToMonacoRange = configureLocToMonacoRange(monaco);
   
   const contentWidgetManager = new ContentWidgetManager(
      monacoEditor,
      monaco,
      aleInstance.branchNavigatorManager?.handleMouseActionDecoration
   );
   
   const dale = {
      monaco,
      monacoEditor,
      onChangeLocLiveZoneDecorations: null,
      ref: {
         current: {
            decorations: [],
            ids: [],
            activeIds: [],
         }
      },
      getAleInstance: () => aleInstance,
      contentWidgetManager,
      getCode: () => monacoEditor.getValue(),
      locToMonacoRange,
      activeDecorationIdsRef: {current: []},
      viewZoneIdsRef: {
         onViewZoneDOMChange: makeOnViewZoneDOMChange(onViewZoneChange),
      },
      updateMonacoEditorViewZones: () => {
         updateMonacoEditorViewZones(monacoEditor, dale.viewZoneIdsRef);
      },
      resetMonacoEditorViewZones: () => {
         resetMonacoEditorViewZones(monacoEditor, dale.viewZoneIdsRef);
      },
      enableMonacoEditorViewZones: () => {
         dale.updateMonacoEditorViewZones();
         dale.updateMonacoEditorViewZonesDisposer =
            dale.monacoEditor.onDidChangeModelContent(
               dale.updateMonacoEditorViewZones
            );
         
         dale.resetMonacoEditorViewZonesDisposer =
            dale.monacoEditor.onDidChangeModel(dale.resetMonacoEditorViewZones);
         
         dale.disableMonacoEditorViewZones = () => {
            dale.resetMonacoEditorViewZones();
            dale.updateMonacoEditorViewZonesDisposer?.dispose();
            dale.resetMonacoEditorViewZonesDisposer?.dispose();
            dale.updateMonacoEditorViewZonesDisposer = null;
            dale.resetMonacoEditorViewZonesDisposer = null;
         };
         
         return dale.disableMonacoEditorViewZones;
         
      },
      disableMonacoEditorViewZones: () => {
         // set by enableMonacoEditorViewZones
      },
   };
   
   dale.setOnChangeLocLiveZoneDecorations = (onChangeLocLiveZoneDecorations) => {
      dale.onChangeLocLiveZoneDecorations = onChangeLocLiveZoneDecorations;
      dale.onChangeLocLiveZoneDecorations?.(
         dale.ref
      );
   };
   
   dale.onDidChangeModelContentDisposer =
      dale.monacoEditor.onDidChangeModelContent(aleInstance.handleChangeContent);
   
   dale.reset = (isModelChange) => {
      if (!isModelChange) {
         dale.monacoEditor.deltaDecorations?.(
            dale.ref.current?.ids ?? [], []
         );
         dale.monacoEditor.deltaDecorations?.(
            dale.ref.current?.activeIds ?? [], []
         );
      }
      
      dale.ref.current = {
         decorations: [],
         ids: [],
         activeIds: [],
      };
   };
   
   dale.onDidDisposeDisposer = monacoEditor.onDidDispose(dale.reset);
   dale.onDidChangeModelDisposer = monacoEditor.onDidChangeModel(
      () => {
         dale.reset(true);
         aleInstance.handleChangeContent();
      }
   );
   
   dale.dispose = () => {
      dale.reset();
      dale.contentWidgetManager?.unobserve();
      dale.onDidChangeModelContentDisposer?.dispose();
      dale.onDidChangeModelDisposer?.dispose();
      dale.onDidDisposeDisposer?.dispose();
   };
   
   dale.onContentChange = () => {
      const {zale} = aleInstance.getModel();
      if (!zale?.zones) {
         return;
      }
      
      const locLiveZoneDecorations = [];
      zale.zones.forEach(zone => {
         const options = ZoneDecorationType.resolveType(zone);
         zone.locLiveZones.getHighlights().forEach(loc => {
            locLiveZoneDecorations.push({
               options,
               range: dale.locToMonacoRange(loc),
            });
         });
      });
      
      for (const importSource in zale.importZones) {
         zale.importZones[importSource].forEach(zone => {
            const options = ZoneDecorationType.resolveType(zone);
            zone.locLiveZones.getHighlights().forEach(loc => {
               locLiveZoneDecorations.push({
                  options,
                  range: dale.locToMonacoRange(loc),
               });
            });
         });
      }
      
      const ids = dale.monacoEditor.deltaDecorations?.(
         dale.ref.current?.ids ?? [], locLiveZoneDecorations
      );
      
      const activeIds = dale.monacoEditor.deltaDecorations?.(
         dale.ref.current?.activeIds ?? [], []
      );
      
      if (dale.ref) {
         dale.ref.current = {
            decorations: locLiveZoneDecorations,
            ids,
            activeIds,
         };
      }
      
      dale.onChangeLocLiveZoneDecorations?.(
         dale.ref ?? {}
      );
   };
   
   dale.reset();
   dale.contentWidgetManager.observe();
   return dale;
}
