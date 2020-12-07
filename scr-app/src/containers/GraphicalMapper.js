import React, {
    useState,
    useLayoutEffect,
    useEffect,
    useMemo,
    useCallback
} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Popper from '@material-ui/core/Popper';
import Tooltip from '@material-ui/core/Tooltip';
import {VisualQueryManager, PastebinContext} from './Pastebin';
import GraphicalQuery from '../components/GraphicalQuery';
import {
    FocusBox,
    pulseOutlineAnimation as animation,
    pulseStartOutline
} from "../components/UI";

const styles = () => ({
    locator: {
        position: 'absolute',
        margin: 0,
        padding: 0,
        outline: pulseStartOutline,
        animation,
    },
});

const LocatorTooltip = withStyles((theme) => ({
    tooltip: {
        backgroundColor: 'transparent',
        maxWidth: 'none',
        border: 'none',
        margin: `-${
            theme.spacing(0.5)
        } -${theme.spacing(0.5)} 0 ${theme.spacing(1.25)}`,
        padding: 0,
        lineHeight: 0,
    }
}))
(Tooltip);

const WindowResizeObserver = window.ResizeObserver ||
    console.log('Resize observer not supported!');

const WindowMutationObserver = window.MutationObserver ||
    console.log('Mutation observer not supported!');

function getOverlayStyles(
    elt, containerOffsetTopPos, containerOffsetLeftPos, limit
) {
    const overlays = [];
    const rects = elt.getClientRects();
    const length = rects ? limit ? Math.min(limit, rects.length)
        : rects.length : 0;
    for (let i = 0; i < length; i++) {
        const rect = rects[i] || {};
        const style = {
            overflow: elt.style.overflow || 'unset',
        };
        const width = (rect.width || 0).toFixed(2);
        const height = (rect.height || 0).toFixed(2);
        style.width = `${width}px`;
        style.height = `${height}px`;
        style.marginLeft = `-${width}px`;
        style.marginTop = `-${height}px`;
        overlays.push(style);
    }
    return overlays;
}

// function handleClose({...p}) {
//     console.log('gm', ...p)
// }

const GraphicalMapper = (({
                              classes,
                              isGraphicalLocatorActive,
                              visualElements,
                              containerRef,
                              // handleChangeGraphicalLocator,
                              // searchState,
                          }) => {
    VisualQueryManager.visualElements = visualElements;

    // const {visualQuery} = searchState;
    const [portalEl] = useState(() => document.createElement('div'));
    useLayoutEffect(() => {
        document.body.appendChild(portalEl);
        return () => document.body.removeChild(portalEl);
    }, [portalEl]);

    const locators = useMemo(() => {
            const locatedEls = [];

            visualElements.forEach((domEl, key) => {
                if (!domEl || domEl.tagName === 'STYLE') {
                    return;
                }
                const isSelected =
                    VisualQueryManager.isGraphicalElementSelected(domEl);

                if (!isGraphicalLocatorActive && !isSelected) {
                    return;
                }

                // const box = domEl.getBoundingClientRect();
                //todo: show them on the side?
                // let hidden = domEl.style
                //     && (domEl.style.visibility === 'hidden'
                //         || domEl.style.display === 'none'
                //         || (
                //             box &&
                //             box.top === 0 &&
                //             box.left === 0 &&
                //             box.right === 0 &&
                //             box.bottom === 0
                //         )
                //     );

                const getStyle = () => {
                    const clientRect =
                        containerRef.current.getBoundingClientRect();
                    const containerOffsetTopPos = clientRect.y;
                    const containerOffsetLeftPos = clientRect.x;
                    const overlayStyles = getOverlayStyles(
                        domEl,
                        containerOffsetTopPos,
                        containerOffsetLeftPos,
                        1
                    );

                    return overlayStyles[0];
                };

                const GraphicalLocator = ({
                                              observeResizes = true,
                                              observeMutations = false
                                          }) => {
                    const [style, setStyle] = useState(getStyle);
                    const onResize = useCallback((/*entry*/) => {
                        setStyle(getStyle());
                    }, [setStyle]);
                    const [resizeObserver] = useState(
                        () => observeResizes && WindowResizeObserver &&
                            new WindowResizeObserver(onResize)
                    );
                    const [mutationObserver] = useState(
                        () => observeMutations && WindowMutationObserver &&
                            new WindowMutationObserver(onResize)
                    );
                    useEffect(() => {
                        resizeObserver && resizeObserver.observe(domEl);
                        mutationObserver && mutationObserver.observe(domEl,
                            {
                                attributes: true,
                                childList: false,
                                subtree: false
                            }
                        );
                        return (() => (
                                (resizeObserver?.unobserve(domEl))
                                || (mutationObserver?.disconnect())
                            )
                        );
                    }, [resizeObserver, mutationObserver]);
                    const clientRect =
                        containerRef.current.getBoundingClientRect();
                    const containerOffsetTopPos = clientRect.y;
                    const containerOffsetLeftPos = clientRect.x;
                    return (
                        <LocatorTooltip
                            title={
                                // <BranchNavigator
                                //     min={1}
                                //     max={key}
                                //     value={1}
                                //     handleSliderChange={()=>1}
                                //     // color={color} /
                                //     hideLabel={true}
                                //     // onMouseEnter={this.onMouseEnter}
                                //     // onMouseLeave={this.onMouseLeave}
                                // />
                                <GraphicalQuery
                                    outputRefs={[domEl]}
                                    visualIds={[key]}
                                    selected={!!isSelected}
                                />
                            }
                            placement="bottom-end"
                            disableInteractive={isSelected}
                            {...(isSelected ? {open: true} : {})}
                            enterDelay={100}
                            enterNextDelay={100}
                            leaveDelay={100}
                        >
                            <Popper
                                placement="bottom-end"
                                disablePortal={false}
                                modifiers={[
                                    {
                                        name: 'offset',
                                        options: {
                                            offset: [
                                                containerOffsetLeftPos,
                                                containerOffsetTopPos
                                            ],
                                        },
                                    },
                                    {
                                        name: 'flip',
                                        enabled: false,
                                    },
                                    {
                                        name: 'preventOverflow',
                                        enabled: true,
                                        options: {
                                            boundary: containerRef.current,
                                        }
                                    },
                                    {
                                        name: 'hide',
                                        enabled: true,
                                    },
                                    {
                                        name: 'arrow',
                                        enabled: false,
                                        // element: arrowRef,
                                    },
                                ]}
                                anchorEl={domEl || {}}
                                container={containerRef.current}
                                open={true}
                            >
                                <div
                                    className={classes.locator}
                                    style={style}

                                >
                                    <FocusBox variant={
                                        isSelected ? 'Triangle' : 'Line'
                                    }/>
                                </div>
                            </Popper>

                        </LocatorTooltip>
                    )
                };
                locatedEls.push(<GraphicalLocator key={key}/>);

            });
            return locatedEls;
        }
        , [
            visualElements,
            isGraphicalLocatorActive,
            containerRef,
            classes,
        ]);

    return ReactDOM.createPortal(<div>{locators}</div>, portalEl);

});

GraphicalMapper.propTypes = {
    visualElements: PropTypes.array.isRequired,
};

const GraphicalMapperWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <GraphicalMapper {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);

export default withStyles(styles)(GraphicalMapperWithContext);