import React, {Component} from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

class Playground extends Component {
  playgroundEl = null;
  currentBundle = null;
  unsubscribes = [];

  render() {
    const {appClasses} = this.props;
    return (
      <div className={appClasses.content}
           ref={ref => {
             this.playgroundEl = ref || this.playgroundEl;
           }}
      />
    );
  }

  componentDidMount() {
    this.unsubscribes = [];
    const {store} = this.context;
    const unsubscribe0 = store.subscribe(() => {
      const timestamp = store.getState().updateBundleReducer.timestamp;
      const bundle = store.getState().updateBundleReducer.bundle;

      if (timestamp !== this.timestamp) {
        this.timestamp = timestamp;
        if (this.playgroundEl && this.runIframe) {
          this.playgroundEl.removeChild(this.runIframe);
          this.runIframe = null;
        }
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
    if (!playgroundEl) {
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

    if (!_.isString(html) || !_.isString(css) || !_.isString(js) || !_.isString(alJs)) {
      // console.log("[CRITICAL ERROR]: editor[s] text[s] missing", html, css, js, alJs);
    }

    if (alJs) {
      // console.log("AL");
      const runIframe = document.createElement('iframe');
      autoLog.configureIframe(runIframe, store, autoLogger, html, css, js, alJs);
      playgroundEl.appendChild(runIframe);
      this.runIframe = runIframe;
    } else {
      if (autoLogger && autoLogger.ast) {
        console.log("FB");
        const runIframe = document.createElement('iframe');
        playgroundEl.appendChild(runIframe);
        autoLog.configureIframe(runIframe, store, autoLogger, html, css, js, js);
        this.runIframe = runIframe;
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
