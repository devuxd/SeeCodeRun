import ALE, {setAutoLogIdentifiers, makeError, ALEError} from "./ALE";
import React from "react";

function evaluate(code) {
   let result = {data: undefined, error: null};
   try {
      result.data = eval(code);
   } catch (e) {
      // only for ogCode
      result.error = makeError(e);
   } finally {
      return result;
   }
}

export const evaluateSnippet = (
   code, tPath, key, onError, isActivateTraceChanges = false
) => {
   let getOgResult = () => {};
   let getAlResult = () => {};
   let ogResult = {};
   let alResult = {};
   let aleInstance = null;
   let error = null;
   try {
      const scrObjectIdentifierName = `scr${key}`;
      setAutoLogIdentifiers({
         scrObjectIdentifierName,
      });
      
      aleInstance = ALE(
         "js",
         tPath,
         global.top ?? global,
         true,
         // onError,
         key,
      );
      
      getOgResult = () => evaluate(aleInstance.getWrappedCode());
      
      getAlResult = () => {
         if (aleInstance.hasALECode()) {
            return evaluate(
               aleInstance.getWrappedALECode(isActivateTraceChanges)
            );
         } else {
            throw ALEError;
         }
      };
      
      aleInstance.setOriginalCode(code);
      ogResult = getOgResult();
      alResult = getAlResult();
      
   } catch (e) {
      error = makeError(e);
   } finally {
      return {
         aleInstance,
         getOgResult,
         ogResult,
         getAlResult,
         alResult,
         error,
      };
   }
};

