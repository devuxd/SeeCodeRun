import isArray from 'lodash/isArray';

export const VisualQueryManager = {
    visualElements: [],
    visualQuery: [],
    getVisualIdsFromRefs: refsArray => {
        if (isArray(refsArray) && isArray(VisualQueryManager.visualElements)) {
            return refsArray.map(
                ref => VisualQueryManager.visualElements.indexOf(ref)
            ).filter(
                e => (-1 < e)
            );
        } else {
            return [];
        }
    },
    isGraphicalElementSelected: (domEl, visualQuery) => (
        visualQuery || VisualQueryManager.visualQuery
    ).includes(
        domEl
    ),
    onChange: (/*els, keys, event*/) => {
        //set on Pastebin's constructor
    },
};