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
.view-click-guide{
  position:absolute;
  z-index:20;
  width:max-content;
  pointer-events:none;
  opacity:0;
  transform:translate3d(0,0,0);
  transition:left .42s cubic-bezier(.2,.8,.2,1),top .42s cubic-bezier(.2,.8,.2,1),opacity .2s ease;
}
.view-click-guide .guide-label{
  display:block;
  padding:8px 12px 7px;
  border:3px solid var(--ink);
  border-radius:999px;
  background:var(--ink);
  color:var(--paper);
  font:950 14px/1 -apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif;
  letter-spacing:.05em;
  white-space:nowrap;
  box-shadow:3px 3px 0 var(--guide-color,var(--pink));
  animation:guidePop .78s ease-in-out infinite alternate;
}
.view-click-guide .guide-arrow{
  display:block;
  margin:-1px 0 0 28px;
  color:var(--ink);
  font:950 22px/.8 Arial,sans-serif;
  animation:guideArrow .62s ease-in-out infinite alternate;
}
body.game-running .view-click-guide{display:none!important}
.view-card.guide-target .card-eye{transform:scale(1.07)}
@keyframes guidePop{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-4px) rotate(2deg)}}
@keyframes guideArrow{from{transform:translateY(0)}to{transform:translateY(5px)}}
@media(prefers-reduced-motion:reduce){.view-click-guide,.view-click-guide .guide-label,.view-click-guide .guide-arrow{transition:none!important;animation:none!important}}
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

    var list=document.querySelector('.view-list');
    var cards=list?Array.from(list.querySelectorAll('.view-card')):[];
    if(list&&cards.length){
      var guide=document.createElement('div');
      guide.className='view-click-guide';
      guide.setAttribute('aria-hidden','true');
      guide.innerHTML='<span class="guide-label">クリック！</span><span class="guide-arrow">↓</span>';
      list.appendChild(guide);
      var guideIndex=0;
      function placeGuide(index){
        if(document.body.classList.contains('game-running'))return;
        cards.forEach(function(card){card.classList.remove('guide-target')});
        var card=cards[index%cards.length];
        card.classList.add('guide-target');
        var lr=list.getBoundingClientRect();
        var er=card.querySelector('.card-eye').getBoundingClientRect();
        var left=er.left-lr.left+8;
        var top=er.top-lr.top-50;
        guide.style.setProperty('--guide-color',getComputedStyle(card).getPropertyValue('--c').trim()||'var(--pink)');
        guide.style.left=left+'px';
        guide.style.top=top+'px';
        guide.style.opacity='1';
      }
      placeGuide(guideIndex);
      setInterval(function(){
        if(document.body.classList.contains('game-running'))return;
        guideIndex=(guideIndex+1)%cards.length;
        placeGuide(guideIndex);
      },1150);
      window.addEventListener('resize',function(){placeGuide(guideIndex)},{passive:true});
    }
  }).catch(function(e){console.error('game load failed',e);});
})();