import JSAN from 'jsan';
import {Subject} from 'rxjs/Subject';
import isString from 'lodash/isString';
import isObjectLike from 'lodash/isObjectLike';
import isArrayLike from 'lodash/isArrayLike';
import {isNode, /*createObjectIterator, hasChildNodes,*/ copifyDOMNode} from '../../utils/scrUtils';

let listener = null;
export const listen =(lis)=>{
    listener = lis;
};

let dispatcher = null;
export const dispatch =(action)=>{
    dispatcher && dispatcher(action);
};


const obsConfig = {attributes: true, childList: true};

// Callback function to execute when mutations are observed
const obsCallback = function (mutationsList) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
         //   console.log('A child node has been added or removed.');
        }
        else if (mutation.type === 'attributes') {
       //     console.log('The ' + mutation.attributeName + ' attribute was modified.');
        }
    }
};


// const objectIterator = createObjectIterator();

class Scope {
    constructor(parent, id) {
        this.parent = parent;
        this.id = id;
        this.state = 'entered';
        this.scopes = [];
        this.isLocal = false;
        this.localId = null;
    }

    enterScope(id) {
        const newScope = new Scope(this, id);
        this.scopes.push(newScope);
        return newScope;
    }

    exitScope(id) {
        if (this.id !== id) {
            // console.log("errrror", id);
        }
        if (!this.scopes.length) {
            this.state = 'exited';
            return this.parent;
        }
        return this.scopes.pop();
    }

}

class Trace {
    constructor(locationMap) {
        this.locationMap = locationMap;
        this.currentScope = null;
        this.rootScope = null;
        this.subject = new Subject();
        this.currentExpressionId = null; // program
        this.startTimestamp = null;
        this.magicTag = null;
        this.window = null;
        this.consoleLog = null;
        this.realConsoleLog = null;
        this.timeline = [];
        this.dataRefs = [];
        this.dataRefMatches = [];
        this.funcRefs = [];
        this.funcRefMatches = [];
        this.isValid = false;
    }

    configureWindow(runIframe, autoLogName, preAutoLogName, postAutoLogName) {
        this.startTimestamp = Date.now();
        this.magicTag = `<<[[{{|${this.startTimestamp}|}}]]>>`;
        this.startStack();
        this.setWindowRoots(runIframe.contentWindow);

        runIframe.contentWindow[autoLogName] = this.autoLog;
        runIframe.contentWindow[preAutoLogName] = this.preAutoLog;
        runIframe.contentWindow[postAutoLogName] = this.postAutoLog;
        runIframe.contentWindow.onerror = this.onError;
        runIframe.contentWindow.console.log = this.consoleLog;
        this.domNodesObs = [];
        this.domNodes = [];
        //todo save before dispose
        this.timeline = [];
        this.timelineLength = 0;
        this.timeline = [];
        this.dataRefs = [];
        this.dataRefMatches = [];
        this.funcRefs = [];
        this.funcRefMatches = [];
        this.subject.next(this.timeline);
        clearInterval(this.tli);
        this.tli = setInterval(() => {
            if (this.timelineLength !== this.timeline.length) {
                this.timelineLength = this.timeline.length;
                this.subject.next([...this.timeline]);
            }
        }, 1000);
        this.isValid = true;
    }

    setWindowRoots(contentWindow) {
        this.realConsoleLog = contentWindow.console.log;
        this.setConsoleLog(contentWindow.console.log);
        this.window = contentWindow;
    }


    getData(id) {
        return {id: id};
    }

    subscribe(callback) {
        this.unsubsubscribe = this.subject.subscribe(callback);
    }

    unsubscribe() {
        if (this.subject) {
            this.subject.complete();
        }
    }

    getCurrentStackIds() {
        const stack = [];
        let current = this.currentScope;

        do {
            stack.unshift(current.id);
            current = current.parent;
        } while (current);

        return stack;
    }

    locateStack(stack) {
        console.log('>>>>>>>>>>>>>');//, this.locationMap, stack);
        for (const i in stack) {
            if (stack[i] >= 0) {
                console.log(i, this.locationMap[stack[i]].loc);
            } else {
                console.log(i, 'root');
            }
        }

    }

    startStack() {
        this.rootScope = this.currentScope = new Scope(null, -1);
    }

    getWindowRoots = () => {
        let windowRoots = {};
        try {
            windowRoots = {
                window: this.window,
                document: this.window.document,
                body: this.window.document.body,
                log: this.consoleLog,
            };
        } catch (e) {
        }
        return windowRoots;
    };

    getReactKey(i) {
        return `${this.startTimestamp};${i}`;
    }


