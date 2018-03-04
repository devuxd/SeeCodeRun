// module.exports = function getDefaultTextForLanguage(language) {
export function getDefaultTextForLanguage(language) {
  switch (language) {
    case 'javascript':
      return javascriptDefaultText;
    case 'js':
      return javascriptDefaultText;
    case 'css':
      return cssDefaultText;
    case 'html':
      return htmlDefaultText;
    default:
      return htmlDefaultText;
  }
// };
}

const javascriptDefaultText =
  `function helloWorld(){
    console.log('hello world!');
  }
  helloWorld();
 `
;

const htmlDefaultText = `<!DOCTYPE html>
<html style="height:100%">
<head>
  <script type="text/javascript">
    let receivedCall = null;
    window.load = function (js, css) {
      receivedCall = {
        js: js,
        css: css
      };
    };
  </script>
</head>
<body>
<script type="text/javascript">
  let geval = eval;
  window.load = function (js, css) {
    if (css) {
      const style = document.createElement("style");
      style.type = "text/css";
      style.innerHTML = css;
      document.body.appendChild(style);
    }

    if (js) {
      try {
        geval(js);
      } catch (error) {
        console.log(error);
      }
    }
  };
  if (receivedCall) {
    window.load(receivedCall.js, receivedCall.css);
  }
</script>
</body>
</html>
`;

const cssDefaultText =
  `html, body{
   height: 100%;
  }
  `;
