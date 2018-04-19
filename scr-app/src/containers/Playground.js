import React, {Component} from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash/isString';

class Playground extends Component {
    constructor(props){
        super(props);
        this.playgroundEl = React.createRef();
        this.currentBundle = null;
        this.unsubscribes = [];
    }

    runIframeHandler = {
        removeIframe:()=>{
            if (this.playgroundEl.current && this.runIframe) {
                this.playgroundEl.current.removeChild(this.runIframe);
                this.runIframe = null;
            }
        },
        createIframe :()=>{
            this.runIframeHandler.removeIframe();
            return document.createElement('iframe');
        },
        setIframe: (runIframe) => {
            if(!this.playgroundEl.current || ! runIframe){
                return
            }
            this.playgroundEl.current.appendChild(runIframe);
            this.runIframe = runIframe;
        },
        getIframe: () => {
            return this.runIframe;
        },
    };

    render() {
        return <div  ref={this.playgroundEl} className={this.props.appClasses.content} />;
    }

    componentDidMount() {
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

    /**
     *
     * @param {Object} bundle -  bundle.editorsTexts requires editorsTexts.html,
     * editorsTexts.css and editorsTexts.js to contain text.
     */
    updateIframe(bundle) {
        const playgroundEl = this.playgroundEl;
        if (!playgroundEl.current) {
            return;
        }
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
    appClasses: PropTypes.object.isRequired,
};

export default Playground;
