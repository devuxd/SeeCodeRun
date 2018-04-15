let config = null;
let root = null;
let cloudFunctionsPath = null;
if (process.env.NODE_ENV === 'production') {
    root = '/scr2';
    config = {
        apiKey: "AIzaSyBmm0n6NgjksFjrM6D5cDX7_zw-QH9xwiI",
        authDomain: "seecoderun.firebaseapp.com",
        databaseURL: "https://seecoderun.firebaseio.com",
        projectId: "firebase-seecoderun",
        storageBucket: "firebase-seecoderun.appspot.com",
        messagingSenderId: "147785767581"
    };
    cloudFunctionsPath = 'cloud-functions';
} else { // your development firebase configuration:
    const devConfig = require('../firebaseDevConfig').default;
    root = devConfig.root;
    config = devConfig.config;
    cloudFunctionsPath = devConfig.cloudFunctionsPath;
}

export default {
    root, config, cloudFunctionsPath
}