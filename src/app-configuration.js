export class AppConfiguration{
    isDebug = true;
    debugConfiguration = {
        isDebug: true,
        mainConfigure: function debugMainConfigure(aurelia){
            aurelia.use
            .standardConfiguration()
            .developmentLogging()
            .plugin('aurelia-computed', {
              enableLogging: true
            });
        },
        firebaseURL: "https://seecoderun.firebaseio.com/test"
    };
    deployConfiguration = {
        isDebug: false,
        mainConfigure: function deployMainConfigure(aurelia){
            aurelia.use
            .standardConfiguration()
            .plugin('aurelia-computed');
        },
        firebaseURL: "https://seecoderun.firebaseio.com/production"
    };

  getConfiguration(isDev = this.isDebug) {
    return isDev ? this.debugConfiguration : this.deployConfiguration;
    }
}
