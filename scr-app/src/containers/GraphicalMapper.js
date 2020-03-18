import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import {VisualQueryManager, PastebinContext} from './Pastebin';
import GraphicalQuery from '../components/GraphicalQuery';

const animationId = `scr-a-graphicalHighlight-${Date.now()}`;
const styles = theme => ({
    '@global': {
        [`@keyframes ${animationId}`]: {
            '0%': {borderWidth: '1px'},
            '100%': {borderWidth: '2px'},
        },
    },
    element: {
        border: `1px solid ${theme.palette.secondary.main}`,
    },
    popoverPaper: {
        marginLeft: -2,
        marginTop: -2,
        overflow: 'auto',
        maxWidth: 'unset',
        maxHeight: 'unset',
        background: 'transparent',
    },
    popover: { // restricts backdrop from being modal
        width: 0,
        height: 0,
    },
    anchor: {
        backgroundColor: 'transparent',
        position: 'absolute',
        width: 0,
        height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: `5px solid ${theme.palette.secondary.main}`,
    },
});

let visualIdentifier = () => [];

export const getVisualIdsFromRefs = (refsArray) => {
    return visualIdentifier(refsArray);
};

class GraphicalMapper extends React.Component {

    addOverlay(elt, containerRef, handleChangeGraphicalLocator, isSelected, key) {
        if (!this.vContainer) {
            return;
        }

        const overlays = [];
        const clientRect = containerRef.current.getBoundingClientRect();
        const containerOffsetTopPos = clientRect.y;
        const containerOffsetLeftPos = clientRect.x;
        const rects = elt.getClientRects();
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const tableRectDiv = document.createElement('div');
            tableRectDiv.style.overflow = elt.style.overflow || 'unset';
            tableRectDiv.style.position = 'absolute';
            tableRectDiv.style.border = '1px dashed darkorange';
            if (isSelected) {
                tableRectDiv.style.animation = `${animationId} 1s 1s infinite`;
                tableRectDiv.style.border = '1px solid darkorange';
            }
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
            tableRectDiv.style.margin = tableRectDiv.style.padding = '0';
            tableRectDiv.style.top = (containerOffsetTopPos + rect.top + scrollTop) + 'px';
            tableRectDiv.style.left = (containerOffsetLeftPos + rect.left + scrollLeft) + 'px';
            // we want rect.width to be the border width, so content width is 2px less.
            tableRectDiv.style.width = (rect.width - 2) + 'px';
            tableRectDiv.style.height = (rect.height - 2) + 'px';
            tableRectDiv.onclick = handleChangeGraphicalLocator;
            this.vContainer.appendChild(tableRectDiv);
            // document.body.appendChild(tableRectDiv);
            overlays.push({
                overlay: tableRectDiv,
                reactKey: `${tableRectDiv.style.top}:${
                    tableRectDiv.style.left
                    }:${tableRectDiv.style.width}:${tableRectDiv.style.height}:${key}`
            });
        }
        return overlays;
    }

    getVisualIdsFromRefs = (refsArray) => {
        if (refsArray && refsArray.map && this.props && this.props.visualElements) {
            return refsArray.map(ref => this.props.visualElements.indexOf(ref)).filter(e => e >= 0);
        } else {
            return [];
        }
    };

    componentDidMount() {
        visualIdentifier = this.getVisualIdsFromRefs;
    }

    componentWillMount() {
        visualIdentifier = () => [];
    }

    render() {
        const {
            classes, bundle, isGraphicalLocatorActive, visualElements, containerRef, handleChangeGraphicalLocator,
            searchState
        } = this.props;
        const locatedEls = [];

        if (isGraphicalLocatorActive) {
            if (this.vContainer) {
                document.body.removeChild(this.vContainer);
                this.vContainer = null;
            }
            this.vContainer = document.createElement('div');
            document.body.appendChild(this.vContainer);

            visualElements.forEach((IframeAnchorEl, key) => {
                if (IframeAnchorEl.tagName === 'STYLE') {
                    return;
                }
                const isSelected = searchState.visualQuery && searchState.visualQuery.find(el => el === IframeAnchorEl);
                const anchorEls = this
                    .addOverlay(
                        IframeAnchorEl, containerRef, handleChangeGraphicalLocator, isSelected, key
                    );
                if (!anchorEls[0]) {
                    return;
                }
                this.anchors = this.anchors || [];
                this.visualEls = this.visualEls || [];

                VisualQueryManager.visualElements = this.visualEls;

                this.anchors.push(anchorEls);
                this.visualEls.push(IframeAnchorEl);
                const anchorEl = anchorEls[0].overlay;
                const reactKey = anchorEls[0].reactKey;

                locatedEls.push(<Popover key={reactKey}
                                         className={classes.popover}
                                         classes={{
                                             paper: classes.popoverPaper,
                                         }}
                                         modal={null}
                                         hideBackdrop={true}
                                         disableBackdropClick={true}
                                         disableAutoFocus={true}
                                         disableEnforceFocus={true}
                                         open={true}
                                         anchorEl={anchorEl}
                                         onClose={this.handleClose}
                                         elevation={0}
                                         anchorOrigin={{
                                             vertical: 'bottom',
                                             horizontal: 'right',
                                         }}
                                         transformOrigin={{
                                             vertical: 'top',
                                             horizontal: 'left',
                                         }}
                >
                    <div className={classes.anchor}/>
                    <GraphicalQuery
                        outputRefs={[IframeAnchorEl]}
                        visualIds={[key]}
                        selected={!!isSelected}
                    />
                </Popover>);
            });
        } else {
            if (this.vContainer) {
                document.body.removeChild(this.vContainer);
                this.vContainer = null;
            }
            if (searchState.visualQuery && searchState.visualQuery.length) {
                if (this.vContainer) {
                    document.body.removeChild(this.vContainer);
                    this.vContainer = null;
                }
                this.vContainer = document.createElement('div');
                document.body.appendChild(this.vContainer);

                visualElements.forEach((IframeAnchorEl, key) => {
                    if (IframeAnchorEl.tagName === 'STYLE' || !searchState.visualQuery.includes(IframeAnchorEl)) {
                        return;
                    }
                    const isSelected = searchState.visualQuery
                        && searchState.visualQuery.find(el => el === IframeAnchorEl);
                    const anchorEls = this
                        .addOverlay(
                            IframeAnchorEl, containerRef, handleChangeGraphicalLocator, isSelected, key
                        );
                    if (!anchorEls[0]) {
                        return;
                    }
                    this.anchors = this.anchors || [];
                    this.visualEls = this.visualEls || [];
                    this.anchors.push(anchorEls);
                    this.visualEls.push(IframeAnchorEl);
                    const anchorEl = anchorEls[0].overlay;
                    const reactKey = anchorEls[0].reactKey;

                    locatedEls.push(<Popover key={reactKey}
                                             className={classes.popover}
                                             classes={{
                                                 paper: classes.popoverPaper,
                                             }}
                                             modal={null}
                                             hideBackdrop={true}
                                             disableBackdropClick={true}
                                             disableAutoFocus={true}
                                             disableEnforceFocus={true}
                                             open={true}
                                             anchorEl={anchorEl}
                                             onClose={this.handleClose}
                                             elevation={0}
                                             anchorOrigin={{
                                                 vertical: 'bottom',
                                                 horizontal: 'right',
                                             }}
                                             transformOrigin={{
                                                 vertical: 'top',
                                                 horizontal: 'left',
                                             }}
                    >
                        <div className={classes.anchor}/>
                        <GraphicalQuery
                            outputRefs={[IframeAnchorEl]}
                            visualIds={[key]}
                            selected={!!isSelected}
                        />
                    </Popover>);
                });

            } else {
                if (this.vContainer) {
                    document.body.removeChild(this.vContainer);
                    this.vContainer = null;
                }
            }
        }
        return <React.Fragment>{locatedEls}</React.Fragment>;
    }
}

const GraphicalMapperWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <GraphicalMapper {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);

export default withStyles(styles)(GraphicalMapperWithContext);