    getReplacer = (res = {isDOM: false}) => {
        const windowRoots = this.getWindowRoots();
        return (key, value) => {
            const i = Object.values(windowRoots).indexOf(value);
            if (i > -1) {
                return `${this.magicTag}${Object.keys(windowRoots)[i]}`;
            }
            if (isNode(value)) {
                const val = copifyDOMNode(value);
                const domId = this.domNodes.indexOf(value);
                if (domId >= 0) {
                    val.liveRef = `${this.magicTag}${domId}`;
                } else {
                    this.domNodes.push(value);
                    val.liveRef = `${this.magicTag}${this.domNodes.length - 1}`;
                    // Create an observer instance linked to the callback function
                    const observer = new MutationObserver(obsCallback);
                    // Start observing the target node for configured mutations
                    observer.observe(value, obsConfig);
                    this.domNodesObs.push(observer);
                }
                res.isDOM = true;
                return val;
            }
            return value;
        };
    };

    parseLiveRefs = (data, hideLiveRefs) => {
        let liveRef = this.reinstateLiveRef(data);
        if ((!liveRef.isReinstate) && isObjectLike(data)) {
            if (isArrayLike(data)) {
                for (const i in data) {
                    const aLiveRef = this.reinstateLiveRef(data[i]);
                    (aLiveRef.isReinstate) && (data[i] = (hideLiveRefs ? aLiveRef.hiddenMessage : aLiveRef.ref));
                }
            } else {
                for (const i in Object.values(data)) {
                    const aLiveRef = this.reinstateLiveRef(data[i]);
                    (aLiveRef.isReinstate) && (data[Object.keys(data)[i]] = (hideLiveRefs ? aLiveRef.hiddenMessage : aLiveRef.ref));
                }
            }
        }
        return {
            isLive: liveRef.isLive || liveRef.isReinstate,
            data: liveRef.isReinstate ? (hideLiveRefs ? liveRef.hiddenMessage : liveRef.ref) : data,
        };
    };

    reinstateLiveRef = (data) => {
        const windowRoots = this.getWindowRoots();

        let liveRefId = isString(data) && data.startsWith(this.magicTag) ? data.replace(this.magicTag, '') : null;

        let index = Object.values(windowRoots).indexOf(data);
        const windowRoot = index < 0 && liveRefId ? liveRefId : null;
        let liveRef = windowRoots[windowRoot];

        if (!liveRef && this.domNodes) {
            index = this.domNodes.indexOf(data);
            if (index < 0 && liveRefId) {
                const domId = parseInt(liveRefId, 10);
                liveRef = this.domNodes[domId];
            }
        } else {
            liveRefId = windowRoot;
        }

        return {
            isLive: index > -1,
            isReinstate: !!liveRef,
            refId: liveRefId,
            hiddenMessage: `[${liveRefId}]:live expression disabled`,
            ref: liveRef,
        };
    };

    pushEntry = (pre, value, post, type, refId) => {
        let dataType = 'jsan';
        let res = {};
        const data = JSAN.stringify(value, this.getReplacer(res), null, true);
        let objectClassName = value && value.constructor && value.constructor.name;
        //this.subject.next({id: pre.id, loc: this.locationMap[pre.id].loc, dataType: dataType, data: data});
        const i = this.timeline.length;
        const expression = this.locationMap[pre.id];
        if (!expression) {
            return;
        }

        const dataRefId = this.funcRefs.indexOf(data);
        if (dataRefId < 0) {
            this.dataRefs.push(data);
            this.dataRefMatches.push({[pre.id]:1});
        } else {
            this.dataRefMatches[dataRefId][pre.id] = (this.dataRefMatches[dataRefId][pre.id]||0) +1;
        }

        this.timeline.unshift({
            ...pre,
            i: i,
            reactKey: this.getReactKey(i),
            loc: expression.loc,
            expressionType: expression.expressionType,
            dataType: dataType,
            data: data,
            isDOM: res.isDOM,
            objectClassName: objectClassName,
            timestamp: Date.now(),
            dataRefId: dataRefId,
            funcRefId: refId,
            value: value
        });
    };

    getMatches=(funcRefId, dataRefId)=>{
        const funcMatches= Object.keys(this.funcRefMatches[funcRefId]||{}).map(key=>this.locationMap[key].loc);
        if(funcMatches.length){
            return funcMatches;
        }else{
            const dataMatches= Object.keys(this.dataRefMatches[dataRefId]||{}).map(key=>this.locationMap[key].loc);
            if(dataMatches.length){
                return dataMatches;
            }else{
                return null;
            }
        }
    };

    findPreviousOccurrence = (id) => {
        for (let i = this.timeline.length - 1; i > -1; i--) {
            if (this.timeline[i].id === id) {
                return this.timeline[i];
            }
        }
        return null;
    };

