import React, {
    useRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState
} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import PastebinContext from '../contexts/PastebinContext';
import GraphicalQuery from '../components/GraphicalQuery';
import {
    FocusBox,
    pulseOutlineAnimation as animation,
    pulseStartOutline
} from "../common/UI";
import {GraphicalIdiom} from "../core/modules/rale/IdiomaticInspector";
import {SupportedApis} from "../core/modules/idiomata/Idiomata";
//filterVisualElementsByApiName
// import {ReactElementRefTree} from "../core/modules/idiomata/idiosyncrasies/ReactAPI";

const styles = () => ({
    locator: {
        ...pulseStartOutline,
        position: 'absolute',
        margin: 0,
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

const WindowResizeObserver = global.ResizeObserver ||
    console.log('Resize observer not supported!');

const WindowMutationObserver = global.MutationObserver ||
    console.log('Mutation observer not supported!');

function getOverlayStyles(
    elt, containerOffsetTopPos, containerOffsetLeftPos, limit
) {
    console.log("getOverlayStyles", elt);
    const overlays = [];
    const rects = elt?.getClientRects?.() ?? [];
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

const GraphicalLocator = ({
                              id,
                              observeResizes = true,
                              observeMutations = false,
                              mutationObserverOptions = {
                                  attributes: true,
                                  childList: false,
                                  subtree: false
                              },
                              getStyle,
                              visualElement,
                              domEl,
                              getAnchorEl,
                              containerRef,
                              isSelected,
                              classes,
                              TooltipProps = {
                                  enterDelay: 100,
                                  enterNextDelay: 100,
                                  leaveDelay: 100
                              },
                              maxResizeTimeOutMs = 100
                          }) => {
    const [style, setStyle] = useState(getStyle);
    const ridRef = useRef(null);
    const onResize = useCallback((/*entry*/) => {
        ridRef.current ??= {};
        cancelAnimationFrame(ridRef.current.id);
        ridRef.current.id = requestAnimationFrame((timeStamp) => {
            ridRef.current.start ??= timeStamp;
            const elapsed = timeStamp - ridRef.current.start;
            if (elapsed > maxResizeTimeOutMs) {
                ridRef.current.start = null;
                setStyle(getStyle());
            }
        });

    }, [setStyle, getStyle, maxResizeTimeOutMs]);

    const resizeObserver = useMemo(
        () => ((observeResizes ? true : undefined) && WindowResizeObserver &&
            new WindowResizeObserver(onResize)),
        [observeResizes]
    );
    const mutationObserver = useMemo(
        () => ((observeMutations ? true : undefined) && WindowMutationObserver &&
            new WindowMutationObserver(onResize)),
        [observeResizes]
    );

    useEffect(() => {
            if (!domEl) {
                return;
            }

            resizeObserver?.observe(domEl);
            mutationObserver?.observe(
                domEl,
                mutationObserverOptions
            );
            return (() => {
                    resizeObserver?.unobserve(domEl);
                    mutationObserver?.disconnect();
                }
            );
        },
        [resizeObserver, mutationObserver, mutationObserverOptions, domEl]
    );

    // useEffect(() => {
    //     const caf = (e) => (console.log("RO", e)??cancelAnimationFrame(ridRef.current));
    //     window.addEventListener("error", caf);
    //
    //     return () => window.removeEventListener("error", caf);
    //
    // }, []);
    const clientRect =
        containerRef.current.getBoundingClientRect();
    const containerOffsetTopPos = clientRect.y;
    const containerOffsetLeftPos = clientRect.x;

    const popperModifiers = useMemo(() => (
        [
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
        ]
    ), [
        containerOffsetLeftPos,
        containerOffsetTopPos,
        containerRef
    ]);

    return (
        <LocatorTooltip
            key={`${isSelected}`}
            title={
                // <BranchNavigator
                //     min={1}
                //     max={key}
                //     value={1}
                //     handleSliderChange={()=>1}
                //     // color={color}
                //     // onMouseEnter={this.onMouseEnter}
                //     // onMouseLeave={this.onMouseLeave}
                // />
                <GraphicalQuery
                    outputRefs={[visualElement]}
                    visualIds={[id]}
                    selected={!!isSelected}
                />
            }
            placement="bottom-end"
            {...(isSelected ? {disableInteractive: true, open: true} : {})}
            {...TooltipProps}
        >
            <Popper
                placement="bottom-end"
                disablePortal={false}
                modifiers={popperModifiers}
                anchorEl={getAnchorEl()}
                container={containerRef.current}
                open={true}
            >
                <div
                    className={classes.locator}
                    style={style}

                >
                    <FocusBox
                        variant={isSelected ? 'Triangle' : 'Line'}
                    />
                </div>
            </Popper>

        </LocatorTooltip>
    )
};

const findComponentInFiberTree = (component, fiberNode) => {
    if (fiberNode) {
        if (component.type === fiberNode.type && component.props === fiberNode.memoizedProps) {
            return fiberNode;
        } else {
            return (findComponentInFiberTree(component, fiberNode.child) || findComponentInFiberTree(component, fiberNode.sibling));
        }
    } else {
        return null;
    }
};

const GraphicalMapper = (({
                              classes,
                              isGraphicalLocatorActive,
                              visualElements: visualElementsArray,
                              containerRef,
                              handleChangeGraphicalLocator,
                              searchState,
                              VisualQueryManager
                          }) => {
    const [visualElements, visualElementsApiNames] = visualElementsArray ?? [];
    VisualQueryManager.visualElements = visualElements;
    VisualQueryManager.visualElementsApiNames = visualElementsApiNames;

    const {visualQuery} = searchState;
    const portalEl = useMemo(
        () => document.createElement('div'),
        []
    );
    useLayoutEffect(() => {
        document.body.appendChild(portalEl);
        return () => document.body.removeChild(portalEl);
    }, [portalEl]);

    const handleClose = useCallback(() => {
            isGraphicalLocatorActive && handleChangeGraphicalLocator();
        }
        , [handleChangeGraphicalLocator, isGraphicalLocatorActive]);

    const makeLocators = useCallback(() => {
            const locatedEls = [];
            // console.log("locators", visualElements);
            // const reactComponents = filterVisualElementsByApiName(visualElements, visualElementsApiNames, SupportedApis.React).reverse();
            //  const reactElementRefTree = new ReactElementRefTree(reactComponents);
            (visualElements ?? []).forEach((visualElement, key) => {
                const apiName = visualElementsApiNames[key];
                let domEls = GraphicalIdiom.graphicalQuery(visualElement, apiName);
                if (apiName === SupportedApis.React) { //domEls.length === 0 &&

                    // const componentTreeNodeWithRef = reactElementRefTree.findComponentWithRefByComponent(visualElement);
                    // // console.log("reactElementRefTree",key,  {
                    // //     reactComponents,
                    // //     reactElementRefTree,
                    // //     visualElement,
                    // //     componentTreeNodeWithRef
                    // // });
                    // if (componentTreeNodeWithRef) {
                    //     domEls = GraphicalIdiom.graphicalQuery(componentTreeNodeWithRef.getComponent(), apiName);
                    // }

                    if (domEls.length === 0) {
                        return;
                    }

                }
                // setTimeout(() => {
                //     console.log("locators", {key, apiName, visualElement, domEls});
                // }, 2000);
                domEls.forEach((domEl, i) => {

                    if (!domEl || domEl.tagName === 'STYLE') {
                        return;
                    }
                    const isSelected =
                        VisualQueryManager.isGraphicalElementSelected(
                            visualElement, visualQuery
                        );

                    if (!domEl.getClientRects && domEl?.body) { // is document
                        domEl = domEl.body;
                    }

                    if (!isGraphicalLocatorActive && !isSelected) {
                        return;
                    }

                    // console.log("visual", {apiName, key, visualElement, domEl});

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

                    const getAnchorEl = () => {
                        return domEl;
                    };


                    locatedEls.push({
                            key: `${key}:${i}`,
                            props: {
                                id: key,
                                getStyle,
                                visualElement,
                                domEl,
                                getAnchorEl,
                                containerRef,
                                isSelected,
                                classes,
                            },
                        }
                    );

                });
            });
            return locatedEls;
        }
        , [
            visualQuery,
            visualElements,
            visualElementsApiNames,
            isGraphicalLocatorActive,
            containerRef,
            classes,
        ]);

    const [locatorTimestamp, setLocatorTimestamp] = useState();

    useEffect(() => {
        if (!makeLocators) {
            return;
        }

        const tid = setTimeout(() => {
            setLocatorTimestamp(Date.now());
        }, 2000);

        return () => {
            clearTimeout(tid);
        };

    }, [makeLocators]);

    // console.log("makeLocatorProps", {makeLocators, makeLocatorProps});

    return ReactDOM.createPortal(
        <div
            onClick={handleClose}
        >
            {
                makeLocators?.().map(
                    ({key, props}) => {
                        return <GraphicalLocator key={key} {...props}/>
                    }
                )
            }
        </div>,
        portalEl
    );

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
