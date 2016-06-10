import 'jquery';
import 'jquery-ui';
import 'bootstrap';

import {MainConfig} from "main-config";

export function configure(aurelia) {
  let mainConfig = new MainConfig();
  if(mainConfig.debug){
    aurelia.use
    .standardConfiguration()
    .developmentLogging()
    .plugin('aurelia-computed', {
      enableLogging: true
    })
    ;
  }else{
    aurelia.use
    .standardConfiguration()
    .plugin('aurelia-computed')
    ;
    
  }


  //Uncomment the line below to enable animation.
  //aurelia.use.plugin('aurelia-animator-css');
  //if the css animator is enabled, add swap-order="after" to all router-view elements

  //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
  //aurelia.use.plugin('aurelia-html-import-template-loader')

  aurelia.start().then(a => a.setRoot());
}
