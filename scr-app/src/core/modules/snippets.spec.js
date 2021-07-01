import snippets, {evaluateSnippet} from './snippets';

let i = 0;
const maxTextLength = 30;

describe(
   `ALE: og/ale code must eval to the same.`,
   () => {
      snippets.forEach((code, key) => {
         const trimmedCode = code.length > maxTextLength ?
            code.substring(0, maxTextLength - 3) + "..." : code;
         it(`Snippet ${key}:${trimmedCode}`, () => {
            const {ogResult, alResult, error, aleInstance} = evaluateSnippet(
               code, null, key
            );
            
            if (error) {
               expect(error).toMatchSnapshot();
            } else {
               if (ogResult.error) {
                  expect(ogResult.error).toMatchSnapshot();
                  expect(alResult.error).toMatchSnapshot();
                  expect(
                     aleInstance?.zale?.zones ?? []
                  ).toMatchSnapshot();
                  expect(
                     aleInstance?.zale?.importZones ?? []
                  ).toMatchSnapshot();
               } else {
                  let og = {result: (ogResult.error || ogResult.data)};
                  let al = {result: (alResult.error || alResult.data)};
                  
                  expect(og).toMatchSnapshot();
                  expect(al).toMatchSnapshot();
                  expect(og).toMatchObject(al);
               }
            }
         });
      });
      
   });
