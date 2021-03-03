import React, {memo} from 'react';

const SCR = (
   {
      color = 'blue',
      secondaryColor = 'white',
      fontSize = 24,
      width = fontSize,
      height = fontSize,
      viewBox = '0 0 24 24',
   }
) => (
   <svg width={width} height={height} viewBox={viewBox} focusable="false">
      <g display="inline">
         <path
            transform="rotate(90.461181640625 12.072694778442383,12.085392951965334) "
            fill={color}
            d="m19.072694,1.102984l-4,0l-7.89,17.338479l-2.61,-6.356069l4.5,-10.982409l-4,0l-4.5,10.982409l4.5,10.982409l4,0l7.89,-17.338479l2.61,6.356069l-4.5,10.982409l4,0l4.5,-10.982409l-4.5,-10.982409z"/>
      </g>
      <g display="inline">
         <use fill={color} x="15.606685" y="3.943088"
              transform="matrix(0.4447879266866286,0,0,0.41308574795585584,-0.031206251237406946,5.38427125155174) "
              xlinkHref="#svg_25"
         />
         <g id="svg_32"/>
         <use fill={secondaryColor} x="19.076281" y="17.560824"
              transform="matrix(0.47098933876290605,0,0,0.45260745124332064,-2.4546274532953722,-1.3399645816995445) "
              xlinkHref="#svg_28"
         />
      </g>
      <defs>
         <symbol id="svg_25"
                 xmlns="http://www.w3.org/2000/svg">
            <path
               d="m12,2c-5.52,0 -10,4.48 -10,10s4.48,10 10,10s10,-4.48 10,-10s-4.48,-10 -10,-10zm-2,14.5l0,-9l6,4.5l-6,4.5z"/>
         </symbol>
         <symbol id="svg_28"
                 xmlns="http://www.w3.org/2000/svg">
            <path
               d="m10,16.5l6,-4.5l-6,-4.5l0,9zm2,-14.5c-5.52,0 -10,4.48 -10,10s4.48,10 10,10s10,-4.48 10,-10s-4.48,-10 -10,-10zm0,18c-4.41,0 -8,-3.59 -8,-8s3.59,-8 8,-8s8,3.59 8,8s-3.59,8 -8,8z"/>
         </symbol>
      </defs>
   </svg>
);

export default memo(SCR);
