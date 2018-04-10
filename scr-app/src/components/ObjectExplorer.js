import React from 'react';
import PropTypes from 'prop-types';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import {ObjectInspector, TableInspector, DOMInspector, ObjectValue, ObjectName} from 'react-inspector';
import Tooltip from 'material-ui/Tooltip';
// import deepDiff from 'deep-diff';

import {isNode} from '../utils/scrUtils';
import {ThemeContext} from '../pages/Index';

const noop = () => {
};

/* NOTE: Chrome console.log is italic */
const styles = {
    preview: {
        fontStyle: 'italic',
    },
};

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
export const ObjectPreview = ({data, maxProperties}) => {
    const object = data;

    if (
        typeof object !== 'object' ||
        object === null ||
        object instanceof Date ||
        object instanceof RegExp
    ) {
        return <ObjectValue object={object}/>;
    }

    if (Array.isArray(object)) {
        return (
            <span style={styles.preview}>
        [
                {intersperse(
                    object.map((element, index) => <ObjectValue key={index} object={element}/>),
                    ', ',
                )}
                ]
      </span>
        );
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

        return (
            <span style={styles.preview}>
        {`${object.constructor.name} {`}
        {intersperse(propertyNodes, ', ')}
        {'}'}
      </span>
        );
    }
};

ObjectPreview.propTypes = {
    /**
     * max number of properties shown in the property view
     */
    maxProperties: PropTypes.number,
};
ObjectPreview.defaultProps = {
    maxProperties: 5,
};

export const ObjectRootLabel = ({name, data}) => {
    if (typeof name === 'string') {
        return (
            <span>
        <ObjectName name={name}/>
        <span>: </span>
        <ObjectPreview data={data}/>
      </span>
        );
    } else {
        return <ObjectPreview data={data}/>;
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


export const createLiveObjectNodeRenderer = (traceProvider) => {
    const liveObjectNodeRenderer ={
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

    liveObjectNodeRenderer.render= (props) =>{
        const {depth, name, data, isNonenumerable/*, expanded, path*/} = props;
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
            <ObjectRootLabel name={name} data={liveRef.data}/>
            : <ObjectLabel name={name} data={liveRef.data} isNonenumerable={isNonenumerable}/>;

        return liveRef.isLive ?
            isRoot ?
                objectLabel :
                <ul style={{marginLeft: -12, marginTop: -12}}>
                    <Inspector data={liveRef.data}/>
                </ul>
            : objectLabel;
    };
    return liveObjectNodeRenderer;
};

class OutputElementHover extends React.Component {
    state = {
        originalStyle: null,
        style: null,
    };
    handleEnter = el => {
        if (el.style) {
            return () => {
                this.setState({
                    style: {
                        border: '1px solid orange'
                    },
                    originalStyle: this.state.originalStyle || {
                        border: el.style.border
                    }
                });
            };
        } else {
            return noop;
        }
    };

    handleLeave = el => {
        if (el.style) {
            return () => {
                this.setState({
                    style: this.state.originalStyle,
                });
            };
        } else {
            return noop;
        }
    };

    render() {
        const {el, children} = this.props;
        const {style} = this.state;
        style && (el.style.border = style.border);
        return <div onMouseEnter={this.handleEnter(el)} onMouseLeave={this.handleLeave(el)}>{children}</div>;
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
                    <Tooltip title="Locating in Browser" placement="right">
                        <div style={{position: 'relative'}}>
        <span style={{position: 'absolute', top: 0, color: 'grey', marginLeft: -15}}>
          <MyLocationIcon style={{fontSize: 15}}/>
        </span>
                            <DOMInspector theme={inspectorTheme} data={data} {...rest} />
                        </div>
                    </Tooltip>
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
