import React, {Component} from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash/isString';
import GraphicalMapper from './GraphicalMapper';

class Playground extends Component {
    constructor(props) {
        super(props);
        this.playgroundEl = React.createRef();
        this.currentBundle = null;
        this.unsubscribes = [];
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
        const {isGraphicalLocatorActive, handleChangeGraphicalLocator} = this.props;
        const {bundle, visualElements} = this.state;
        return <React.Fragment>
            <div ref={this.playgroundEl}
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
        if (this.props.exports) {
            this.props.exports.onResize = this.onResize;
        }
        this.unsubscribes = [];
        const {store} = this.context;
        const unsubscribe0 = store.subscribe(() => {
            const timestamp = store.getState().updateBundleReducer.timestamp;
            const bundle = store.getState().updateBundleReducer.bundle;

            if (timestamp !== this.timestamp) {
                this.timestamp = timestamp;
                this.runIframeHandler.removeIframe();
            }

            if (this.currentBundle !== bundle) {
                if (bundle) {
                    this.currentBundle = bundle;
                    this.updateIframe(this.currentBundle);
                } else {
                    // this.currentBundle = bundle;
                    //  console.log('ERROR');
                }
            }
        });
        this.unsubscribes.push(unsubscribe0);
    }


    componentWillUnmount() {
        for (const i in this.unsubscribes) {
            this.unsubscribes[i]();
        }
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
        if (!bundle || !playgroundEl.current) {
            return;
        }
        bundle.isActive = false;

        const {editorIds} = this.props;
        const {store} = this.context;

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
            // console.log("AL");
            autoLog.configureIframe(this.runIframeHandler, store, autoLogger, html, css, js, alJs);
            autoLogger.trace.setDomNodeAdded(this.handleChangeVisualElements);
            bundle.isActive = true;
        } else {
            if (autoLogger && autoLogger.ast) {
                console.log("FB");
                autoLog.configureIframe(this.runIframeHandler, store, autoLogger, html, css, js, js);
            } else {
                console.log("CRITICAL");
            }
        }
    }

}

Playground.contextTypes = {
    store: PropTypes.object.isRequired
};

Playground.propTypes = {
    editorIds: PropTypes.object.isRequired,
};

export default Playground;
