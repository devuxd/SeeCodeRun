import {Fragment, useMemo, useState} from "react";
import {useTheme} from '@mui/material/styles';
import Zoom from '@mui/material/Zoom';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import UpIcon from '@mui/icons-material/KeyboardArrowUp';
import {green} from '@mui/material/colors';
import {SxProps} from '@mui/system';
// import {useDraggableContext} from "../IdiomaticView";

const fabStyle = {
    position: 'absolute',
    // top: -8,
    // right: -8,
    bottom: -12,
    left: "50%",
    width: 20,   // Customize the width
    height: 20,  // Customize the height
    minHeight: 0, // Override the minimum height
    '& .MuiFab-icon': {
        fontSize: '1rem', // Adjust icon size if necessary
    },
    // transform: `translate(-50%, -50%)`,
};

const fabGreenStyle = {
    color: 'common.white',
    bgcolor: green[500],
    '&:hover': {
        bgcolor: green[600],
    },
};

export enum ViewActionType {
    close = 'close',
    open = 'open',
    expand = 'expand',
    collapse = 'collapse'
}

const fabs = {
    [ViewActionType.close]: {
        // size: "small",
        color: 'secondary' as 'secondary',
        sx:
            fabStyle as SxProps,
        icon:
            <CloseIcon/>,
        label:
            'Close',
    },
    [ViewActionType.open]: {
        color: 'secondary' as 'secondary',
        sx:
            fabStyle as SxProps,
        icon:
            <EditIcon/>,
        label:
            'Edit',
    },
    [ViewActionType.expand]: {
        color: 'inherit' as 'inherit',
        sx:
            {
                ...
                    fabStyle,
                ...
                    fabGreenStyle
            } as SxProps,
        icon:
            <UpIcon/>,
        label:
            'Expand',
    },
    [ViewActionType.collapse]: {
        color: 'inherit' as 'inherit',
        sx:
            {
                ...
                    fabStyle,
                ...
                    fabGreenStyle
            } as SxProps,
        icon:
            <UpIcon/>,
        label:
            'Expand',
    }
    ,
};


export default function FloatingActionButtonZoom({actionMap}) {
    //{nodeRef}
    // const {nodeRef} = useDraggableContext();
    const theme = useTheme();
    const [value, setValue] = useState(0);

    const handleChange = (event: unknown, newValue: number) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index: number) => {
        setValue(index);
    };
    //onClick={() => handleChangeIndex(index+1)}
    const transitionDuration = useMemo(() => ({
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen,
    }), [theme]);


    //ref={nodeRef}

    return (<Fragment>
        {Object.keys(fabs).map((fabKey, index) => {
            const fab = fabs[fabKey];
            const activeActionProps = actionMap[fabKey];
            return (
                <Zoom
                    key={fabKey}
                    // in={value === index}
                    in={!!activeActionProps}
                    timeout={transitionDuration}
                    style={{
                        transitionDelay: `${value === index ? transitionDuration.exit : 0}ms`,
                    }}
                    unmountOnExit
                >
                    <Fab
                        // sx={fab.sx} aria-label={fab.label} color={fab.color}
                        {...{...fab, ...(activeActionProps ?? {})}}
                    >
                        {fab.icon}
                    </Fab>
                </Zoom>
            )
        })}
    </Fragment>);
}
