"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var Timeline_1 = __importDefault(require("@mui/lab/Timeline"));
var TimelineItem_1 = __importDefault(require("@mui/lab/TimelineItem"));
var TimelineSeparator_1 = __importDefault(require("@mui/lab/TimelineSeparator"));
var TimelineConnector_1 = __importDefault(require("@mui/lab/TimelineConnector"));
var TimelineContent_1 = __importDefault(require("@mui/lab/TimelineContent"));
var TimelineDot_1 = __importDefault(require("@mui/lab/TimelineDot"));
var ArtifactContext_1 = require("./ArtifactContext");
var IdiomaticContext_1 = require("./IdiomaticContext");
function IdiomaticIndicator(_a) {
    var idiomaticIndicatorShape = _a.idiomaticIndicatorShape;
    var interactionType = idiomaticIndicatorShape.interactionType;
    var idiomaticArtifacts = (0, IdiomaticContext_1.useIdiomaticContext)().idiomaticArtifacts;
    var activeArtifacts = (0, react_1.useMemo)(function () {
        return (0, IdiomaticContext_1.fromShapesToShapes)([idiomaticIndicatorShape], idiomaticArtifacts)[idiomaticIndicatorShape.id];
    }, [idiomaticIndicatorShape, idiomaticArtifacts]);
    var searchState = (0, ArtifactContext_1.useArtifactContext)().searchState;
    var handleChangePartialSearchValue = searchState.handleChangePartialSearchValue;
    var _b = (0, react_1.useState)(0), currentArtifactI = _b[0], setCurrentArtifactId = _b[1];
    var searchStateUpdate = (0, react_1.useCallback)(function () {
        if (interactionType !== IdiomaticContext_1.InteractionType.Simulation) {
            return;
        }
        var artifact = activeArtifacts[currentArtifactI];
        if (!artifact) {
            console.log("artifact", { activeArtifacts: activeArtifacts, currentArtifactI: currentArtifactI });
            return;
        }
        var stringObj = artifact.artifactCommand;
        var searchStateUpdate = JSON.parse(stringObj);
        handleChangePartialSearchValue(searchStateUpdate);
    }, [currentArtifactI, activeArtifacts, handleChangePartialSearchValue]);
    (0, react_1.useEffect)(function () {
        if (currentArtifactI !== 0) {
            return;
        }
        var tid = setTimeout(function () {
            searchStateUpdate();
        }, 60);
        return function () { return clearTimeout(tid); };
    }, [currentArtifactI, searchStateUpdate]);
    return ((0, jsx_runtime_1.jsx)(Timeline_1.default, { children: activeArtifacts.map(function (_a, i) {
            var id = _a.id, titleMarkdownString = _a.titleMarkdownString, contentMarkdownString = _a.contentMarkdownString, artifactType = _a.artifactType, artifactCommand = _a.artifactCommand;
            return ((0, jsx_runtime_1.jsxs)(TimelineItem_1.default, { children: [(0, jsx_runtime_1.jsxs)(TimelineSeparator_1.default, { children: [(0, jsx_runtime_1.jsx)(TimelineDot_1.default, {}), (0, jsx_runtime_1.jsx)(TimelineConnector_1.default, {})] }), (0, jsx_runtime_1.jsx)(TimelineContent_1.default, { children: titleMarkdownString })] }, id));
        }) }));
}
exports.default = IdiomaticIndicator;
//# sourceMappingURL=IdiomaticIndicator.js.map