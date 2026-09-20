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
.goal-eye.game-target .goal-pupil{opacity:1!important;will-change:transform,width,height,box-shadow;transition:transform .12s ease,width .18s ease,height .18s ease;animation:goalPupilWake .72s ease 1}
.goal-eye.game-target.is-near .goal-pupil{width:68px;height:68px}
@keyframes goalPupilWake{0%,100%{box-shadow:0 0 0 0 var(--paper)}45%{box-shadow:0 0 0 9px var(--paper),0 0 0 12px var(--ink)}}
.game-ball-guide{position:fixed;left:0;top:0;z-index:10000;pointer-events:none;opacity:0;transition:opacity .16s ease;will-change:transform}
.game-ball-guide.show{opacity:1}
.game-ball-guide .bubble{position:relative;padding:8px 10px 7px;border:2px solid var(--ink);border-radius:12px;background:rgba(244,241,233,.96);box-shadow:3px 3px 0 var(--yellow);font:850 10px/1.45 -apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic",sans-serif;white-space:nowrap}
.game-ball-guide .bubble:after{content:"";position:absolute;left:18px;bottom:-7px;width:10px;height:10px;background:var(--paper);border-right:2px solid var(--ink);border-bottom:2px solid var(--ink);transform:rotate(45deg)}
.game-result{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.88);z-index:10001;background:var(--paper);border:4px solid var(--ink);box-shadow:8px 8px 0 var(--pink);padding:18px 24px;text-align:center;pointer-events:none;opacity:0;transition:.22s}
.game-result.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
.game-result strong{display:block;font:950 38px/.95 Arial,sans-serif}.game-result strong .sec-unit{font-size:13px;letter-spacing:.08em;margin-left:5px;vertical-align:baseline}.game-result small{display:block;font:900 9px/1 Arial,sans-serif;letter-spacing:.2em;margin-bottom:8px}.game-result .best-row{margin-top:12px;padding-top:10px;border-top:2px solid var(--ink);font:900 12px/1.2 Arial,sans-serif;letter-spacing:.12em}.game-result .best-row b{font-size:18px;letter-spacing:0}.game-result .new-best{display:block;margin-top:7px;font:950 10px/1 Arial,sans-serif;letter-spacing:.16em}
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

const guide=document.createElement('div');
guide.className='game-ball-guide';
guide.setAttribute('aria-hidden','true');
guide.innerHTML=mobile
  ? '<div class="bubble">←→ 指で左右になぞる<br>↓ ページをスクロール</div>'
  : '<div class="bubble">←→ マウスで左右に動かす</div>';
document.body.appendChild(guide);

const result=document.createElement('div');
result.className='game-result';
document.body.appendChild(result);

let running=false;
let ballX=0,ballY=0,ballVY=0,ballR=20,last=0,floorY=0,startAt=0;
let touchId=null,startX=0,startY=0,mode='none';
let checkpoints=[],obstacles=[];const checkpointSizes=[30,24,20,28,22,18,26,20];let checkpointIndex=0;
const BEST_TIME_KEY='shiten-about-personal-best-v1';
function readBestTime(){
  try{
    const v=Number(localStorage.getItem(BEST_TIME_KEY));
    return Number.isFinite(v)&&v>0?v:null;
  }catch(_){return null}
}
function writeBestTime(sec){
  try{localStorage.setItem(BEST_TIME_KEY,String(sec))}catch(_){}
}

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
function updateGuide(){
  if(!running){guide.classList.remove('show');return}
  const sx=ballX-scrollX,sy=ballY-scrollY;
  const bubble=guide.firstElementChild;
  const gw=bubble?bubble.offsetWidth:150,gh=bubble?bubble.offsetHeight:44;
  const margin=8,gap=12;
  let x=sx-ballR;
  let y=sy-ballR-gh-gap;
  if(y<margin)y=sy+ballR+gap;
  x=Math.max(margin,Math.min(innerWidth-gw-margin,x));
  y=Math.max(margin,Math.min(innerHeight-gh-margin,y));
  guide.style.transform=`translate3d(${x}px,${y}px,0)`;
  guide.classList.add('show');
}
function updateGoalCue(){
  if(!running){
    goal.classList.remove('game-target','is-near');
    goalPupil.style.transform='';
    goalPupil.style.width='';
    goalPupil.style.height='';
    return;
  }
  goal.classList.add('game-target');
  const r=goal.getBoundingClientRect();
  const gx=r.left+r.width/2+scrollX,gy=r.top+r.height/2+scrollY;
  const dx=ballX-gx,dy=ballY-gy;
  const dist=Math.hypot(dx,dy);
  const maxX=Math.max(0,r.width*.16),maxY=Math.max(0,r.height*.13);
  const len=Math.max(1,dist);
  const lookX=Math.max(-maxX,Math.min(maxX,dx/len*maxX));
  const lookY=Math.max(-maxY,Math.min(maxY,dy/len*maxY));
  const near=dist<430;
  goal.classList.toggle('is-near',near);
  goalPupil.style.transform=`translate(calc(-50% + ${lookX.toFixed(1)}px),calc(-50% + ${lookY.toFixed(1)}px))`;
}
function render(){
  ball.style.transform=`translate3d(${ballX-scrollX-ballR}px,${ballY-scrollY-ballR}px,0)`;
  updateGuide();
  updateGoalCue();
}
function finish(g){
  running=false;
  document.body.classList.remove('game-running');
  guide.classList.remove('show');
  ballX=g.gx;ballY=g.gy;render();
  const sec=Math.max(0,(performance.now()-startAt)/1000);
  const previousBest=readBestTime();
  const isNewBest=previousBest===null||sec<previousBest;
  const best=isNewBest?sec:previousBest;
  if(isNewBest)writeBestTime(sec);
  result.innerHTML=`<small>GOAL / CLEAR TIME</small><strong>${sec.toFixed(2)}<span class="sec-unit">SEC</span></strong><div class="best-row">BEST&nbsp; <b>${best.toFixed(2)}</b> SEC</div>${isNewBest?'<span class="new-best">NEW BEST!</span>':''}`;
  result.classList.add('show');
  setTimeout(()=>result.classList.remove('show'),3600);
  goal.classList.remove('game-target','is-near');
  goalPupil.style.transform='';
  goalPupil.style.width='';
  goalPupil.style.height='';
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
    ballVY=-Math.max(320,Math.abs(ballVY)*.72);
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
  goal.classList.add('game-target');
  ball.classList.add('on');
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

window.__ABOUT_SIMPLE_GAME__={
  start:startGame,
  getState:()=>({running,ballX,ballY,ballVY,ballR,floorY,mode,mobile,obstacles:obstacles.length,checkpoints:checkpoints.length}),
  testFloorBounce:()=>{
    if(!running)startGame();
    ballY=floorY-ballR-1;
    ballVY=500;
    render();
  }
};
})();