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
      "function dragEnd(e){if(!gesture||gameRunning||(dragPointer!==null&&e.pointerId!==dragPointer))return;gesture=false;dragPointer=null;try{eye.releasePointerCapture(e.pointerId)}catch(_){}pupil.classList.remove('drop-ready');if(maxDown>=DROP_DISTANCE)startDropGame()}"
    );
    code=code.replace(
      "eye.addEventListener('pointerup',dragEnd);",
      "eye.addEventListener('pointerup',dragEnd);eye.addEventListener('click',function(){if(!gameRunning)startDropGame()});"
    );
    code=code.replace(
      "window.addEventListener('pointermove',e=>{if(!gameRunning||!steer)return;const dx=e.clientX-pointerStartX,dy=e.clientY-pointerStartY;if(Math.abs(dy)>Math.abs(dx)+8)manualScroll=true;else steerX=e.clientX+scrollX;markInteraction()},{passive:true});",
      "window.addEventListener('pointermove',e=>{if(!gameRunning||!steer)return;const dx=e.clientX-pointerStartX,dy=e.clientY-pointerStartY;if(Math.abs(dy)>Math.abs(dx)+8){manualScroll=true;steer=false}else steerX=e.clientX+scrollX;markInteraction()},{passive:true});"
    );
    code=code.replace("touch-action:manipulation;cursor:pointer","touch-action:pan-y;cursor:pointer");
    code=code.replace(
      "const secretHints=['一番上の目玉の目線を、<b>下にしてみよう！</b>','上の大きな黒目を、<b>下へぐーっと動かす</b>と……？'];",
      "const secretHints=['一番上の大きな目を、<b>タップしてみよう！</b>','上の目を<b>タップ</b>すると、黒い球が落ちてくるよ。'];"
    );
    code=code.replace('ballVX=0;ballVY=90;','ballVX=0;ballVY=0;');
    code=code.replace('ballVY=Math.min(ballVY,680);','ballVY=Math.min(ballVY,1100);');
    code=code.replace("const gateY=scrollY+innerHeight*.74;if(ballY+ballR>gateY&&gateY<floorY-70){ballY=gateY-ballR;if(ballVY>0)ballVY=0}","");
    Function(code)();

    var style=document.createElement('style');
    style.textContent=`
body:not(.game-running) .hero-eye-wrap{touch-action:none!important;cursor:pointer}
body.game-running .hero-eye-wrap{touch-action:pan-y!important;cursor:pointer}
.hero-pupil{pointer-events:auto!important;cursor:pointer}
body:not(.game-running) .view-card::after{
  content:'クリック！';
  position:absolute;
  left:119px;
  top:82px;
  z-index:4;
  color:var(--c);
  font:950 10px/1 -apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif;
  letter-spacing:.04em;
  white-space:nowrap;
  pointer-events:none;
  opacity:0;
  transform:translateY(5px) scale(.94);
  animation:aboutClickRelay 6s ease-in-out infinite;
}
body:not(.game-running) .view-card:nth-child(1)::after{animation-delay:0s}
body:not(.game-running) .view-card:nth-child(2)::after{animation-delay:1.2s}
body:not(.game-running) .view-card:nth-child(3)::after{animation-delay:2.4s}
body:not(.game-running) .view-card:nth-child(4)::after{animation-delay:3.6s}
body:not(.game-running) .view-card:nth-child(5)::after{animation-delay:4.8s}
body.game-running .view-card::after{content:none!important;animation:none!important}
@keyframes aboutClickRelay{
  0%,4%,24%,100%{opacity:0;transform:translateY(5px) scale(.94)}
  8%,18%{opacity:1;transform:translateY(0) scale(1)}
}
@media(prefers-reduced-motion:reduce){body:not(.game-running) .view-card::after{animation:none;opacity:1}.view-card:nth-child(n+2)::after{display:none}}
`;
    document.head.appendChild(style);

    var hero=document.getElementById('heroEye');
    var pupil=document.getElementById('heroPupil');
    if(hero){
      hero.setAttribute('role','button');
      hero.setAttribute('tabindex','0');
      hero.setAttribute('aria-label','下に引くかタップして黒い球のゲームを始める');
    }
    if(pupil)pupil.setAttribute('aria-hidden','true');
  }).catch(function(e){console.error('game load failed',e);});
})();