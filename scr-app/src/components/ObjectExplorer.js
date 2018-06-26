import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import {ObjectInspector, TableInspector, DOMInspector, ObjectValue, ObjectName} from 'react-inspector';
// import Tooltip from '@material-ui/core/Tooltip';
// import deepDiff from 'deep-diff';

import {isNode} from '../utils/scrUtils';
import {ThemeContext} from '../pages/Index';
import {HighlightPalette} from '../containers/LiveExpressionStore';


//start https://github.com/xyc/react-inspector/tree/master/src/object-inspector
/* NOTE: Chrome console.log is italic */
const styles = theme => ({
    preview: {
        fontStyle: 'italic',
    },
    objectClassName: {
        fontSize: '80%',
    },
    objectBraces: {
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: 'white',
        backgroundColor: theme.palette.type === 'light' ? 'rgb(136, 19, 145)' : 'rgb(227, 110, 236)',
        // fontSize: '110%',
    },
    arrayBrackets: {
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: theme.palette.type === 'light' ? 'rgb(28, 0, 207)' : 'rgb(153, 128, 255)',
        // fontSize: '110%',
    },
    stringQuote: {
        fontWeight: 'bold',
        fontStyle: 'normal',
        fontSize: '110%',
        color: theme.palette.type !== 'light' ? 'rgb(196, 26, 22)' : 'rgb(233, 63, 59)',
    },
    stringValue: {
        fontWeight: 100,
        // color: theme.palette.type === 'light' ? 'rgb(196, 26, 22)' : 'rgb(233, 63, 59)',
    },
    emptyStringValue: {
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: theme.palette.action.disabled,
    },
    booleanValue: {
        fontSize: '90%',
        fontWeight: 'bold',
    },
    numberValue: {},
    undefinedValue: {
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: theme.palette.type === 'light' ? 'rgb(196, 26, 22)' : 'rgb(233, 63, 59)',
    }
});

let currentLiveObjectNodeRenderer = null;

/* intersperse arr with separator */
function intersperse(arr, sep) {
    if (arr.length === 0) {
        return [];
    }

    return arr.slice(1).reduce((xs, x) => xs.concat([sep, x]), [arr[0]]);
}

/**
 * A preview of the object
 */
export const ObjectPreview = withStyles(styles)(({classes, data, maxProperties, compact}) => {
    const object = data;

    if (
        typeof object !== 'object' ||
        object === null ||
        object instanceof Date ||
        object instanceof RegExp
    ) {
        if (typeof object === 'string') {
            if (object.length) {
                return (<span className={classes.stringValue}>{object}</span>);
            } else {
                return (
                    <Tooltip title="Empty String" enterDelay={300}>
                        <span className={classes.emptyStringValue}>{'E'}</span>
                    </Tooltip>);
            }

            // return (<span className={classes.preview}>
            //     <span className={classes.stringQuote}>"</span>
            //     <span className={classes.stringValue}>{object}</span>
            //     <span className={classes.stringQuote}>"</span>
            // </span>);
        } else {
            if (object === undefined) {
                return (<Tooltip title="undefined" enterDelay={300}>
                    <span className={classes.undefinedValue}>{'U'}</span>
                </Tooltip>);
            } else {
                if (object === null) {
                    return (<Tooltip title="null" enterDelay={300}>
                        <span className={classes.undefinedValue}>{'N'}</span>
                    </Tooltip>);
                } else {
                    return <ObjectValue object={object}/>;
                }
            }
        }

    }

    if (Array.isArray(object)) {
        return (<span className={classes.preview}>
                <span className={classes.arrayBrackets}>{'['}</span>
                <span>
                {intersperse(
                    object.map((element, index) => <ObjectValue key={index} object={element}/>),
                    ', ',
                )}
                </span>
                <span className={classes.arrayBrackets}>{']'}</span>
        </span>);
    } else {
        let propertyNodes = [];
        for (let propertyName in object) {
            const propertyValue = object[propertyName];
            if (object.hasOwnProperty(propertyName)) {
                let ellipsis;
                if (
                    propertyNodes.length === maxProperties - 1 &&
                    Object.keys(object).length > maxProperties
                ) {
                    ellipsis = <span key={'ellipsis'}>…</span>;
                }
                propertyNodes.push(
                    <span key={propertyName}>
            <ObjectName name={propertyName || `""`}/>
            :&nbsp;
                        <ObjectValue object={propertyValue}/>
                        {ellipsis}
          </span>,
                );
                if (ellipsis) break;
            }
        }
        const objectClassName = compact ?
            object.constructor.name === 'Object' ? '' : object.constructor.name : object.constructor.name;
        return (
            <span className={classes.preview}>
                <span className={classes.objectClassName}>{`${objectClassName} `}</span>
                <span className={classes.objectBraces}>{'{'}</span>
                <span>{intersperse(propertyNodes, ', ')}</span>
                <span className={classes.objectBraces}>{'}'}</span>
            </span>
        );
    }
});

