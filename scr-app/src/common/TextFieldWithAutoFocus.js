import {useRef, useEffect} from 'react';
import TextField from '@mui/material/TextField';

const TextFieldWithAutoFocus = (
   {
      inputRef, focusOnDelay = 100, ...props
   }) => {
   const _inputRef = useRef();
   inputRef = inputRef ?? _inputRef;
   useEffect(() => {
         const tid = setTimeout(() => {
               inputRef.current?.focus();
            },
            focusOnDelay);
         
         return () => clearTimeout(tid);
      },
      [inputRef, focusOnDelay]
   );
   return <TextField {...props} inputRef={inputRef}/>;
};

export default TextFieldWithAutoFocus;
