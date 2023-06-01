import React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(
   props,
   ref
) {
   return <Slide direction="up" ref={ref}  {...props} />;
});

const steps = [
   'Explore program state',
   'Search in program state',
   'Navigate program execution branches',
   'Locate graphical elements',
];

const links = [
   'mvl_zHwIBeA',
   'XEt09iK8IXs',
   'https://www.youtube.com/watch?v=mvl_zHwIBeA',
   'https://www.youtube.com/watch?v=mvl_zHwIBeA',
];


export function Demo({onClose}) {
   const [activeStep, setActiveStep] = React.useState(0);
   const [completed, setCompleted] = React.useState({});
   
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
   
   const handleStep = (step) => () => {
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
            {steps.map((label, index) => (
               <Step key={label} completed={completed[index]}>
                  <StepButton color="inherit" onClick={handleStep(index)}>
                     {label}
                  </StepButton>
               </Step>
            ))}
         </Stepper>
         <div>
            {allStepsCompleted() ? (
               <React.Fragment>
                  <Typography sx={{mt: 2, mb: 1}}>
                     All steps completed - you&apos;re finished
                  </Typography>
                  <Box sx={{display: 'flex', flexDirection: 'row', pt: 2}}>
                     <Box sx={{flex: '1 1 auto'}}/>
                     <Button onClick={handleReset}>Reset</Button>
                  </Box>
               </React.Fragment>
            ) : (
               <React.Fragment>
                  {/*<Typography sx={{mt: 2, mb: 1, py: 1}}>*/}
                  {/*   Step {activeStep + 1}*/}
                  {/*</Typography>*/}
                  {/*<video width="100%" height="100%" controls >*/}
                  {/*   <source src={links[activeStep]} type="video/mp4"/>*/}
                  {/*</video>*/}
                  <Box sx={{pt: 3, pl: 1, pr: 1}}>
                     <iframe
                        style={{
                           border: 0,
                           minHeight: 600,
                           width: "100%",
                           height: "100%",
                        }}
                        src={`https://www.youtube.com/embed/${links[activeStep]}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Embedded youtube"
                     />
                  </Box>
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
                     <Button onClick={isLastStep()? onClose:handleNext} sx={{mr: 1}}>
                        {isLastStep() ? "Finish" : "Next"}
                     </Button>
                     {/*{activeStep !== steps.length &&*/}
                     {/*   (completed[activeStep] ? (*/}
                     {/*      <Typography variant="caption"*/}
                     {/*                  sx={{display: 'inline-block'}}>*/}
                     {/*         Step {activeStep + 1} already completed*/}
                     {/*      </Typography>*/}
                     {/*   ) : (*/}
                     {/*      <Button onClick={handleComplete}>*/}
                     {/*         {completedSteps() === totalSteps() - 1*/}
                     {/*            ? 'Finish'*/}
                     {/*            : 'Complete Step'}*/}
                     {/*      </Button>*/}
                     {/*   ))}*/}
                  </Box>
               </React.Fragment>
            )}
         </div>
      </Box>
   );
}

export default function DialogDemo({open, handleClose}) {
   return (
      <Dialog
         onClose={handleClose}
         open={open}
         TransitionComponent={Transition}
         fullWidth={true}
         maxWidth={"lg"}
      >
         <DialogTitle> seeCode.run demo</DialogTitle>
         <DialogContent>
            <Demo  onClose={handleClose}/>
         </DialogContent>
      </Dialog>
   );
}