ObjectPreview.propTypes = {
    /**
     * max number of properties shown in the property view
     */
    maxProperties: PropTypes.number,
    compact: PropTypes.bool,
};
ObjectPreview.defaultProps = {
    maxProperties: 5,
};

export const ObjectRootLabel = ({name, data, compact}) => {
    if (typeof name === 'string') {
        return (
            <span>
        <ObjectName name={name}/>
        <span>: </span>
        <ObjectPreview data={data} compact={compact}/>
      </span>
        );
    } else {
        return <ObjectPreview data={data} compact={compact}/>;
    }
};

/**
 * if isNonenumerable is specified, render the name dimmed
 */
export const ObjectLabel = ({name, data, isNonenumerable}) => {
    const object = data;

    return (
        <span>
      <ObjectName name={name} dimmed={isNonenumerable}/>
      <span>: </span>
      <ObjectValue object={object}/>
    </span>
    );
};

ObjectLabel.propTypes = {
    /** Non enumerable object property will be dimmed */
    isNonenumerable: PropTypes.bool,
};

ObjectLabel.defaultProps = {
    isNonenumerable: false,
};
// end https://github.com/xyc/react-inspector/tree/master/src/object-inspector

export const createLiveObjectNodeRenderer = (traceProvider) => {
    const liveObjectNodeRenderer = {
        getWindowRef: () => traceProvider.trace.window,
        handleChange: null,
        expandPathsState: null,
        getExpandedPaths: (expandPathsState) => {
            if (expandPathsState) {
                return Object.keys(expandPathsState).filter(path => expandPathsState[path]);
            } else {
                return [];
            }
        },
        hideLiveRefs: false,
        parseLiveRefs: traceProvider.trace.parseLiveRefs,
    };

    liveObjectNodeRenderer.render = (props) => {
        const {depth, data, ...rest} = props;
        // const paths = liveObjectNodeRenderer.expandPathsState || {};
        // paths[path] = expanded;
        // if (expanded) {
        //   clearTimeout(this.leto);
        //   this.leto = setTimeout(() => {
        //     this.objectNodeRenderer.handleChange && this.objectNodeRenderer.handleChange();
        //   }, 500);
        // }
        //todo handle array and obj
        const liveRef = traceProvider.trace.parseLiveRefs(data, liveObjectNodeRenderer.hideLiveRefs);
        const isRoot = depth === 0;
        const objectLabel = isRoot ?
            <ObjectRootLabel data={liveRef.data} {...rest}/>
            : <ObjectLabel data={liveRef.data} {...rest}/>;

        return liveRef.isLive ?
            isRoot ?
                objectLabel :
                <ul style={{marginLeft: -12, marginTop: -12}}>
                    <Inspector data={liveRef.data}
                               nodeRenderer={liveObjectNodeRenderer.render}
                               windowRef={liveObjectNodeRenderer.getWindowRef()}
                               {...rest}
                    />
                </ul>
            : objectLabel;
    };
    currentLiveObjectNodeRenderer = liveObjectNodeRenderer;
    return currentLiveObjectNodeRenderer;
};

class OutputElementHover extends React.Component {
    state = {
        // originalStyle: null,
        // style: null,
        open: false,
    };
    handleEnter = el => {
        // if (el.style) {
        //     return () => {
        //         this.setState({
        //             style: {
        //                 border: '1px solid orange'
        //             },
        //             originalStyle: this.state.originalStyle || {
        //                 border: el.style.border
        //             }
        //         });
        //     };
        // } else {
        //     return noop;
        // }

        return () => {
            this.setState({
                // style: {
                //     border: '1px solid orange'
                // },
                // originalStyle: this.state.originalStyle || {
                //     border: el.style.border
                // }
                open: true
            });
        };
    };

    handleLeave = el => {
        // if (el.style) {
        //     return () => {
        //         this.setState({
        //             style: this.state.originalStyle,
        //         });
        //     };
        // } else {
        //     return noop;
        // }
        return () => {
            this.setState({
                // style: {
                //     border: '1px solid orange'
                // },
                // originalStyle: this.state.originalStyle || {
                //     border: el.style.border
                // }
                open: false
            });
        };
    };

