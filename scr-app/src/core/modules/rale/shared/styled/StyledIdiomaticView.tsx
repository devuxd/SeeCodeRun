/** @jsxImportSource @emotion/react */
import {css} from '@emotion/react';
import {Theme, styled} from '@mui/material/styles';

const defaultClassName = '.react-draggable';
const defaultClassNameDragged = '.react-draggable-dragged';
const defaultClassNameDragging = '.react-draggable-dragging';

// Define styles using Emotion's `css`
const myStyles = (theme: Theme) => css`
    border: 1px solid ${theme.palette.divider};

    ${defaultClassName} > .MuiPaper-root {
        cursor: grab;
        border-color: ${theme.palette.action.hover};

        &:hover {
            border-color: ${theme.palette.action.focus};
        }

        & > * {
            cursor: default;

        }

    }

    ${defaultClassNameDragged} > .MuiPaper-root {
        cursor: grab;
        border-color: ${theme.palette.action.focus};

        &:hover {
            border-color: ${theme.palette.action.active};
        }

        & > * {
            cursor: default;

        }
    }

    ${defaultClassNameDragging} > .MuiPaper-root {
        cursor: grabbing;
        border-color: ${theme.palette.action.active};

        &:hover {
            border-color: ${theme.palette.action.active};
        }

        & > * {
            cursor: default;

        }
    }
`;

// Create a styled component using Material-UI's `styled`
const StyledIdiomaticView = styled('div')((props) => ({
    ...myStyles(props.theme)
}));

export default StyledIdiomaticView;
