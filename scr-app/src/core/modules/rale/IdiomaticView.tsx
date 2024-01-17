import React, {createContext, useContext, useMemo, useRef, useState} from 'react';
import Markdown from "react-markdown";
import Draggable from 'react-draggable';

import Paper from '@mui/material/Paper';
import TrapFocus from '@mui/material/Unstable_TrapFocus';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';

import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';


import {fromShapesToShapes, isMorphism, useIdiomaticContext} from "./IdiomaticContext";
import {IdiomaticPlan} from "./IdiomaticPlan";


// const Transition = React.forwardRef(function Transition(
//     props,
//     ref
// ) {
//     return <Slide direction="up" ref={ref}  {...props} />;
// });

export default function IdiomaticView({open, handleClose, children}) {
    const {idiomaticPlans, idiomaticActions} = useIdiomaticContext();
    const activeIdiomaticPlans = useMemo(() => {
        return idiomaticPlans.filter(idiomaticPlan => idiomaticPlan.demoMode || idiomaticPlan.active);
    }, [idiomaticPlans]);

    const activePlanToActions = useMemo(() => {
        return fromShapesToShapes(activeIdiomaticPlans, idiomaticActions);
    }, [activeIdiomaticPlans, idiomaticActions]);


    // const nodeRef = useRef(null);
    const [bannerOpen, setBannerOpen] = React.useState(true);

    const closeBanner = () => {
        setBannerOpen(false);
    };

    // console.log("idiomaticContext", idiomaticPlans);
    // TransitionComponent={Transition}
    return (
        <React.Fragment>
            <TrapFocus open={open} disableAutoFocus disableEnforceFocus>
                <Fade appear={false} in={bannerOpen}>
                    {/*<Draggable*/}
                    {/*    nodeRef={nodeRef}*/}
                    {/*    // cancel={'[class*="MuiPaper-root"]'}*/}
                    {/*>*/}
                    <Paper
                        role="dialog"
                        aria-modal="false"
                        aria-label="Cookie banner"
                        square
                        variant="outlined"
                        tabIndex={10}
                        sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            m: 0,
                            p: 2,
                            borderWidth: 0,
                            borderTopWidth: 1,
                        }}


                    >
                        {/*<div style={{cursor: 'move'}}*/}
                        {/*     ref={nodeRef}>YOLO*/}
                        {/*</div>*/}
                        {activeIdiomaticPlans.map(idiomaticPlan => {
                            const {
                                adjudicationType,
                                id, titleMarkdownString, contentMarkdownString,
                                morphisms, done
                            } = idiomaticPlan;

                            return (
                                <Accordion key={id} defaultExpanded>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon/>}
                                        aria-controls="panel1-content"
                                        id="panel1-header"
                                    >
                                        <Markdown>{titleMarkdownString}</Markdown>
                                        {contentMarkdownString?.length > 0 && <Markdown>:</Markdown>}
                                        <Markdown>{contentMarkdownString}</Markdown>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <IdiomaticPlan adjudicationType={adjudicationType}
                                                       actions={activePlanToActions[id]}
                                                       onClose={handleClose}/>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                    </Paper>
                    {/*</Draggable>*/}
                </Fade>
            </TrapFocus>
        </React.Fragment>
    );
}