    render() {
        const {el, children} = this.props;
        return <div onMouseEnter={this.handleEnter(el)} onMouseLeave={this.handleLeave(el)} children={children}/>;
    }

    componentDidUpdate() {
        const {el} = this.props;
        if (el) {

            // console.log('el', el);
            const clientRect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
            if (this.state.open) {
                if (clientRect) {
                    if (!this.locator) {
                        this.locator = document.createElement('div');
                        this.locator.style.position = 'absolute';
                        this.locator.style.backgroundColor = HighlightPalette.graphical;
                        this.locator.style.zIndex = '99999';

                        if (el.parentElement) {
                            el.parentElement.appendChild && el.parentElement.appendChild(this.locator);
                        } else {
                            try {
                                el.appendChild && el.appendChild(this.locator);
                            } catch (e) {
                                try {
                                    el.body.appendChild && el.body.appendChild(this.locator);
                                } catch (e) {
                                    this.locator = null;
                                }
                            }
                        }
                    }

                    if (this.locator) {
                        this.locator.style.display = 'block';
                        this.locator.style.top = `${clientRect.top}px`;
                        this.locator.style.left = `${clientRect.left}px`;
                        this.locator.style.height = `${clientRect.height}px`;
                        this.locator.style.width = `${clientRect.width}px`;
                    }
                }
            } else {
                if (this.locator) {
                    if (el.parentElement) {
                        el.parentElement.removeChild && el.parentElement.removeChild(this.locator);
                    } else {
                        try {
                            el.removeChild && el.removeChild(this.locator);
                        } catch (e) {
                            try {
                                el.body.removeChild && el.body.removeChild(this.locator);
                            } catch (e) {
                                this.locator = null;
                            }
                        }
                    }
                    this.locator = null;
                }


                // this.locator.style.display= 'none';
                // this.locator.style.top = '0px';
                // this.locator.style.left = '0px';
                // this.locator.style.height = '0px';
                // this.locator.style.width = '0px';
            }

        }
        // const {style} = this.state;
        // style && (el.style.border = style.border);
    }
}

OutputElementHover.propTypes = {
    el: PropTypes.object.isRequired,
};

export const Inspector = ({table = false, data, windowRef, nodeRenderer, ...rest}) => {

    return <ThemeContext.Consumer>
        {context => {
            const {inspectorTheme} = context;

            if (table) {
                return <TableInspector theme={inspectorTheme} data={data} {...rest} />;
            }

            if (isNode(data, windowRef)) {
                return <OutputElementHover el={data}>
                    <div style={{position: 'relative'}}>
                        <span style={{position: 'absolute', top: 0, color: 'grey', marginLeft: -15}}>
                          <MyLocationIcon style={{fontSize: 15}}/>
                        </span>
                        <DOMInspector theme={inspectorTheme} data={data} {...rest} />
                    </div>
                </OutputElementHover>;
            }

            return <ObjectInspector theme={inspectorTheme} data={data} nodeRenderer={nodeRenderer} {...rest} />

        }}
    </ThemeContext.Consumer>;
};

Inspector.propTypes = {
    data: PropTypes.any,
    name: PropTypes.string,
    table: PropTypes.bool,
};

// const diffToExpandPaths = (prevData, data) => {
//     return (deepDiff(prevData, data) || []).map(change => {
//         return change.path ? change.path.reduce((a, c) => `${a}.${c}`, '$') : '$';
//     });
// };

class ObjectExplorer extends React.Component {
    state = {
        isInit: false,
        prevData: null,
        expandPaths: [],
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const {data} = nextProps;
        const {prevData} = prevState;

        if (data === prevData) {
            return null;
        }

        return {
            isInit: true,
            prevData: data,
            // expandPaths: prevState.isInit ? /*diffToExpandPaths(prevData, data) : []
        };
    }

    render() {
        const {theme, data, objectNodeRenderer, expressionId, handleChange, ...rest} = this.props;
        const {expandPaths} = this.state;
        const liveRef = objectNodeRenderer.parseLiveRefs(data);
        //   console.log(expandPaths);
        return <Inspector
            key={expressionId}
            data={liveRef.data}
            nodeRenderer={objectNodeRenderer.render}
            windowRef={objectNodeRenderer.getWindowRef()}
            showNonenumerable={false}
            expandPaths={expandPaths}
            {...rest}
        />;
    }
}

export default ObjectExplorer;
