import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import {VisualQueryListener, PastebinContext} from '../../containers/Pastebin';

const styles = theme => ({
    element: {
        border: `1px solid ${theme.palette.secondary.main}`,
    },
    popoverPaper: {
        overflow: 'auto',
        maxWidth: 'unset',
        maxHeight: 'unset',
        background: 'transparent',
    },
    popover: { // restricts backdrop from being modal
        width: 0,
        height: 0,
    },
});

class GraphicalMapper extends React.Component {

    addOverlay(elt, containerRef, handleChangeGraphicalLocator) {
        // Absolutely position a div over each client rect so that its border width
        // is the same as the rectangle's width.
        // Note: the overlays will be out of place if the user resizes or zooms.
        const overlays = [];
        //console.log('cr', containerRef.current.getBoundingClientRect());
        const clientRect = containerRef.current.getBoundingClientRect();
        const containerOffsetTopPos = clientRect.y;
        const containerOffsetLeftPos = clientRect.x;
        const rects = elt.getClientRects();
        console.log(elt, rects);
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const tableRectDiv = document.createElement('div');
            tableRectDiv.style.overflow = elt.style.overflow || 'unset';
            tableRectDiv.style.position = 'absolute';
            tableRectDiv.style.border = '1px dashed darkorange';
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
            tableRectDiv.style.margin = tableRectDiv.style.padding = '0';
            tableRectDiv.style.top = (containerOffsetTopPos + rect.top + scrollTop) + 'px';
            tableRectDiv.style.left = (containerOffsetLeftPos + rect.left + scrollLeft) + 'px';
            // we want rect.width to be the border width, so content width is 2px less.
            tableRectDiv.style.width = (rect.width - 2) + 'px';
            tableRectDiv.style.height = (rect.height - 2) + 'px';
            tableRectDiv.onclick = handleChangeGraphicalLocator;
            document.body.appendChild(tableRectDiv);
            overlays.push(tableRectDiv);
        }
        return overlays;
    }

    render() {
        //  console.log('gm', this.props);
        const {classes, bundle, isGraphicalLocatorActive, visualElements, containerRef, handleChangeGraphicalLocator} = this.props;
        const locatedEls = [];
        if (isGraphicalLocatorActive) {
            visualElements.forEach((IframeAnchorEl, key) => {
                if (IframeAnchorEl.tagName === 'STYLE') {
                    return;
                }
                const anchorEls = this.addOverlay(IframeAnchorEl, containerRef, handleChangeGraphicalLocator);
                this.anchors = this.anchors || [];
                this.anchors.push(anchorEls);
                const anchorEl = anchorEls[0];
                // const locator = el.ownerDocument.createElement('div');
                // locator.style.position = 'relative';
                //
                // const locatorContent = el.ownerDocument.createElement('span');
                // locatorContent.style.position = 'absolute';
                // locatorContent.style.top = '0';
                // locatorContent.style.right = '0';
                // // locatorContent.style.marginTop = '-10px';
                // //locatorContent.style.minWidth = '20px';
                // // locatorContent.style.minHeight = '10px';
                // locatorContent.style.backgroundColor = 'darkorange';
                // locatorContent.style.color = 'black';
                // locatorContent.style.zIndex = '999999';
                // locatorContent.style.fontWeight = '500';
                // locatorContent.style.fontSize = '8px';
                // locatorContent.style.borderRadius = '8px';
                //
                // locatorContent.innerHTML = `<${key}>`;
                // locatorContent.onclick = () => {
                //     VisualQueryListener.onChange(el, key);
                // };
                //
                // el.appendChild(locator);
                // locator.appendChild(locatorContent);
                // const locator =this.addClientRectsOverlay(el);
                locatedEls.push(<Popover key={key}
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
                >
                    <Button color="secondary"
                            variant="extendedFab"
                            aria-label={`visual element number ${key}`}
                            elevation={0}
                            className={{boxShadow: 'unset', minHeight: 'unset', minWidth: 'unset'}}
                            onClick={() => {
                                VisualQueryListener.onChange(IframeAnchorEl, key);
                            }}>{`<${key}>`}</Button>
                </Popover>);
                // this.locatedEls.push({el, border: el.style.border || 'unset', locator});
                // el.style.border = 'dashed 1px darkorange';
            });
        } else {
            if (this.anchors) {
                for (const ia in this.anchors) {
                    const anchorEls = this.anchors[ia];
                    for (const i in anchorEls) {
                        const anchorEl = anchorEls[i];
                        try {
                            document.body.removeChild(anchorEl);
                        } catch (e) {
                            console.log(anchorEl, e);
                        }

                    }
                }
                this.anchors = null;
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