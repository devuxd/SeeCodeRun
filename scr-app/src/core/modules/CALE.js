export default function connectRequireToALE(scrObject, globalScrObjectString, onErrorDelay = 1000) { // connect ALE and browser
   scrObject.require = {
      scriptString:
         `<script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js" integrity="sha512-c3Nl8+7g4LMSTdrm621y7kf9v3SDPnhxLNhcjFJbKECVnmZHTdo+IRO05sNLTH/D3vA6u1X32ehoLC7WFVdheg==" crossorigin="anonymous"></script>`,
      fallbackOverrides: {},
      onErrorTid: null,
      errors: [],
      onError: (err) => {
         scrObject.require.errors.push(err);
         clearTimeout(scrObject.require.onErrorTid);
         scrObject.require.onErrorTid = setTimeout(() => {
               scrObject.require.onRequireSyncLoaded(scrObject.require.errors, scrObject.require.fallbackOverrides);
            },
            onErrorDelay
         )
      },
      requirejsLoad: (...params) => console.warn('requirejs.load is not set.', ...params),
      aleRequirejsLoad: (context, moduleName, url) => {
         scrObject.require.fallbackOverrides[moduleName] = url;
         return scrObject.require.requirejsLoad(context, moduleName, url);
      },
      bindingCode: `
      requirejs.onError = ${globalScrObjectString}.require.onError;
      ${globalScrObjectString}.require.requirejsLoad = requirejs.load;
      requirejs.load =${globalScrObjectString}.require.aleRequirejsLoad;
      // Ensure Mock
      var proto = Object.getPrototypeOf(requirejs);
      Object.defineProperties(proto, {
         ensure: {
            writable: false,
            value: function ensure (sources, cb) {
               return cb(requirejs);
            }
         }
      });`,
   };
   
   return scrObject.require;
   
}
