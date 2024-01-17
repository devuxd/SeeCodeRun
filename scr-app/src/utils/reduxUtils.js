export function isActivatePlayground({
                                  updateBundleReducer,
                                  firecoReducer,
                              }){
    const {isFirecoEditorsReady} = firecoReducer;
    const {bundle} = updateBundleReducer;

    return isFirecoEditorsReady && !!bundle;
}
