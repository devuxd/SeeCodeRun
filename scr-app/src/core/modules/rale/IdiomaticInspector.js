import isFunction from "lodash/isFunction";
import {isNode} from '../../../utils/scrUtils';
import {ReactElementRefTree} from "../idiomata/idiosyncrasies/ReactAPI";
import {SupportedApis} from "../idiomata/Idiomata";

export const graphicalQueryApis = {};


//https://stackoverflow.com/questions/22473532/compare-two-dom-elements-using-xpath
// var wgxpath = require('wgxpath');
// var jsdom = require('jsdom');
//
// var url = 'http://www.merriam-webster.com/word-of-the-day/';
// var expressionString = '//*[@id="content"]/div[3]/ul/li[1]/strong';
//
// jsdom.env({
//     html: url,
//     done: function(errors, window) {
//         wgxpath.install(window);
//         var expression = window.document.createExpression(expressionString);
//         var result = expression.evaluate(window.document,
//             wgxpath.XPathResultType.STRING_TYPE);
//         console.log('The Word of the Day is "' + result.stringValue + '."');
//     }
// });
// html2canvas(document.querySelector("#capture")).then(canvas => {
//     document.body.appendChild(canvas)
// });

graphicalQueryApis[SupportedApis.standard] = {
    isNode: (...p) => isNode(...p),
    query: (obj) => {
        return [obj];
    },
    liveQuery: (obj, apiObject) => {
        return [apiObject?.getElementById?.(obj?.id)];
    },
};


const toArray = (obj) => {
    const array = [];
    for (let i = 0; i < obj?.length; i++) {
        array[i] = obj[i];
    }
    return array;
};

graphicalQueryApis[SupportedApis.jQuery] = {
    isNode: value => {
        // console.log(SupportedApis.jQuery, value);
        if (!value?.constructor?.name === SupportedApis.jQuery) {
            return false;
        }

        if (!value?.selector) {
            return false;
        }

        return value?.length > -1;
    },
    query: (obj) => {
        return toArray(obj);
    },
    liveQuery: (obj, apiObject) => {
        return toArray(apiObject?.(obj?.selector));
    },
};


const reactQuery = (obj) => {
    return [obj?.ref?.current];
}

graphicalQueryApis[SupportedApis.React] = {
    isNode: (value) => {
        return (value?.$$typeof?.toString?.() === 'Symbol(react.element)'); //&& (value.type && !isFunction(value.type))
        // if(value?.$$typeof === 'Symbol(react.element)'){
        //     console.log("vvvv", value.$$typeof?.toString() );
        // // === 'Symbol(react.element)'
        //     return true;
        // }
    },
    query: reactQuery,
    liveQuery: (obj, apiObject) => {
        return reactQuery(obj);
    },
    makeElementTree: (components) => {
        return new ReactElementRefTree(components);
    },
};


export class GraphicalIdiom {
    static isNode(...p) {
        return Object.keys(SupportedApis).find(apiName => graphicalQueryApis[apiName].isNode(...p));
    }

    static graphicalQuery(element, apiName) {
        return graphicalQueryApis[apiName]?.query(element);
    }

    static graphicalLiveQuery(element, apiName, apiObject) {
        return graphicalQueryApis[apiName]?.liveQuery(element, apiObject);
    }

    static makeElementTree(components, apiName) {
        return graphicalQueryApis[apiName]?.makeElementTree?.(components); // only React so far
    }
}


export class ApiPattern {
    name;
    rationale;
}

export class Idiom {
    name;
    rationale;
    expressions;
    barriers;
}

export class IdiomaticKnowledge {
    idiom
    apiName;

}


export const filterVisualElementsByApiName = (visualElements, visualElementsApiNames, apiName) => {
    const elements = [];
    visualElementsApiNames?.forEach((visualElementApiName, i) => {
        if (visualElementApiName === apiName) {
            elements.push(visualElements?.[i]);
        }
    });
    return elements;
};