const snippets = [
   `syntax error`,
   `semantic //error`,
   `const run ={};
    run.time.error;
  `,
   `function c(){
    const run ={};
    return run.time.error;
  }
  c();
  `,
   `function c(){}
  c();
  `,
   `function c(a){}
  c({val:1});
  `,
   `function c(a, r){}
  c(1, 2);
  `,
   `function c({}){}
  c({});
  `,
   `function c(...p){}
  c();
  `,
   `function c(){ return 1;}
  c();
  `,
   `function c(a,b){ return [a,b];}
  c(1,2);
  `, //10
   `
  class C {
    constructor(){
      function d(){return 4;}

      this.d = d;
    }
 }
 new C().d();
 `,
   `
  let c = function (){

    function c (){};
  };
  c();
  `,
   ` let c = (d)=>{d; return d;};
  c(1);
  `,
   `let c = d=>{d; return d;};
  c(1);`,
   `
  let c = ()=>{return 1};
  c(1);
  `,
   `let c = a=>a;
  c(1);`,
   `let f = [0, 1]; f;`,
   `let f = [[0,0], [0,1]]; f;`,
   `let {f=1} = {}; f;`,
   `function c(a=1){return 1;} c();`, // 20
   `let [...f] = [1]; f;`,
   `let ac = async ()=>await new Promise((r)=>r(1)); ac().then(v=>false &&console.warn('res',v));`,
   `let c = 1+2; c;`,
   `let a = 1, b = 2;
  let c = 1+a+b+(4*b);
   c;`,
   `
  function d(){function a(that){
    return this === that;
  }
  function c (){
    const b = a.bind(this);
    return b(this);
  }
  return c();
}
  d();
  `,
   `
  let d = 'd';
  const a = document.createElement('div');
  a.id = d;
  document.body.appendChild(a);
  let e = document.getElementById(d);
  e;`,
   `
  let c = 'c';
  switch(c){
    case 'c':
    break;
    default:
  }`,
   `let c = ()=>[0]; c();`,
   `if(true)
    undefined;
  `,
   `let i = 0; while(i++<10){}`, //30
   `if(true){undefined}else{}`,
   `let i = 0; while(i++<10){undefined; break;}`,
   `try{}catch(e){}`,
   `try{}finally{}`,
   `try{}catch(e){}`,
   `try{}catch(e){undefined;}finally{}`,
   `let a = 0;
  let [b = a] = [];
  b;`,
   `let c = ()=>()=>1; c()();`,
   `document.getElementById("test").addEventListener('click', ()=>{console.warn('click')});`,
   `class C{
    c (){

    }
  }
  C = class D{c(e){return [e,this.constructor.name]}};
  new C().c(1);
  `, //40
   `
  class D {
    constructor(x){
      this.x = x;
    }
  }
  class C extends D{
    constructor (x){
      super(x);
    }
  }
  new C(1).x;
  `,
   `class C{
    c(d){
this.d=()=>d;
return this;
    }
  }
  new C().c(1).d();
  `,
   `
  function c(){
    const X =class D{}
    return new X().constructor.name;
  }
  c();
  `,
   `throw new Error('User Error');`,
   `let c = {a:{b:{c:{d:1}}}}; c.a.b.c.d;`,
   `document.getElementById('test');`,
   `let c = 0; let a =[0,(c)=>c];
  a[++c](1);`,
   `class C{
    c = (v)=>v;
    d = 1;
  }
  const c = new C();
  c.c(c.d);
  `,
   `function c(x,y,z, ...rest){
    let a = x+y;
    const b = z+a++;

    return b+a+rest[0];
  }
  c(1, [].length, 1, 1);
  `,
   `
  let x = {};
  if(x && 7){
    x.x = 7;
  }else{
    x.x = 0;
  }
  x.x;
  `, //50
   `
  7?7:0;
  `,
   `
  7?7?7?0?0:7:0:0:0;
  `,
   `
  for(let i =0; i<10; i++){}
  `,
   `let c = '';
  switch(c){
    case 'a':
      case 'b':
        default:
  }`,
   `
  function* foo(index) {
    while (index < 2) {
      yield index;
      index++;
    }
  }
  
  const iterator = foo(0);
  
  iterator.next().value;
  iterator.next().value;
  `,
   `let a = [4,3,2,1,0];
  let b = [];
  for (let v in a){
    b.push(v);
  }
  b;
  `,
   `let c = typeof {};
  c;`,
   `[0, \`string \${0}\`];`,
   `
  let c = "";
  do { c = "c"; }while(false);
  c;`,
   `
  let j;
  for(let i=0;i<10;i++){
    j = i;
  }
  j;
  `, // 60
   `let i =0;
  for(i=0;i<10;i++){
  
  }
  i;`,
   `let a= [];
   let i =0;
  for(let v in [0, i++]){
    a.push(v);
  }
  a;
  `,
   `let a= [];
   let i =0;
  for(let v of [0, i++]){
    a.push(v);
  }
  a;
  // console.log(timeline);
  `,
   `let a= [];
  let v;
  let i =0;
  for(v of [0, i++]){
    a.push(v);
  }
  a;`,
   `
  let i = 0;
  let c = ()=>++i&&[i, i+1];

  let a = [];
  for(let v of c()){
    a.push(v);
  }
  a.unshift(i);
  a;
  `,
   `let a= [];
  let v;
  for(v of \`Hello, world!\${1}\`){
    a.push(v);
  }
  a;`,
   `let a= 0;
  let v;
  for(v of \`Hello, world!\${a++}\`){
  }
  a;`,
   `let a= 0;
  let v;
  for(v of 'Hello, world!'){
  }
  a;`,
   `
  const scriptEl = document.createElement('script');
  // scriptEl.type = 'text/babel';
  var inlineScript = document.createTextNode(
    \`
  // console.log('F');
    // let C = <div onClick={()=>{}}>React</div>;
    // ReactDOM.render(<C/>, document.getElementById('root'));
  \`
  );
  scriptEl.appendChild(inlineScript);
  document.body.appendChild(scriptEl);
  `,
   `<div t >{"h"}</div>;`, // 70
   `<div >{"h"}</div>;`,
   `<div attr="b" />;`,
   `<div attr={{}}></div>;`,
   `let C = <div attr="b">{"h"}</div>;`,
   `document?.getElementById('test')?.style;`,
   `/r/g`,
   `let f = [7];
  let [...g] = f;
  g;`,
   `let c = p=>p;
  c\`${"f"}\``,
   `<div />`,
   `<div v />`, // 80
   `<div v ="string"></div>`,
   `<div v ={"string"}></div>`,
   `<div v {...{}}></div>`,
   `<div><div /></div>`,
   `const C = props=>{
    const [v, sv] = useState(()=>{});
    return <div onClick={(event)=>{}}></div>;
  };`,
   `const c = ({v, w})=>[v, w];
  c({v:1, w:[5]});
  `,
   ` let c = [7,7,7];
    let [a, ...b] = [...c];
    [a, b]
  `,
   `import * as C from 'c';`,
   `import C from 'c';`,
   `import {a} from 'c';`, // 90
   `import {a, b as c} from 'c';`,
   `import C, {a, b as c} from 'c';`,
   `import 'c';`,
   `import  B, {c as A} from 'c';`,
   `import  A, {b as B} from 'c';
   import  C, {d as D} from 'd';
   let x = 7;
   import E from 'e';`,
   `async function c(){
    let C = await import('c');
   }`,
   `var c = require('c');`,
   `var c = require?.('c');`,
   `var c = import?.('c');`,
   `var _require = v=>v;
  var c = _require?.('c');
  c;
  `, // 100
   `var require = v=>v;
  var c = require?.('c');
  c;
  `,
   `var require = (r)=> new Promise(v=>v(r));
  var c = async ()=> {return await require?.('c');};
  c().then(v=>(false && console.log(v)));
  `,
   `
   let c = null
   function i(){
     c = import(\`c\`);
 };
 c;
 `,
   `
 let i = ()=>import(11);
 `,
   `// adapted from https://developer.mozilla.org/en-us/docs/Web/JavaScript/Reference/Statements/import
import defaultExport from "module-name";
import * as name from "module-name";
import { export1 } from "module-name";
import { export1 as alias1 } from "module-name";
import { export1_ , export2 } from "module-name";
import { foo , bar } from "module-name/path/to/specific/un-exported/file";
import { export1__ , export2 as alias2_ ,/* [...]*/ } from "module-name";
import defaultExport_, { export1___ /*[ , [...] ] */} from "module-name";
import defaultExport__, * as name_ from "module-name";
import "module-name";
var promise = ()=>import("module-name");
   `,
   `
   //highlights brackets and identifiers differently
<div></div>;
// the attributes too
<div v {...x}>{{...x}}</div>;
// even the brackets
<div v={{}}>{null}</div>;
// now it supports fragments highlighting
<><React.Fragment></React.Fragment></>;
// comments in JSX are recognized (trey uncommenting, commenting)
// <div ></div>;
<div
//
></div>;
<div >
{/**/}
</div>;
// go crazy
<div>
<>
<React.Fragment></React.Fragment>
</>
<div v></div>
<div v={{v:1, G:<div />}}>{()=><div ></div>}</div>
</div>;

let {...x} = {...x};

  // JSX code from the index file
  const EditorWrapper = ({ theme, language, editorDidMount }) => (
<Editor
  height="calc(100% - 19px)" // By default, it fully fits with its parent
  theme={theme}
  language={language}
  // loading={<Loader />}
  value={examples[language]}
  onMount={editorDidMount}
/>
  );
//...
  function App() {
const [theme, setTheme] = useState("light");
const [language, setLanguage] = useState("javascript");
const [isEditorReady, setIsEditorReady] = useState(false);
const [isJSXHighlight, setIsJSXHighlight] = useState(false);
const [isJSXComment, setIsJSXComment] = useState(false);
  //...
return (
  <React.Fragment
  // JSX comment example 1
  >
    {/* JSX comment example 2 */}
    <button
      style={{
        margin: 2,
        color:
          language !== "javascript"
            ? "grey"
            : isJSXHighlight
            ? "blue"
            : "purple"
      }}
      onClick={toggleJSXHighLighting}
      disabled={!isEditorReady || language !== "javascript"}
    >
      Toggle JSX highlighting
    </button>
    <button
      style={{
        margin: 2,
        color:
          language !== "javascript"
            ? "grey"
            : isJSXComment
            ? "blue"
            : "purple"
      }}
      onClick={toggleJSXcommenting}
      disabled={!isEditorReady || language !== "javascript"}
    >
      Toggle JSX Commenting
    </button>
    <LinkToRepo />
    <button onClick={toggleTheme} disabled={!isEditorReady}>
      Toggle theme
    </button>
    <button onClick={toggleLanguage} disabled={!isEditorReady}>
      Toggle language
    </button>
  
    <EditorWrapper
      theme={theme}
      language={language}
      editorDidMount={handleEditorDidMount}
    />
  </React.Fragment>
);
  }
  
  const rootElement = document.getElementById("root");
  ReactDOM.render(<App />, rootElement);

  const FragmentHighlight =<></>;
  //PeskyIssue
  <div className={styles.footer}>
{/* thanks Jorenm  */}
  <div className={styles.grid_container}>
    <div className={styles.blurb}>
      <a href="/" title="home page"><Image alt="logo" src="/images/small_logo.svg" width="31" height="32" /></a>
      <p>lorem ipsum dolar sit.</p>
    </div>
  </div>
</div>
   `,
   `<C {...x} />`,
   `<C>{...x}</C>`,
   `
    let C=<><div {...x} /><div v={null}>{...(()=>{return <span />})}</div></>;
    `,
   `!!window.scr_;`, // 110
   `for(let v of \`Hello, world!\`){
}`,
   `let z, y =     (true),   x, w= 10;`,
   `
for(let v of \`Hello, world!\`){
for (;;){
break;
}
for (let i =0;;){
break;
}
for (;(false);){
break;
}

for (;; true){
break;
}

for (let i =0;;i++){
break;
}

for (let i =0;i<10;i++){
break;
}

let f =0;
for (let i =0;i<100;i++)
 f=i;
 
}

let x =''
for(let v of \`Hello, world!\`)
x+=v;
x;
`,
   ` let a=false, b=false, c=false;
try{
a = true;
}catch(e){
 b =true;
}finally{
c = true;
}
[a, b, c];
`,
   ` let a=false, b=false, c=false;
try{
a = true;
let d = null.indexOf();
}catch(e){
 b =true;
}finally{
c = true;
}
[a, b, c];
`,
   `switch(true){
//
}`,
   `
 let c;
 switch(true){
case true:
c = true;
case false:
 break;
default:

}
c;
`,
   `
let c = 0; let a =[0,(c)=>c];
  a[++c]();
`,
   `let c =  0; --c;`,
   `let c = ()=>0; ((c())--); //error`, // 120
   `let c = {a:1, b:()=>1}; --(c.b()); //error`,
   `let c = {a:1}; --c.a;`,
   `let c = {a:1, b:2}; let {d, ...rest} = {...c, e:3};
 rest;`,
   `let c = [1, 2]; let [d, ...rest] = [...c, 3];
 rest;`,
   `let c= 7;`,
   `const c = [0,1];
const [d=1, e, f]= [...c, 3];
(d, e, f, [d,e,f]);
`,
   `const [c] = [];
const {d} = {};
(c, d)
`,
   `const [c, b, a] = [2,1,0];
[a,b,c]
`,
   `const {c, b, a} = {c:2,b:1,a:0};
[a,b,c]`,
   `(0,1,3)`, //130
   `1`,
   `(1)`,
   `(1);`,
   `const c = window.document.getElementById('root');`,
   `const a = window.document.getElementById('test');
   if(!a){
   const b = document.createElement("div");
   b.id = "test";
   document.body.appendChild(b);
   }
   const c = document.getElementById('test');
   c.addEventListener('click', function elc(event){
   // console.log(c);
   });
   //c.click();
   !!c;
   
   `,
   `const a = window.document.getElementById('test');
   if(!a){
   const b = document.createElement("div");
   b.id = "test";
   document.body.appendChild(b);
   }
   document.getElementById('test').addEventListener('click', function elc(event){
   // console.log(document.getElementById('test'));
   });
   !document.getElementById('test').click;
   `,
   `window.document;
   true;`,
   `const b =window.document.body;
   !!b;`,
   `const c = [[[()=>true]]];
c[0][0][0]()`,
   `const c = 1+ 8; c;`, //140
   `const c = 1+ 8 || true; c;`,
   `const c = 1? 8: true; c;`,
   `const c = new Array(); c;`,
   `const c = \`L\${'O'}L\`; c;`,
   `const c = <div>{null}</div>; c;`,
   `const c = <div c={null} />; c;`,
   `const c = true;
 const d = c||false; d;
`,
   `const c = [];
const d = {a: {b:1}, c}; d;
`,
   `const c = <>{null}</>; c;`,
   `let C=<div {...x} />; C;`, // 150
   `let C=<div>{...x}</div>; C;`,
   `let c = function (i){this.i = i;
return this;
};
c(this);
`,
   `let b = function (i){this.i = i;return this;};
   const c = (a)=>b(a);
c(this);
`,
   `const ac = async ()=>true;
ac().then(v=>v);`,
   `const ac = async ({d}, b = {})=>!!d||!!b||true;
ac({}).then(v=>v);`,
   `const c = (i)=>i<10?c(i+1):i;
c(0);
`,
   `
const c = (i)=>i<        10      ?     c        (i    +1)    :i;
c(           0);

c(           2);

   `,
   `
function _c(x, y){
   let z = x + y;
   return z;
}

function c(x, y){
   let z = x + y;
   return z;
}

let a = 0, b = c(10, 10);

while(a < b){
   a++;
}

a;
`,
   `
function doesNotExecute(x, y){
   let z = x + y;
   return z;
}

function executesOnce(x, y){
   let z = x + y;
   return z;
}

function executesRelativelyOnce(x, y){
   let z = x + y;
   return z;
}

function executesRelativelyTwice(x, y){
   let z = x + y;
   return z;
}

function recursive(a){
   if(a){
      return a+recursive(a-1);
   }
   
   return 0;
}


let a = 0, b = executesOnce(10, 10);

while(a < b){
   a++;
   executesRelativelyOnce(a,b);
   executesRelativelyTwice(a,b);
   executesRelativelyTwice(a,b);
}

a;

const ra= recursive(b);
const rb= recursive(b);
`,
   `
const a = (x=0, y=0)=>{
    return b(x) + b(y);
};
const b = (z=0)=>{
   return z*10;
};

a(1,2);
b(3);
`,
   `
function recursive(a){
   if(a){
      return a+recursive(a-1);
   }
   
   return 0;
}
const ra= recursive(3);
`,
   `
for(let i = 0; i<3;i++){
   if(i){
      continue;
   }
   let j = i+i;
}
`,
   
   `
function f(){
   try{

   }catch(e){

   undefined;
   }finally{
      return 1;
   }
}
f();
`,
   `
function f(isThrow){
   try{
   
   if(isThrow){
      throw Error('boing!');
   }

   }catch(e){

   undefined;
   }finally{
      return 1;
   }
}
f();
f(true)
`,
   `
let ii = 10;
while(ii--){
let jjj = ii+10;
}
`,
   `
  var rootEl = document.getElementById('root');//rrr
let f ={d:{e:{g:[1,2,3]}}};
let ix =0, gx =0;
let arr = (p)=>++p;
let funk = function(P){};
arr(0); arr(0);
funk();

function fe(value, i) {
    let a = 0, r = Math.floor(Math.random()*10), odd=0;
    while(a<r){
        a++;
        gx++;
        if(a%2){
            odd++;
        }
    }
    return i;
}
// // async function fx(){

// // }

function fx(a){
   return a;
}

let gg = new Array(20);
gg = gg.fill(true);
if(!document.getElementById('bu')){
   const node = document.createElement("div");
   node.id = "bu";
   node.style.width = "100px";
   node.style.height = "100px";
   document.body.appendChild(node);
}
document.getElementById('bu').addEventListener(
    'click', function(
        e, r) {
        console.log('cl6', f, ix++);
        gg.forEach(fe);
        
        fx(ix);
    }
);

   `,
// ``,
];

export default snippets;
