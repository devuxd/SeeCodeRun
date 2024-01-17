import React, {createContext, useContext, useMemo, useRef, useState} from 'react';
import Markdown from "react-markdown";

import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepContent from '@mui/material/StepContent';
import Typography from '@mui/material/Typography';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import IdiomaticIndicator from "./IdiomaticIndicator";
import {
    fromShapesToShapes,
    useIdiomaticContext,
    IdiomaticIndicator as IdiomaticIndicatorShape
} from "./IdiomaticContext";

// const links = [
//     'mvl_zHwIBeA',
//     'XEt09iK8IXs',
//     'https://www.youtube.com/watch?v=mvl_zHwIBeA',
//     'https://www.youtube.com/watch?v=mvl_zHwIBeA',
// ];

export function IdiomaticActionStepper(
    {
        knowledgeType,
        steps,
        activeStep,
        setActiveStep,
        onClose,
    }
) {

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    console.log("IdiomaticActionStepper", steps);

    return (
        <Box sx={{maxWidth: 400}}>
            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((idiomaticIndicatorShape: IdiomaticIndicatorShape, index) => (
                    <Step key={idiomaticIndicatorShape.id}>
                        <StepLabel
                            optional={
                                index === 2 ? (
                                    <Typography variant="caption">Last step</Typography>
                                ) : null
                            }
                        >
                            {idiomaticIndicatorShape.titleMarkdownString}
                        </StepLabel>
                        <StepContent>
                            <Markdown>{idiomaticIndicatorShape.contentMarkdownString}</Markdown>
                            <IdiomaticIndicator idiomaticIndicatorShape={idiomaticIndicatorShape}/>
                            <Box sx={{mb: 2}}>
                                <div>
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        sx={{mt: 1, mr: 1}}
                                    >
                                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                    </Button>
                                    <Button
                                        disabled={index === 0}
                                        onClick={handleBack}
                                        sx={{mt: 1, mr: 1}}
                                    >
                                        Back
                                    </Button>
                                </div>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
            {activeStep === steps.length && (
                <Paper square elevation={0} sx={{p: 3}}>
                    <Typography>All steps completed</Typography>
                    <Button onClick={handleReset} sx={{mt: 1, mr: 1}}>
                        Reset
                    </Button>
                </Paper>
            )}
        </Box>
    );
}


//HorizontalNonLinearStepper
export function IdiomaticPlanStepper(
    {
        adjudicationType,
        steps,
        activeStep,
        setActiveStep,
        onClose,
        activeAction
    }
) {
    const [completed, setCompleted] = React.useState<{
        [k: number]: boolean;
    }>({});

    const totalSteps = () => {
        return steps.length;
    };

    const completedSteps = () => {
        return Object.keys(completed).length;
    };

    const isLastStep = () => {
        return activeStep === totalSteps() - 1;
    };

    const allStepsCompleted = () => {
        return completedSteps() === totalSteps();
    };

    const handleNext = () => {
        const newActiveStep =
            isLastStep() && !allStepsCompleted()
                ? // It's the last step, but not all steps have been completed,
                  // find the first step that has been completed
                steps.findIndex((step, i) => !(i in completed))
                : activeStep + 1;
        setActiveStep(newActiveStep);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleStep = (step: number) => () => {
        setActiveStep(step);
    };

    const handleComplete = () => {
        const newCompleted = completed;
        newCompleted[activeStep] = true;
        setCompleted(newCompleted);
        handleNext();
    };

    const handleReset = () => {
        setActiveStep(0);
        setCompleted({});
    };

    return (
        <Box sx={{width: '100%'}}>
            <Stepper nonLinear activeStep={activeStep}>
                {steps.map(({id, titleMarkdownString}, index) => (
                    <Step key={id} completed={completed[index]}>
                        <StepButton color="inherit" onClick={handleStep(index)}>
                            {titleMarkdownString}
                        </StepButton>
                    </Step>
                ))}
            </Stepper>
            <div>
                {allStepsCompleted() ? (
                    <React.Fragment>
                        <Typography sx={{mt: 2, mb: 1}}>
                            All steps completed.
                        </Typography>
                        <Box sx={{display: 'flex', flexDirection: 'row', pt: 2}}>
                            <Box sx={{flex: '1 1 auto'}}/>
                            <Button onClick={handleReset}>Reset</Button>
                        </Box>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <IdiomaticAction onClose={onClose} idiomaticActionShape={activeAction}/>
                        <Box sx={{display: 'flex', flexDirection: 'row', pt: 2}}>
                            <Button
                                color="inherit"
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                sx={{mr: 1}}
                            >
                                Back
                            </Button>
                            <Box sx={{flex: '1 1 auto'}}/>
                            <Button onClick={handleNext} sx={{mr: 1}}>
                                Next
                            </Button>
                            {activeStep !== steps.length &&
                                (completed[activeStep] ? (
                                    <Typography variant="caption" sx={{display: 'inline-block'}}>
                                        Step {activeStep + 1} already completed
                                    </Typography>
                                ) : (
                                    <Button onClick={handleComplete}>
                                        {completedSteps() === totalSteps() - 1
                                            ? 'Finish'
                                            : 'Complete Step'}
                                    </Button>
                                ))}
                        </Box>
                    </React.Fragment>
                )}
            </div>
        </Box>
    );
}

export function IdiomaticAction({idiomaticActionShape, onClose}) {
    const [activeStep, setActiveStep] = useState(0);
    const {idiomaticIndicators} = useIdiomaticContext();
    const activeIndicators: IdiomaticIndicatorShape[] = useMemo(() => {
        return fromShapesToShapes([idiomaticActionShape], idiomaticIndicators)[idiomaticActionShape.id];
    }, [idiomaticActionShape, idiomaticIndicators]);

    return (<IdiomaticActionStepper
        onClose={onClose} steps={activeIndicators} knowledgeType={idiomaticActionShape.knowledgeType}
        activeStep={activeStep} setActiveStep={setActiveStep}
    />);
}

export function IdiomaticPlan({adjudicationType, actions, onClose, ...rest}) {
    const [activeStep, setActiveStep] = useState(0);
    const activeAction = useMemo(() => {
        return actions[activeStep];
    }, [actions, activeStep]);

    return (
        <IdiomaticPlanStepper
            {...rest}
            activeAction={activeAction}
            onClose={onClose} steps={actions} adjudicationType={adjudicationType}
            activeStep={activeStep} setActiveStep={setActiveStep}
        />
    );
}