    composedExpressions = {
        MemberExpression: (pre, value, post, type, extraIds, areNew, extraValues) => {
            const objectData = areNew[0] ? extraValues[0] : this.findPreviousOccurrence(extraIds[0]).value;
            const propertyData = areNew[1] ? extraValues[1] : this.findPreviousOccurrence(extraIds[1]).value;
            // console.log(pre, value, post, type, extraIds, areNew, extraValues);
            areNew[0] && this.pushEntry({id: extraIds[0]}, objectData, post, type);
            areNew[1]  && !isString(propertyData) && this.pushEntry({id: extraIds[1]}, propertyData, post, type);
            if (objectData === undefined || objectData === null) {
                const errorMessage = `: accessing property of invalid reference: ${objectData}`;
                this.pushEntry({
                    id: extraIds[0], isError: true, errorMessage: errorMessage,
                    errorLoc: this.locationMap[extraIds[0]].loc
                }, objectData, post, type);
                throw errorMessage;
            }

            if (propertyData === undefined || propertyData === null ||
                propertyData === 'undefined' || propertyData === 'null') {
                const errorMessage = `: referencing invalid property: ${propertyData}`;
                this.pushEntry(
                    {
                        id: extraIds[1], isError: true, errorMessage: errorMessage,
                        errorLoc: this.locationMap[extraIds[1]].loc
                    }, propertyData, post, type);
                throw errorMessage;
            }
            //console.log(objectData[propertyData]("x"));
           // return objectData[propertyData];
            // value;
        },
        BinaryExpression: (pre, value, post, type, extraIds, areNew, extraValues) => {
            const leftData = areNew[0] ? extraValues[0] : this.findPreviousOccurrence(extraIds[0]).value;
            const rightData = areNew[1] ? extraValues[1] : this.findPreviousOccurrence(extraIds[1]).value;
            areNew[0] && this.pushEntry({id: extraIds[0]}, leftData, post, type);
            areNew[1] && this.pushEntry({id: extraIds[1]}, rightData, post, type);
          //  return value;
        },
        CallExpression: (pre, value, post, type, extraIds, areNew, extraValues) => {
            //console.log(pre, value, post, type, extraIds, areNew, extraValues);

            let funcRefId = this.funcRefs.indexOf(extraValues[0]);
            if (funcRefId < 0) {
                funcRefId = this.funcRefs.length;
                this.funcRefs.push(extraValues[0]);
                this.funcRefMatches.push({[pre.id]:1});
            } else {
                this.funcRefMatches[funcRefId][pre.id] = (this.funcRefMatches[funcRefId][pre.id]||0) +1;
            }
           return funcRefId;
        },
        // NewExpression: (ast, locationMap, getLocationId, path) => {
        // },
        // FunctionExpression: (ast, locationMap, getLocationId, path) => {
        // },
    };

    autoLog = (pre, value, post, type, extraIds, areNew, extraValues) => {
        // let c = this.checkNonHaltingLoop(this.timeline.length>10);
        //  console.log(pre.id, value);
        // console.log(pre, value, post, type, extraIds, areNew, extraValues);
        let refId= null;
        if (this.composedExpressions[type]) {
            refId=this.composedExpressions[type](pre, value, post, type, extraIds, areNew, extraValues);
        } else {
            //blocks
            // console.log(pre.id, value);
        }
        // console.log(value);
        this.pushEntry(pre, value, post, type, refId);
        // console.log(val, val("x"));
        return {_: value};
    };

    preAutoLog = (id) => {
        this.currentExpressionId = id;
        this.currentScope = this.currentScope.enterScope(id);
        return {id};
    };

    postAutoLog = (id) => {
        //console.log(id, JSAN.parse(JSAN.stringify(this.rootScope)));
        //this.locateStack(this.getCurrentStackIds());
        this.currentScope = this.currentScope.exitScope(id);
        return {id: id};
    };

    onError = error => {
        let i = this.timeline.length;
        const expression = this.locationMap[this.currentExpressionId]||{};
        this.timeline.unshift({
            i: i,
            reactKey: this.getReactKey(i),
            isError: true,
            id: this.currentExpressionId,
            loc: expression.loc,
            expressionType: expression.expressionType,
            data: JSAN.stringify(error, null, null, true),
            timestamp: Date.now(),
        });
    };

    setConsoleLog = log => {
        this.consoleLog = function (type, info = {}, params = []) {
            if (type === 'SCR_LOG' && info.location) {
                // store.dispatch();
                log(["SCR", ...arguments]);
            } else {
                log(["clg", ...arguments]);
            }

        };
    };

    // resolveAfter2Seconds(x) {
    //     return new Promise(resolve => {
    //         setTimeout(() => {
    //             resolve(x);
    //         }, 2000);
    //     });
    // }

    // checkNonHaltingLoop = async (loopCount) => {
    //     console.log(loopCount);
    //     if (loopCount) {
    //         let cancel = await this.resolveAfter2Seconds(true);
    //         if (cancel) {
    //             throw 'Boom';
    //         }
    //     } else {
    //         console.log('noy');
    //
    //         await 0;
    //     }
    //     await 0;
    // };

}

export default Trace;
