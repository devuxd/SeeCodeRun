"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdiomaticPlan = exports.IdiomaticAction = exports.IdiomaticPlanStepper = exports.IdiomaticActionStepper = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var react_markdown_1 = __importDefault(require("react-markdown"));
var Box_1 = __importDefault(require("@mui/material/Box"));
var Stepper_1 = __importDefault(require("@mui/material/Stepper"));
var Step_1 = __importDefault(require("@mui/material/Step"));
var StepButton_1 = __importDefault(require("@mui/material/StepButton"));
var StepContent_1 = __importDefault(require("@mui/material/StepContent"));
var Typography_1 = __importDefault(require("@mui/material/Typography"));
var StepLabel_1 = __importDefault(require("@mui/material/StepLabel"));
var Button_1 = __importDefault(require("@mui/material/Button"));
var Paper_1 = __importDefault(require("@mui/material/Paper"));
var IdiomaticIndicator_1 = __importDefault(require("./IdiomaticIndicator"));
var IdiomaticContext_1 = require("./IdiomaticContext");
// const links = [
//     'mvl_zHwIBeA',
//     'XEt09iK8IXs',
//     'https://www.youtube.com/watch?v=mvl_zHwIBeA',
//     'https://www.youtube.com/watch?v=mvl_zHwIBeA',
// ];
function IdiomaticActionStepper(_a) {
    var knowledgeType = _a.knowledgeType, steps = _a.steps, activeStep = _a.activeStep, setActiveStep = _a.setActiveStep;
    var handleNext = function () {
        setActiveStep(function (prevActiveStep) { return prevActiveStep + 1; });
    };
    var handleBack = function () {
        setActiveStep(function (prevActiveStep) { return prevActiveStep - 1; });
    };
    var handleReset = function () {
        setActiveStep(0);
    };
    // console.log("IdiomaticActionStepper", steps);
    return ((0, jsx_runtime_1.jsxs)(Box_1.default, { sx: { maxWidth: 400 }, children: [(0, jsx_runtime_1.jsx)(Stepper_1.default, { activeStep: activeStep, orientation: "vertical", children: steps.map(function (idiomaticIndicatorShape, index) { return ((0, jsx_runtime_1.jsxs)(Step_1.default, { children: [(0, jsx_runtime_1.jsx)(StepLabel_1.default, { optional: index === 2 ? ((0, jsx_runtime_1.jsx)(Typography_1.default, { variant: "caption", children: "Last step" })) : null, children: idiomaticIndicatorShape.titleMarkdownString }), (0, jsx_runtime_1.jsxs)(StepContent_1.default, { children: [(0, jsx_runtime_1.jsx)(react_markdown_1.default, { children: idiomaticIndicatorShape.contentMarkdownString }), (0, jsx_runtime_1.jsx)(IdiomaticIndicator_1.default, { idiomaticIndicatorShape: idiomaticIndicatorShape }), (0, jsx_runtime_1.jsx)(Box_1.default, { sx: { mb: 2 }, children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(Button_1.default, { variant: "contained", onClick: handleNext, sx: { mt: 1, mr: 1 }, children: index === steps.length - 1 ? 'Finish' : 'Continue' }), (0, jsx_runtime_1.jsx)(Button_1.default, { disabled: index === 0, onClick: handleBack, sx: { mt: 1, mr: 1 }, children: "Back" })] }) })] })] }, idiomaticIndicatorShape.id)); }) }), activeStep === steps.length && ((0, jsx_runtime_1.jsxs)(Paper_1.default, { square: true, elevation: 0, sx: { p: 3 }, children: [(0, jsx_runtime_1.jsx)(Typography_1.default, { children: "All steps completed" }), (0, jsx_runtime_1.jsx)(Button_1.default, { onClick: handleReset, sx: { mt: 1, mr: 1 }, children: "Reset" })] }))] }));
}
exports.IdiomaticActionStepper = IdiomaticActionStepper;
//HorizontalNonLinearStepper
function IdiomaticPlanStepper(_a) {
    var adjudicationType = _a.adjudicationType, steps = _a.steps, activeStep = _a.activeStep, setActiveStep = _a.setActiveStep, activeAction = _a.activeAction;
    var _b = react_1.default.useState({}), completed = _b[0], setCompleted = _b[1];
    var totalSteps = function () {
        return steps.length;
    };
    var completedSteps = function () {
        return Object.keys(completed).length;
    };
    var isLastStep = function () {
        return activeStep === totalSteps() - 1;
    };
    var allStepsCompleted = function () {
        return completedSteps() === totalSteps();
    };
    var handleNext = function () {
        var newActiveStep = isLastStep() && !allStepsCompleted()
            ? // It's the last step, but not all steps have been completed,
                // find the first step that has been completed
                steps.findIndex(function (step, i) { return !(i in completed); })
            : activeStep + 1;
        setActiveStep(newActiveStep);
    };
    var handleBack = function () {
        setActiveStep(function (prevActiveStep) { return prevActiveStep - 1; });
    };
    var handleStep = function (step) { return function () {
        setActiveStep(step);
    }; };
    var handleComplete = function () {
        var newCompleted = completed;
        newCompleted[activeStep] = true;
        setCompleted(newCompleted);
        handleNext();
    };
    var handleReset = function () {
        setActiveStep(0);
        setCompleted({});
    };
    return ((0, jsx_runtime_1.jsxs)(Box_1.default, { sx: { width: '100%' }, children: [(0, jsx_runtime_1.jsx)(Stepper_1.default, { nonLinear: true, activeStep: activeStep, children: steps.map(function (_a, index) {
                    var id = _a.id, titleMarkdownString = _a.titleMarkdownString;
                    return ((0, jsx_runtime_1.jsx)(Step_1.default, { completed: completed[index], children: (0, jsx_runtime_1.jsx)(StepButton_1.default, { color: "inherit", onClick: handleStep(index), children: titleMarkdownString }) }, id));
                }) }), (0, jsx_runtime_1.jsx)("div", { children: allStepsCompleted() ? ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsx)(Typography_1.default, { sx: { mt: 2, mb: 1 }, children: "All steps completed." }), (0, jsx_runtime_1.jsxs)(Box_1.default, { sx: { display: 'flex', flexDirection: 'row', pt: 2 }, children: [(0, jsx_runtime_1.jsx)(Box_1.default, { sx: { flex: '1 1 auto' } }), (0, jsx_runtime_1.jsx)(Button_1.default, { onClick: handleReset, children: "Reset" })] })] })) : ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsx)(IdiomaticAction, { idiomaticActionShape: activeAction }), (0, jsx_runtime_1.jsxs)(Box_1.default, { sx: { display: 'flex', flexDirection: 'row', pt: 2 }, children: [(0, jsx_runtime_1.jsx)(Button_1.default, { color: "inherit", disabled: activeStep === 0, onClick: handleBack, sx: { mr: 1 }, children: "Back" }), (0, jsx_runtime_1.jsx)(Box_1.default, { sx: { flex: '1 1 auto' } }), (0, jsx_runtime_1.jsx)(Button_1.default, { onClick: handleNext, sx: { mr: 1 }, children: "Next" }), activeStep !== steps.length &&
                                    (completed[activeStep] ? ((0, jsx_runtime_1.jsxs)(Typography_1.default, { variant: "caption", sx: { display: 'inline-block' }, children: ["Step ", activeStep + 1, " already completed"] })) : ((0, jsx_runtime_1.jsx)(Button_1.default, { onClick: handleComplete, children: completedSteps() === totalSteps() - 1
                                            ? 'Finish'
                                            : 'Complete Step' })))] })] })) })] }));
}
exports.IdiomaticPlanStepper = IdiomaticPlanStepper;
function IdiomaticAction(_a) {
    var idiomaticActionShape = _a.idiomaticActionShape;
    var _b = (0, react_1.useState)(0), activeStep = _b[0], setActiveStep = _b[1];
    var idiomaticIndicators = (0, IdiomaticContext_1.useIdiomaticContext)().idiomaticIndicators;
    var activeIndicators = (0, react_1.useMemo)(function () {
        return (0, IdiomaticContext_1.fromShapesToShapes)([idiomaticActionShape], idiomaticIndicators)[idiomaticActionShape.id];
    }, [idiomaticActionShape, idiomaticIndicators]);
    return ((0, jsx_runtime_1.jsx)(IdiomaticActionStepper, { steps: activeIndicators, knowledgeType: idiomaticActionShape.knowledgeType, activeStep: activeStep, setActiveStep: setActiveStep }));
}
exports.IdiomaticAction = IdiomaticAction;
function IdiomaticPlan(_a) {
    var adjudicationType = _a.adjudicationType, actions = _a.actions, rest = __rest(_a, ["adjudicationType", "actions"]);
    var _b = (0, react_1.useState)(0), activeStep = _b[0], setActiveStep = _b[1];
    var activeAction = (0, react_1.useMemo)(function () {
        return actions[activeStep];
    }, [actions, activeStep]);
    return ((0, jsx_runtime_1.jsx)(IdiomaticPlanStepper, __assign({}, rest, { activeAction: activeAction, steps: actions, adjudicationType: adjudicationType, activeStep: activeStep, setActiveStep: setActiveStep })));
}
exports.IdiomaticPlan = IdiomaticPlan;
//# sourceMappingURL=IdiomaticPlan.js.map