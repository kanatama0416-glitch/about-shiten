(function(){
'use strict';

const eye=document.getElementById('heroEye');
const pupil=document.getElementById('heroPupil');
const goal=document.getElementById('goalEye');
const goalPupil=document.getElementById('goalPupil');
if(!eye||!pupil||!goal||!goalPupil)return;

const mobile=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||(navigator.maxTouchPoints>0&&matchMedia('(hover:none)').matches);

const style=document.createElement('style');
style.textContent=`
.game-ball{position:fixed;left:0;top:0;width:40px;height:40px;z-index:9999;display:none;pointer-events:none;will-change:transform,width,height}
.game-ball.on{display:block}
.game-ball-dot{width:100%;height:100%;border-radius:50%;background:var(--ink)}
body.game-running{touch-action:pan-y;overscroll-behavior-y:auto}
body.game-running .hero-pupil{opacity:0}
body.game-running #goalPupil{opacity:0}
.game-simple-hint{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10000;background:var(--paper);border:2px solid var(--ink);border-radius:999px;padding:8px 13px;font:800 10px/1 system-ui,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .18s}
.game-simple-hint.show{opacity:1}
.game-result{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.88);z-index:10001;background:var(--paper);border:4px solid var(--ink);box-shadow:8px 8px 0 var(--pink);padding:18px 24px;text-align:center;pointer-events:none;opacity:0;transition:.22s}
.game-result.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
.game-result strong{display:block;font:950 38px/.95 Arial,sans-serif}.game-result small{display:block;font:900 9px/1 Arial,sans-serif;letter-spacing:.2em;margin-bottom:8px}
.game-eye-hit{animation:gameEyeHitSimple .34s ease}@keyframes gameEyeHitSimple{50%{transform:scale(1.08)}}
.hero-eye-wrap{touch-action:pan-y!important}
.view-click-guide{position:absolute;z-index:20;width:max-content;pointer-events:none;opacity:0;transition:left .62s cubic-bezier(.2,.8,.2,1),top .62s cubic-bezier(.2,.8,.2,1),opacity .2s}
.view-click-guide .guide-label{display:block;padding:8px 12px 7px;border:3px solid var(--ink);border-radius:999px;background:var(--ink);color:var(--paper);font:950 14px/1 system-ui,sans-serif;white-space:nowrap;box-shadow:3px 3px 0 var(--guide-color,var(--pink))}
.view-click-guide .guide-arrow{display:block;margin:-1px 0 0 28px;color:var(--ink);font:950 22px/.8 Arial,sans-serif}
body.game-running .view-click-guide{display:none!important}
`;
document.head.appendChild(style);

const ball=document.createElement('div');
ball.className='game-ball';
ball.innerHTML='<div class="game-ball-dot"></div>';
document.body.appendChild(ball);

const hint=document.createElement('div');
hint.className='game-simple-hint';
hint.textContent=mobile?'←→ 指で左右になぞる ｜ ↓ ページはそのままスクロール':'←→ マウスで左右に動かす';
document.body.appendChild(hint);

const result=document.createElement('div');
result.className='game-result';
document.body.appendChild(result);

let running=false;
let ballX=0,ballY=0,ballVY=0,ballR=20,last=0,floorY=0,startAt=0;
let touchId=null,startX=0,startY=0,mode='none';
let checkpoints=[],obstacles=[];const checkpointSizes=[30,24,20,28,22,18,26,20];let checkpointIndex=0;

function mainBounds(){
  const r=document.querySelector('main').getBoundingClientRect();
  return {left:r.left+scrollX+ballR+6,right:r.right+scrollX-ballR-6};
}
function clampX(x){
  const b=mainBounds();
  return Math.max(b.left,Math.min(b.right,x));
}
function textRects(){
  const sels=['.flow-copy h2 .line','.flow-lead','.flow-copy > p:not(.flow-lead)','.choose-kicker','.choose h2','.choose-intro','.view-index','.view-note','.go','.section-no','.info-cell small','.info-cell b'];
  const out=[];
  document.querySelectorAll(sels.join(',')).forEach(el=>{
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    let n;
    while(n=walker.nextNode()){
      if(!n.textContent.trim())continue;
      const range=document.createRange();range.selectNodeContents(n);
      for(const r of range.getClientRects()){
        if(r.width>4&&r.height>4)out.push({l:r.left+scrollX-3,r:r.right+scrollX+3,t:r.top+scrollY-3,b:r.bottom+scrollY+3});
      }
    }
  });
  return out;
}
function circleRectHit(o){
  const cx=Math.max(o.l,Math.min(ballX,o.r)),cy=Math.max(o.t,Math.min(ballY,o.b));
  const dx=ballX-cx,dy=ballY-cy;
  return dx*dx+dy*dy<ballR*ballR;
}
function resolveObstacle(o){
  const cx=Math.max(o.l,Math.min(ballX,o.r)),cy=Math.max(o.t,Math.min(ballY,o.b));
  let dx=ballX-cx,dy=ballY-cy,d2=dx*dx+dy*dy;
  if(d2>=ballR*ballR)return false;
  let nx=0,ny=0,pen=0;
  if(d2>.001){
    const d=Math.sqrt(d2);nx=dx/d;ny=dy/d;pen=ballR-d;
  }else{
    const sides=[
      {v:Math.abs(ballX-o.l),x:-1,y:0},
      {v:Math.abs(o.r-ballX),x:1,y:0},
      {v:Math.abs(ballY-o.t),x:0,y:-1},
      {v:Math.abs(o.b-ballY),x:0,y:1}
    ].sort((a,b)=>a.v-b.v)[0];
    nx=sides.x;ny=sides.y;pen=ballR+sides.v;
  }
  ballX+=nx*(pen+.8);ballY+=ny*(pen+.8);
  if(ny<-.35&&ballVY>0)ballVY=-Math.max(110,ballVY*.42);
  else if(ny>.35&&ballVY<0)ballVY=Math.max(70,-ballVY*.3);
  return true;
}
function setBallSize(size,el){
  const cx=ballX,cy=ballY;
  ballR=size/2;ball.style.width=size+'px';ball.style.height=size+'px';
  ballX=cx;ballY=cy;
  el.classList.remove('game-eye-hit');void el.offsetWidth;el.classList.add('game-eye-hit');
}
function checkpointRects(){
  return [...document.querySelectorAll('.drifting-eye,.card-eye')].map(el=>{
    const r=el.getBoundingClientRect();
    return {el,l:r.left+scrollX-8,r:r.right+scrollX+8,t:r.top+scrollY-8,b:r.bottom+scrollY+8,hit:false};
  }).sort((a,b)=>a.t-b.t);
}
function hitCheckpoint(){
  for(const cp of checkpoints){
    if(cp.hit)continue;
    if(ballY+ballR<cp.t||ballY-ballR>cp.b||ballX+ballR<cp.l||ballX-ballR>cp.r)continue;
    cp.hit=true;
    const size=checkpointSizes[Math.min(checkpointIndex,checkpointSizes.length-1)];
    checkpointIndex++;
    setBallSize(size,cp.el);
    ballVY=Math.min(ballVY,240);
    return;
  }
}
function goalHit(){
  const r=goal.getBoundingClientRect();
  const gx=r.left+r.width/2+scrollX,gy=r.top+r.height/2+scrollY;
  const rx=Math.max(28,r.width*.30),ry=Math.max(20,r.height*.27);
  const nx=(ballX-gx)/rx,ny=(ballY-gy)/ry;
  return nx*nx+ny*ny<=1?{gx,gy}:null;
}
function render(){
  ball.style.transform=`translate3d(${ballX-scrollX-ballR}px,${ballY-scrollY-ballR}px,0)`;
}
function finish(g){
  running=false;
  document.body.classList.remove('game-running');
  hint.classList.remove('show');
  ballX=g.gx;ballY=g.gy;render();
  const sec=Math.max(0,(performance.now()-startAt)/1000);
  result.innerHTML=`<small>GOAL / CLEAR TIME</small><strong>${sec.toFixed(2)} SEC</strong>`;
  result.classList.add('show');
  setTimeout(()=>result.classList.remove('show'),3200);
  setTimeout(()=>{ball.classList.remove('on');pupil.style.opacity='';goalPupil.style.opacity=''},420);
}
function frame(now){
  if(!running)return;
  const dt=Math.min(.026,Math.max(.006,(now-last)/1000));
  last=now;
  ballVY=Math.min(520,ballVY+360*dt);
  ballY+=ballVY*dt;
  ballX=clampX(ballX);
  for(const o of obstacles){
    if(o.b<ballY-ballR-40||o.t>ballY+ballR+40)continue;
    resolveObstacle(o);
  }
  hitCheckpoint();
  const g=goalHit();
  if(g){finish(g);return}
  if(ballY+ballR>=floorY){
    ballY=floorY-ballR;
    ballVY=0;
  }
  render();
  requestAnimationFrame(frame);
}
function startGame(){
  if(running)return;
  const r=pupil.getBoundingClientRect();
  const size=Math.max(36,Math.min(42,innerWidth*.105));
  ballR=size/2;
  ball.style.width=size+'px';
  ball.style.height=size+'px';
  ballX=r.left+r.width/2+scrollX;
  ballY=r.top+r.height/2+scrollY;
  ballVY=0;
  floorY=document.documentElement.scrollHeight-8;
  obstacles=textRects();
  checkpoints=checkpointRects();
  checkpointIndex=0;
  running=true;
  startAt=performance.now();
  last=performance.now();
  document.body.classList.add('game-running');
  ball.classList.add('on');
  hint.classList.add('show');
  setTimeout(()=>hint.classList.remove('show'),2600);
  render();
  requestAnimationFrame(frame);
}

let tapX=0,tapY=0,tapAt=0;
eye.addEventListener('pointerdown',e=>{
  if(running)return;
  tapX=e.clientX;tapY=e.clientY;tapAt=performance.now();
},{passive:true});
eye.addEventListener('pointerup',e=>{
  if(running)return;
  if(tapAt&&performance.now()-tapAt<500&&Math.hypot(e.clientX-tapX,e.clientY-tapY)<9)startGame();
  tapAt=0;
},{passive:true});
eye.addEventListener('pointercancel',()=>{tapAt=0},{passive:true});

window.addEventListener('pointerdown',e=>{
  if(!running)return;
  if(e.target.closest&&e.target.closest('a'))return;
  if(e.pointerType==='mouse'){
    ballX=clampX(e.clientX+scrollX);render();return;
  }
  touchId=e.pointerId;
  startX=e.clientX;startY=e.clientY;mode='pending';
},{passive:true});

window.addEventListener('pointermove',e=>{
  if(!running)return;
  if(e.pointerType==='mouse'){
    ballX=clampX(e.clientX+scrollX);render();return;
  }
  if(touchId!==e.pointerId)return;
  const dx=e.clientX-startX,dy=e.clientY-startY;
  if(mode==='pending'){
    if(Math.abs(dy)>Math.abs(dx)+5){mode='scroll';return}
    if(Math.abs(dx)>5)mode='steer';
  }
  if(mode==='steer'){
    ballX=clampX(e.clientX+scrollX);
    render();
  }
},{passive:true});

function endPointer(e){
  if(e.pointerType==='mouse')return;
  if(touchId!==null&&e.pointerId!==touchId)return;
  touchId=null;mode='none';
}
window.addEventListener('pointerup',endPointer,{passive:true});
window.addEventListener('pointercancel',endPointer,{passive:true});

window.addEventListener('keydown',e=>{
  if(!running)return;
  if(e.key==='ArrowLeft'){ballX=clampX(ballX-24);render()}
  if(e.key==='ArrowRight'){ballX=clampX(ballX+24);render()}
});

// Keep the existing 01–05 click guide, but independent from the game.
const list=document.querySelector('.view-list');
const cards=list?[...list.querySelectorAll('.view-card')]:[];
if(list&&cards.length){
  const guide=document.createElement('div');
  guide.className='view-click-guide';
  guide.setAttribute('aria-hidden','true');
  guide.innerHTML='<span class="guide-label">クリック！</span><span class="guide-arrow">↓</span>';
  list.appendChild(guide);
  let i=0;
  function place(){
    const card=cards[i%cards.length],lr=list.getBoundingClientRect(),er=card.querySelector('.card-eye').getBoundingClientRect();
    guide.style.setProperty('--guide-color',getComputedStyle(card).getPropertyValue('--c').trim()||'var(--pink)');
    guide.style.left=(er.left-lr.left+8)+'px';
    guide.style.top=(er.top-lr.top-50)+'px';
    guide.style.opacity='1';
  }
  place();
  setInterval(()=>{if(running)return;i=(i+1)%cards.length;place()},2000);
}

window.__ABOUT_SIMPLE_GAME__={start:startGame,getState:()=>({running,ballX,ballY,ballVY,mode,mobile,obstacles:obstacles.length,checkpoints:checkpoints.length})};
})();