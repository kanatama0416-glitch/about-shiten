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
    code=code.replace(
      "function dragEnd(e){if(!gesture||gameRunning||(dragPointer!==null&&e.pointerId!==dragPointer))return;gesture=false;dragPointer=null;try{eye.releasePointerCapture(e.pointerId)}catch(_){}pupil.classList.remove('drop-ready');if(maxDown>=DROP_DISTANCE)startDropGame()}",
      "function dragEnd(e){if(!gesture||gameRunning||(dragPointer!==null&&e.pointerId!==dragPointer))return;gesture=false;dragPointer=null;try{eye.releasePointerCapture(e.pointerId)}catch(_){}pupil.classList.remove('drop-ready');if(maxDown>=DROP_DISTANCE||maxDown<8)startDropGame()}"
    );
    code=code.replace(
      "window.addEventListener('pointermove',e=>{if(!gameRunning||!steer)return;const dx=e.clientX-pointerStartX,dy=e.clientY-pointerStartY;if(Math.abs(dy)>Math.abs(dx)+8)manualScroll=true;else steerX=e.clientX+scrollX;markInteraction()},{passive:true});",
      "window.addEventListener('pointermove',e=>{if(!gameRunning||!steer)return;const dx=e.clientX-pointerStartX,dy=e.clientY-pointerStartY;if(Math.abs(dy)>Math.abs(dx)+8){manualScroll=true;steer=false}else steerX=e.clientX+scrollX;markInteraction()},{passive:true});"
    );
    code=code.replace("touch-action:manipulation;cursor:pointer","touch-action:pan-y;cursor:pointer");
    code=code.replace(
      "const secretHints=['一番上の目玉の目線を、<b>下にしてみよう！</b>','上の大きな黒目を、<b>下へぐーっと動かす</b>と……？'];",
      "const secretHints=['一番上の大きな黒目を、<b>タップしてみよう！</b>','黒目を<b>タップ</b>すると、何か落ちてくるかも……？'];"
    );
    Function(code)();

    var style=document.createElement('style');
    style.textContent=`
.hero-eye-wrap{touch-action:pan-y!important;cursor:pointer}
`;
    document.head.appendChild(style);

    var hero=document.getElementById('heroEye');
    if(hero)hero.setAttribute('aria-label','黒目をタップしてゲームを始める');
  }).catch(function(e){console.error('game load failed',e);});
})();
