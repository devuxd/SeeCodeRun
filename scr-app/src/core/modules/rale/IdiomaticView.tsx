import React, {useCallback, useMemo, useRef, useState, forwardRef, useEffect} from 'react';
import Markdown from "react-markdown";
import Draggable from 'react-draggable';


import Paper from '@mui/material/Paper';
import TrapFocus from '@mui/material/Unstable_TrapFocus';
import Fade from '@mui/material/Fade';
import type {PaperProps} from '@mui/material/Paper';

import {fromShapesToShapes, isMorphism, useIdiomaticContext, useIdiomaticDispatchContext} from "./IdiomaticContext";
import {IdiomaticAccordionView} from "./components/IdiomaticAccordion";
import IdiomaticViewAction, {ViewActionType} from "./components/IdiomaticViewAction";
import StyledIdiomaticView from "./shared/styled/StyledIdiomaticView";

interface DraggablePaperProps extends PaperProps {
    handle: string;
    cancel: string;
    position: { x: any; y: any; };
    onPositionChange: Function;
}

const DraggablePaper = forwardRef<HTMLDivElement, DraggablePaperProps>(
    ({position, onPositionChange, handle, cancel, ...props}, ref) => {
        const nodeRef = useRef(null);
        const handleStop = (e: any, data: { x: any; y: any; }) => {
            onPositionChange({x: data.x, y: data.y});
        };
        return (
            <Draggable
                nodeRef={nodeRef}
                handle={handle}
                cancel={cancel}
                position={position}
                defaultPosition={position}
                onStop={handleStop}
            >
                <div ref={nodeRef}>
                    <Paper ref={ref} {...props} />
                </div>
            </Draggable>
        );
    }
);

export default function IdiomaticView({open, handleOpen}) {
    const {idiomaticPlans, idiomaticActions} = useIdiomaticContext();
    const {idiomaticChangerAction, idiomaticPlanDispatch} = useIdiomaticDispatchContext();

    const activeIdiomaticPlans = useMemo(() => {
        return idiomaticPlans.filter(idiomaticPlan => idiomaticPlan.demoMode || idiomaticPlan.active);
    }, [idiomaticPlans]);

    const activePlanToActions = useMemo(() => {
        return fromShapesToShapes(activeIdiomaticPlans, idiomaticActions);
    }, [activeIdiomaticPlans, idiomaticActions]);

    const [position, setPosition] = useState({x: 0, y: 0});


    const demoPlan = useMemo(() => {
        return idiomaticPlans?.find(p => p.demoMode);
    }, [idiomaticPlans]);


    const handlePlanOpen = useCallback((event: any, nextDone = true) => {
        //nextOpen = false, toggle = true
        if (!demoPlan) {
            return;
        }

        // const {done} = demoPlan;

        idiomaticPlanDispatch(idiomaticChangerAction({...demoPlan, done: true}));
        // if (!handleOpen) {
        //     return;
        // }
        //
        // handleOpen(!nextDone);

        // if (nextDone) {
        //     handleOpen(false);
        // }


        // if (nextDone !== done) {
        //
        // }


        // if (toggle) {
        //     idiomaticPlanDispatch(idiomaticChangerAction({...demoPlan, done: !done}));
        //     return;
        // }
        //
        // if (nextOpen && !open) {
        //     if (done === nextOpen) {
        //         idiomaticPlanDispatch(idiomaticChangerAction({...demoPlan, done: !nextOpen}));
        //         return;
        //     }
        //
        // }


        // if (done) {
        //     if (open) {
        //         idiomaticPlanDispatch(idiomaticChangerAction({...demoPlan, done: false}));
        //     }
        //
        // }
        //
        // if (open) {
        //     if (!done) {
        //         idiomaticPlanDispatch(idiomaticChangerAction({...demoPlan, done: true}));
        //     }
        //     // console.log("idiomaticChangerAction SM", {done, open, demoPlan, handleOpen});
        //
        // }

    }, [open, handleOpen, demoPlan, idiomaticChangerAction, idiomaticPlanDispatch]);

    useEffect(() => {
        if (!demoPlan) {
            return;
        }

        const {done} = demoPlan;

        console.log("idiomaticPlans SM", {done, open, demoPlan, handleOpen});

        if (!handleOpen) {
            return;
        }

        // if (open) {
        //     if (done) {
        //         handlePlanOpen(null, false);
        //         return;
        //     }
        // }

        // if (!done) {
        //     if (!open) {
        //         handlePlanOpen(null, true);
        //         handleOpen(true);
        //         return;
        //     }
        // }

        if (!done && !open) {
            handleOpen(true);
            return;
        }

        if (done && open) {
            handleOpen(false);
            return;
        }

        // if (done && open) {
        //     handlePlanOpen(null, false);
        //     return;
        // }
        // if (!done) {
        //     handlePlanOpen(null, done);
        //     return;
        // }

        // if (!done && !open) {
        //
        // }
        //
        // if (!done && open) {
        //     return;
        // }

        // console.log("idiomaticPlans", idiomaticPlans);
        // handleOpen
    }, [open, handleOpen, demoPlan, handlePlanOpen]);

    const actionMap = useMemo(() => {
        return {
            [ViewActionType.close]: {onClick: handlePlanOpen}
        };
    }, [handlePlanOpen]);

    return null;

    // return (
    //
    //     <TrapFocus open={open} disableAutoFocus disableEnforceFocus>
    //         <Fade appear={false} in={open}>
    //             <StyledIdiomaticView>
    //                 <DraggablePaper
    //                     role="dialog"
    //                     aria-modal="false"
    //                     aria-label="Idiomatic View"
    //                     square
    //                     variant="outlined"
    //                     tabIndex={10}
    //                     sx={{
    //                         position: 'fixed',
    //                         bottom: 0,
    //                         left: 0,
    //                         right: 0,
    //                         m: 0,
    //                         p: 0,
    //                         borderWidth: 4,
    //                         // borderTopWidth: 0,
    //                         minHeight: 64,
    //                         scroll: "auto",
    //                         maxBottom: 20,
    //                     }}
    //                     position={position}
    //                     onPositionChange={setPosition}
    //                     handle={'[class*="MuiPaper-root"]'}
    //                     cancel={'[class*="MuiAccordion-root"]'}
    //                 >
    //                     <IdiomaticViewAction actionMap={actionMap}/>
    //                     <IdiomaticAccordionView
    //                         activeIdiomaticPlans={activeIdiomaticPlans}
    //                         activePlanToActions={activePlanToActions}
    //
    //                     />
    //                 </DraggablePaper>
    //             </StyledIdiomaticView>
    //         </Fade>
    //     </TrapFocus>
    // );
}
