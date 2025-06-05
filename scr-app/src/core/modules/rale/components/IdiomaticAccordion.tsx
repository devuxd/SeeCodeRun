import {Fragment, useState} from "react";
import {alpha, styled} from '@mui/material/styles';
import Markdown from "react-markdown";
// import AccordionActions from '@mui/material/AccordionActions';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, {AccordionProps} from '@mui/material/Accordion';
import MuiAccordionSummary, {
    AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';

// import {useDraggableContext} from "../IdiomaticView";
import {IdiomaticPlan} from "../IdiomaticPlan";
import IdiomaticViewAction from "./IdiomaticViewAction";

const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({theme}) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
        borderBottom: 0,
    },
    '&::before': {
        display: 'none',
    },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{fontSize: '0.9rem'}}/>}
        {...props}
    />
))(({theme}) => ({
    // backgroundColor:
    //     theme.palette.mode === 'dark'
    //         ? 'rgba(255, 255, 255, .05)'
    //         : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1),
    },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({theme}) => ({
    // padding: theme.spacing(2),
    // borderTop: '1px solid rgba(0, 0, 0, .125)',
}));


export function IdiomaticAccordionView(
    {
        activeIdiomaticPlans,
        activePlanToActions,
    }
) {

    const [expanded, setExpanded] = useState<string | false>("0");

    const handleChange =
        (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            setExpanded(newExpanded ? panel : false);
        };

    return (
        <Fragment>
            {activeIdiomaticPlans.map((idiomaticPlan, index) => {
                const key = `${index}`;

                const {
                    // contentSeparator = true,
                    adjudicationType,
                    id, titleMarkdownString, contentMarkdownString,
                    // morphisms, done
                } = idiomaticPlan;

                return (
                    <IdiomaticAccordion
                        key={key}
                        expanded={expanded === key}
                        onChange={handleChange(key)}
                        idiomaticPlan={idiomaticPlan}
                        disableGutters
                    >
                        <IdiomaticPlan adjudicationType={adjudicationType}
                                       actions={activePlanToActions[id]}
                                       />
                    </IdiomaticAccordion>
                );
            })}
        </Fragment>
    );
}


export default function IdiomaticAccordion({children, idiomaticPlan, ...muiAccordionProps}) {
    const {
        contentSeparator = true,
        // adjudicationType,
        id, titleMarkdownString, contentMarkdownString,
        // morphisms, done
    } = idiomaticPlan;

    return (
        <Accordion   {...muiAccordionProps}>
            <AccordionSummary
                // aria-controls="panel1d-content" id="panel1d-header"
            >
                <Markdown>{titleMarkdownString}</Markdown>
                {(contentSeparator && contentMarkdownString?.length > 0) &&
                    <Markdown>:</Markdown>}
                <Markdown>{contentMarkdownString}</Markdown>
            </AccordionSummary>
            <AccordionDetails>
                {children}
            </AccordionDetails>
        </Accordion>

    );
}
