(function(){
  'use strict';
  window.__ABOUT_MOBILE_TOUCH=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||(navigator.maxTouchPoints>0&&window.matchMedia('(hover:none)').matches);
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
      "function dragStart(e){if(gameRunning)return;gesture=true;dragPointer=e.pointerId;startY=e.clientY;maxDown=0;try{eye.setPointerCapture(e.pointerId)}catch(_){}}",
      "function dragStart(e){if(gameRunning||e.pointerType==='touch')return;gesture=true;dragPointer=e.pointerId;startY=e.clientY;maxDown=0;try{eye.setPointerCapture(e.pointerId)}catch(_){}}"
    );
    code=code.replace(
      "eye.addEventListener('pointerup',dragEnd);",
      "eye.addEventListener('pointerup',dragEnd);let heroTapX=0,heroTapY=0,heroTapAt=0;pupil.addEventListener('pointerdown',function(e){if(e.pointerType==='touch'){heroTapX=e.clientX;heroTapY=e.clientY;heroTapAt=performance.now()}},{passive:true});pupil.addEventListener('pointerup',function(e){if(e.pointerType==='touch'&&!gameRunning&&heroTapAt&&performance.now()-heroTapAt<450&&Math.hypot(e.clientX-heroTapX,e.clientY-heroTapY)<8)startDropGame();heroTapAt=0},{passive:true});pupil.addEventListener('pointercancel',function(){heroTapAt=0},{passive:true});eye.addEventListener('click',function(){if(!window.__ABOUT_MOBILE_TOUCH&&!gameRunning)startDropGame()});"
    );
    code=code.replace(
      "window.addEventListener('pointerdown',e=>{if(!gameRunning)return;if(e.target.closest&&e.target.closest('a'))return;steer=true;steerX=e.clientX+scrollX;pointerStartX=e.clientX;pointerStartY=e.clientY;markInteraction()},{passive:true});",
      "window.addEventListener('pointerdown',e=>{if(!gameRunning)return;if(e.target.closest&&e.target.closest('a'))return;pointerStartX=e.clientX;pointerStartY=e.clientY;if(e.pointerType==='mouse'){steer=true;steerX=e.clientX+scrollX;markInteraction()}else{steer=false}},{passive:true});"
    );
    code=code.replace(
      "window.addEventListener('pointermove',e=>{if(!gameRunning||!steer)return;const dx=e.clientX-pointerStartX,dy=e.clientY-pointerStartY;if(Math.abs(dy)>Math.abs(dx)+8)manualScroll=true;else steerX=e.clientX+scrollX;markInteraction()},{passive:true});",
      "window.addEventListener('pointermove',e=>{if(!gameRunning)return;if(e.pointerType==='mouse'){steer=true;steerX=e.clientX+scrollX;markInteraction();return}const dx=e.clientX-pointerStartX,dy=e.clientY-pointerStartY;if(Math.abs(dy)>Math.abs(dx)+6){manualScroll=true;steer=false;return}if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)+6){steer=true;steerX=e.clientX+scrollX;markInteraction()}},{passive:true});"
    );
    code=code.replace("touch-action:manipulation;cursor:pointer","touch-action:pan-y;cursor:pointer");
    code=code.replace(
      "idleGuide.textContent=screenY>innerHeight*.68?'↓ ページをスクロールして進む':'←→ 指で横になぞって動かす';",
      "const finePointer=window.matchMedia('(pointer:fine)').matches,atPageBottom=scrollY+innerHeight>=document.documentElement.scrollHeight-6;idleGuide.textContent=finePointer?(atPageBottom?'←→ マウスを左右に動かしてゴールへ':'↓ ホイールで下へ ｜ ←→ マウスを左右に動かす'):(screenY>innerHeight*.68&&!atPageBottom?'↓ ページをスクロールして進む':'←→ 指で横になぞって動かす');"
    );
    code=code.replace(
      "hint.textContent='←→ 横になぞる ｜ ↓ ページは自分でスクロール';",
      "hint.textContent=window.matchMedia('(pointer:fine)').matches?'←→ マウスを左右に動かす ｜ ↓ ホイールでスクロール':'←→ 横になぞる ｜ ↓ ページは自分でスクロール';"
    );
    code=code.replace(
      "const secretHints=['一番上の目玉の目線を、<b>下にしてみよう！</b>','上の大きな黒目を、<b>下へぐーっと動かす</b>と……？'];",
      "const secretHints=['一番上の大きな目を、<b>タップしてみよう！</b>','上の目を<b>タップ</b>すると、黒い球が落ちてくるよ。'];"
    );
    code=code.replace('ballVX=0;ballVY=90;','ballVX=0;ballVY=0;');
    code=code.replace('const STUCK_DELAY=2600;','const STUCK_DELAY=850;');
    code=code.replace('ballVY=Math.min(ballVY,680);','ballVY=Math.min(ballVY,1100);');
    code=code.replace("const gateY=scrollY+innerHeight*.74;if(ballY+ballR>gateY&&gateY<floorY-70){ballY=gateY-ballR;if(ballVY>0)ballVY=0}","");
    code=code.replace(
      "for(const o of obstacles){if(o.b<ballY-ballR-70||o.t>ballY+ballR+70)continue;collide(o)}const g=goalHit();",
      "for(const o of obstacles){if(o.b<ballY-ballR-70||o.t>ballY+ballR+70)continue;collide(o)}if(window.__ABOUT_MOBILE_TOUCH&&!steer)ballVX=0;if(!window.__ABOUT_MOBILE_TOUCH)releaseIfStuck(now);const g=goalHit();"
    );
    code=code.replace(
      "window.addEventListener('pointerup',()=>{steer=false},{passive:true});",
      "window.addEventListener('pointerup',()=>{steer=false;if(window.__ABOUT_MOBILE_TOUCH)ballVX=0},{passive:true});"
    );
    code=code.replace(
      "window.addEventListener('pointercancel',()=>{steer=false;manualScroll=true},{passive:true});",
      "window.addEventListener('pointercancel',()=>{steer=false;manualScroll=true;if(window.__ABOUT_MOBILE_TOUCH)ballVX=0},{passive:true});"
    );
    code=code.replace(
      "(()=>{\nconst main=document.querySelector('main');",
      "(()=>{\nif(window.__ABOUT_MOBILE_TOUCH)return;\nconst main=document.querySelector('main');"
    );
    Function(code)();

    var style=document.createElement('style');
    style.textContent=`
body:not(.game-running) .hero-eye-wrap{touch-action:pan-y!important;cursor:pointer}
body.game-running .hero-eye-wrap{touch-action:pan-y!important;cursor:pointer}
.hero-pupil{pointer-events:auto!important;cursor:pointer}
.view-click-guide{
  position:absolute;
  z-index:20;
  width:max-content;
  pointer-events:none;
  opacity:0;
  transform:translate3d(0,0,0);
  transition:left .62s cubic-bezier(.2,.8,.2,1),top .62s cubic-bezier(.2,.8,.2,1),opacity .25s ease;
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
  animation:guidePop 1.25s ease-in-out infinite alternate;
}
.view-click-guide .guide-arrow{
  display:block;
  margin:-1px 0 0 28px;
  color:var(--ink);
  font:950 22px/.8 Arial,sans-serif;
  animation:guideArrow 1s ease-in-out infinite alternate;
}
body.game-running .view-click-guide{display:none!important}
.view-card.guide-target .card-eye{transform:scale(1.07)}
@keyframes guidePop{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-4px) rotate(2deg)}}
@keyframes guideArrow{from{transform:translateY(0)}to{transform:translateY(5px)}}
@media(pointer:coarse),(hover:none){.view-click-guide,.view-click-guide *{transition:none!important;animation:none!important}}@media(prefers-reduced-motion:reduce){.view-click-guide,.view-click-guide .guide-label,.view-click-guide .guide-arrow{transition:none!important;animation:none!important}}
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
        if(!window.__ABOUT_MOBILE_TOUCH)card.classList.add('guide-target');
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
      if(!window.__ABOUT_MOBILE_TOUCH){
        setInterval(function(){
          if(document.body.classList.contains('game-running'))return;
          guideIndex=(guideIndex+1)%cards.length;
          placeGuide(guideIndex);
        },2000);
      }
      if(!window.__ABOUT_MOBILE_TOUCH)window.addEventListener('resize',function(){placeGuide(guideIndex)},{passive:true});
    }
  }).catch(function(e){console.error('game load failed',e);});
})();