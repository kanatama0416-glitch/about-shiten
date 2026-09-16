(function(){
  'use strict';
  fetch('./game-core.js',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('game core '+r.status);return r.text();}).then(function(code){
    code=code.replace(
      "const width=Math.min(document.documentElement.clientWidth,720),left=ballR+7,right=width-ballR-7;",
      "const br=document.querySelector('main').getBoundingClientRect(),left=br.left+scrollX+ballR+7,right=br.right+scrollX-ballR-7;"
    );
    code=code.replace(
      "const width=Math.min(document.documentElement.clientWidth,720),mid=width/2;",
      "const br=document.querySelector('main').getBoundingClientRect(),mid=(br.left+br.right)/2+scrollX;"
    );
    code=code.replace(
      "else{const width=Math.min(document.documentElement.clientWidth,720);ballX=Math.max(ballR+8,Math.min(width-ballR-8,ballX));ballVY=Math.max(ballVY,260)}",
      "else{const br=document.querySelector('main').getBoundingClientRect(),left=br.left+scrollX+ballR+8,right=br.right+scrollX-ballR-8;ballX=Math.max(left,Math.min(right,ballX));ballVY=Math.max(ballVY,260)}"
    );
    code=code.replace(
      "const left=ballR+5,right=Math.min(document.documentElement.clientWidth,720)-ballR-5;",
      "const br=document.querySelector('main').getBoundingClientRect(),left=br.left+scrollX+ballR+5,right=br.right+scrollX-ballR-5;"
    );
    Function(code)();

    var style=document.createElement('style');
    style.textContent=`
.hero-eye-wrap{touch-action:pan-y!important}
body.shiten-game-armed .hero-eye-wrap{touch-action:none!important}
`;
    document.head.appendChild(style);

    var goal=document.getElementById('goalEye');
    if(goal){
      goal.addEventListener('click',function(){document.body.classList.add('shiten-game-armed');});
      goal.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' ')document.body.classList.add('shiten-game-armed');});
    }
  }).catch(function(e){console.error('game load failed',e);});
})();
