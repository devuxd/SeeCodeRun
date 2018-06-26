import {VisualQueryListener} from '../../containers/Pastebin';
class GraphicalMapper {
    bundle = null;
    isGraphicalLocatorActive = false;

    constructor(bundle, isGraphicalLocatorActive) {
        this.bundle = bundle;
        this.isGraphicalLocatorActive = isGraphicalLocatorActive;
        this.handleChange();
    }

    locateElements(bundle, isGraphicalLocatorActive) {
        if (bundle.autoLogger && bundle.autoLogger.trace && bundle.autoLogger.trace.domNodes) {

            if (isGraphicalLocatorActive) {
                this.locatedEls = [];
                bundle.autoLogger.trace.domNodes.forEach((el, key) => {
                    if (el.tagName === 'STYLE') {
                        return;
                    }
                    const locator = document.createElement('span');
                    locator.style.position = 'absolute';
                    locator.style.top = '0px';
                    locator.style.right = '0px';
                    const locatorContent = document.createElement('div');
                    locatorContent.style.backgroundColor = 'darkorange';
                    locatorContent.style.color = 'white';
                    locatorContent.style.zIndex = '999999';
                    locatorContent.style.fontWeight = '500';
                    locatorContent.style.fontSize = '8px';
                    locatorContent.innerHTML = '<>';
                    locatorContent.onclick = () => {
                        VisualQueryListener.onChange(el, key);
                    };

                    el.appendChild(locator);
                    locator.appendChild(locatorContent);
                    this.locatedEls.push({el, border: el.style.border || 'unset', locator});
                    el.style.border = 'dashed 1px darkorange';
                });
            } else {
                if (this.locatedEls) {
                    this.locatedEls.forEach(en => {
                        en.el.removeChild(en.locator);
                        en.el.style.border = en.border;
                    });
                    this.locatedEls = null;
                }
            }

        }

    }

    onActiveChange(isGraphicalLocatorActive) {
        this.isGraphicalLocatorActive = isGraphicalLocatorActive;
        this.handleChange();
    }

    handleChange() {
        this.locateElements(this.bundle, false);
        if (this.isGraphicalLocatorActive) {
            this.locateElements(this.bundle, true);
        }
    }

    configureHandleChange() {
        return () => this.handleChange();
    }
}

export default GraphicalMapper;