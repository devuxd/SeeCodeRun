let config = null;
let root = null;
let cloudFunctionsPath = null;
if (process.env.NODE_ENV === 'production') {
    const fbConfig = require('../firebaseProdConfig').default;
    root = fbConfig.root;
    config = fbConfig.config;
    cloudFunctionsPath = fbConfig.cloudFunctionsPath;
} else { // your development firebase configuration:
    const fbConfig = require('../firebaseDevConfig').default;
    root = fbConfig.root;
    config = fbConfig.config;
    cloudFunctionsPath = fbConfig.cloudFunctionsPath;
}

export default {
    root, config, cloudFunctionsPath
}