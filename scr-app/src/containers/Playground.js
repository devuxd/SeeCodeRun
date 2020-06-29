import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import isString from 'lodash/isString';
import GraphicalMapper from './GraphicalMapper';
import {d} from "./Pastebin";
import {
    // updatePlaygroundLoadFailure,
    updatePlaygroundLoadSuccess
} from "../redux/modules/playground";

const data = {};

const mapStateToProps = ({updateBundleReducer, firecoReducer}) => {
    const {isFirecoEditorsReady} = firecoReducer;
    const {timestamp, bundle, isFirstBundle} = updateBundleReducer;
    return {
        timestamp,
        bundle,
        activatePlayground: isFirecoEditorsReady && isFirstBundle,
    };
};
const mapDispatchToProps = {updatePlaygroundLoadSuccess};

class Playground extends Component {
    constructor(props) {
        super(props);
        this.playgroundEl = React.createRef();
        this.state = {
            isResizing: false,
            bundle: null,
            visualElements: [],
        };
    }

    runIframeHandler = {
        removeIframe: () => {
            if (this.playgroundEl.current && this.runIframe) {
                this.playgroundEl.current.removeChild(this.runIframe);
                this.runIframe = null;
                return true;
            }
            return false;
        },
        createIframe: () => {
            this.runIframeHandler.removeIframe();
            return document.createElement('iframe');
        },
        appendIframe: (runIframe) => {
            if (!this.playgroundEl.current || !runIframe) {
                return false;
            }
            this.playgroundEl.current.appendChild(runIframe);
            this.runIframe = runIframe;
            return true;
        },
        getIframe: () => {
            return this.runIframe;
        },
    };

    onResize = (isResizing) => {
        this.setState({isResizing});
    };

    render() {
        const {
            isGraphicalLocatorActive, handleChangeGraphicalLocator, activatePlayground,
        } = this.props;
        const {bundle, visualElements} = this.state;
        return activatePlayground && <React.Fragment>
            <div
                style={{
                    overflow: 'hidden'
                }}
            >
                <GraphicalMapper
                    containerRef={this.playgroundEl}
                    bundle={bundle}
                    isGraphicalLocatorActive={isGraphicalLocatorActive}
                    handleChangeGraphicalLocator={handleChangeGraphicalLocator}
                    visualElements={visualElements}
                />
            </div>


            <div ref={this.playgroundEl}
                 style={{
                     height: '100%',
                     width: '100%',
                 }}
            />
            {this.state.isResizing &&
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                backgroundColor: 'transparent',
            }} onClick={() => this.onResize(false)}/>}
        </React.Fragment>;
    }

    componentDidMount() {
        const {onResize} = this.props;
        onResize && onResize(this.onResize);
    }

    componentDidUpdate(prevProps) {
        const {bundle} = this.props;
        if (prevProps.bundle !== bundle) {
            this.runIframeHandler.removeIframe();
            this.updateIframe(bundle);
        }
    }

    componentWillUnmount() {
        const {onResize} = this.props;
        onResize && onResize(null);
    }

    handleChangeVisualElements = visualElements => {
        this.setState({visualElements});
    };

    /**
     *
     * @param {Object} bundle -  bundle.editorsTexts requires editorsTexts.html,
     * editorsTexts.css and editorsTexts.js to contain text.
     */
    updateIframe = (bundle) => {
        const playgroundEl = this.playgroundEl;
        if (!bundle || !bundle.editorsTexts || !playgroundEl.current) {
            return;
        }
        bundle.isActive = false;

        const {editorIds, updatePlaygroundLoadSuccess} = this.props;

        const html = bundle.editorsTexts[editorIds['html']];
        const css = bundle.editorsTexts[editorIds['css']];
        const js = bundle.editorsTexts[editorIds['js']];
        const alJs = bundle.alJs;// Auto-logged script.
        const autoLog = bundle.autoLog; // manager
        const autoLogger = bundle.autoLogger;// Auto-logged  results and bindings

        if (!isString(html) || !isString(css) || !isString(js) || !isString(alJs)) {
            // console.log("[CRITICAL ERROR]: editor[s] text[s] missing", html, css, js, alJs);
        }

        if (alJs) {
            // console.log(alJs);
            autoLog.configureIframe(this.runIframeHandler, updatePlaygroundLoadSuccess, autoLogger, html, css, js, alJs);
            if (data.to) {
                data.from = data.to;
                data.to = alJs;
                d.log(new Date(), `autoLog.configureIframe(this.runIframeHandler, store, autoLogger, html, css, js, alJs);
          `, null, data.from, data.to);
                data.to = null;

            } else {
                data.to = alJs;
            }
            // d.log(new Date(), `locationMap[parentId].extraLocs = prev || {};`, null, JSON.stringify(prev), JSON.stringify(locationMap[parentId].extraLocs));
            autoLogger.trace.setDomNodeAdded(this.handleChangeVisualElements);
            bundle.isActive = true;
        } else {
            if (autoLogger && autoLogger.ast) {
                // console.log("FB");
                autoLog.configureIframe(this.runIframeHandler, updatePlaygroundLoadSuccess, autoLogger, html, css, js, js);
            } else {
                console.log("CRITICAL");
            }
        }
    }

}

Playground.propTypes = {
    editorIds: PropTypes.object.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Playground);
