(()=>{
const eye=document.getElementById('heroEye');
const pupil=document.getElementById('heroPupil');
const goal=document.getElementById('goalEye');
const goalPupil=document.getElementById('goalPupil');
if(!eye||!pupil||!goal||!goalPupil)return;

const style=document.createElement('style');
style.textContent=`
.game-ball{position:fixed;left:0;top:0;width:40px;height:40px;z-index:9999;pointer-events:none;display:none;will-change:transform,width,height}
.game-ball.on{display:block}.game-dot{width:100%;height:100%;border-radius:50%;background:var(--ink);transform:scale(8);transition:transform .34s cubic-bezier(.18,.82,.28,1.12)}.game-ball.dropped .game-dot{transform:scale(1)}
body.game-running{overscroll-behavior-y:auto;touch-action:pan-y}body.game-running a{pointer-events:none}body.game-running .hero-pupil{opacity:0}body.game-running #goalPupil{opacity:0}
.hero-pupil.drop-ready{filter:drop-shadow(0 8px 0 rgba(0,0,0,.08))}
.game-hint{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10000;background:var(--paper);border:2px solid var(--ink);border-radius:999px;padding:8px 13px;font:800 10px/1 system-ui,sans-serif;letter-spacing:.05em;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .18s}.game-hint.show{opacity:1}
.game-idle-guide{position:fixed;left:0;top:0;z-index:10000;max-width:min(220px,calc(100vw - 20px));background:var(--paper);border:2px solid var(--ink);border-radius:16px;padding:8px 10px;box-shadow:4px 4px 0 var(--yellow);font:850 11px/1.35 system-ui,sans-serif;white-space:normal;pointer-events:none;opacity:0;transform:translate3d(0,8px,0);transition:opacity .18s ease,transform .18s ease}.game-idle-guide.show{opacity:1;transform:translate3d(0,0,0)}
.goal-eye{cursor:pointer;touch-action:manipulation}.goal-eye.hint-pop{animation:goalHintPop .45s cubic-bezier(.2,.9,.3,1)}@keyframes goalHintPop{0%,100%{transform:scale(1)}45%{transform:scale(.93) rotate(-2deg)}70%{transform:scale(1.05) rotate(1deg)}}
.goal-secret-hint{position:absolute;left:50%;bottom:126px;transform:translate(-50%,10px) rotate(-1deg);width:min(310px,82vw);padding:12px 15px;background:var(--paper);border:3px solid var(--ink);box-shadow:5px 5px 0 var(--yellow);font:850 13px/1.55 system-ui,sans-serif;text-align:center;z-index:10002;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .28s cubic-bezier(.2,.9,.3,1)}.goal-secret-hint:after{content:"";position:absolute;left:50%;bottom:-12px;width:18px;height:18px;background:var(--paper);border-right:3px solid var(--ink);border-bottom:3px solid var(--ink);transform:translateX(-50%) rotate(45deg)}.goal-secret-hint.show{opacity:1;transform:translate(-50%,0) rotate(-1deg)}.goal-secret-hint small{display:block;font:950 8px/1 Arial,sans-serif;letter-spacing:.18em;margin-bottom:6px;opacity:.55}.goal-secret-hint b{font-weight:900}
.game-result{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.82) rotate(-2deg);z-index:10001;background:var(--paper);border:4px solid var(--ink);box-shadow:8px 8px 0 var(--pink);padding:18px 24px 16px;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s ease,transform .35s cubic-bezier(.18,.9,.3,1.25);min-width:210px}.game-result.show{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-2deg)}.game-result small{display:block;font:900 9px/1 Arial,sans-serif;letter-spacing:.2em;margin-bottom:8px}.game-result strong{display:block;font:950 38px/.95 Arial,sans-serif;letter-spacing:-.04em}.game-result span{font-size:15px;margin-left:4px}.game-result em{display:block;font-style:normal;font:800 10px/1.4 system-ui,sans-serif;margin-top:9px;letter-spacing:.05em}
.game-eye-hit{animation:gameEyeHit .46s cubic-bezier(.2,.9,.3,1)}@keyframes gameEyeHit{0%{filter:none}38%{filter:drop-shadow(0 0 12px rgba(0,0,0,.24));transform:scale(1.12)}100%{filter:none}}
.game-ball.size-pop .game-dot{animation:gameSizePop .34s cubic-bezier(.2,.9,.3,1)}@keyframes gameSizePop{0%{transform:scale(1)}45%{transform:scale(1.35)}100%{transform:scale(1)}}
.goal-eye.goal-ready{animation:goalReady .55s ease}@keyframes goalReady{50%{transform:scale(1.07)}}
`;
document.head.appendChild(style);

let gameRunning=false,gesture=false,startY=0,maxDown=0,dragPointer=null;
const DROP_DISTANCE=28;
function dragStart(e){if(gameRunning)return;gesture=true;dragPointer=e.pointerId;startY=e.clientY;maxDown=0;try{eye.setPointerCapture(e.pointerId)}catch(_){}}
function dragMove(e){if(!gesture||gameRunning||(dragPointer!==null&&e.pointerId!==dragPointer))return;maxDown=Math.max(maxDown,e.clientY-startY);if(maxDown>=DROP_DISTANCE)pupil.classList.add('drop-ready')}
function dragEnd(e){if(!gesture||gameRunning||(dragPointer!==null&&e.pointerId!==dragPointer))return;gesture=false;dragPointer=null;try{eye.releasePointerCapture(e.pointerId)}catch(_){}pupil.classList.remove('drop-ready');if(maxDown>=DROP_DISTANCE)startDropGame()}
eye.addEventListener('pointerdown',dragStart,{passive:true});eye.addEventListener('pointermove',dragMove,{passive:true});eye.addEventListener('pointerup',dragEnd);eye.addEventListener('pointercancel',dragEnd);

const ball=document.createElement('div');ball.className='game-ball';ball.innerHTML='<div class="game-dot"></div>';document.body.appendChild(ball);
const hint=document.createElement('div');hint.className='game-hint';document.body.appendChild(hint);
const idleGuide=document.createElement('div');idleGuide.className='game-idle-guide';idleGuide.textContent='←→ 指で横になぞって動かす';document.body.appendChild(idleGuide);
const result=document.createElement('div');result.className='game-result';document.body.appendChild(result);
const secretHint=document.createElement('div');secretHint.className='goal-secret-hint';secretHint.setAttribute('aria-live','polite');goal.parentElement.appendChild(secretHint);
goal.setAttribute('role','button');goal.setAttribute('tabindex','0');goal.setAttribute('aria-label','ゲームのヒントを見る');
const secretHints=['一番上の目玉の目線を、<b>下にしてみよう！</b>','上の大きな黒目を、<b>下へぐーっと動かす</b>と……？'];let secretHintIndex=0;
function showSecretHint(){if(gameRunning)return;secretHint.innerHTML='<small>SECRET HINT</small>'+secretHints[secretHintIndex%secretHints.length];secretHintIndex++;secretHint.classList.add('show');goal.classList.remove('hint-pop');void goal.offsetWidth;goal.classList.add('hint-pop');clearTimeout(showSecretHint.t);showSecretHint.t=setTimeout(()=>secretHint.classList.remove('show'),3600)}
goal.addEventListener('click',showSecretHint);goal.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showSecretHint()}});

let ballX=0,ballY=0,ballVX=0,ballVY=0,ballR=20,last=0,obstacles=[],checkpoints=[],steer=false,steerX=0,key=0,checkpointIndex=0,floorY=0,gameStartTime=0;
let pointerStartX=0,pointerStartY=0,manualScroll=false,stuckAnchorY=0,stuckSince=0,lastInteractionAt=0;
const checkpointSizes=[30,24,20,28,22,18,26,20];
const IDLE_GUIDE_DELAY=1100;
const STUCK_DELAY=750;

function hideIdleGuide(){idleGuide.classList.remove('show')}
function markInteraction(){if(!gameRunning)return;lastInteractionAt=performance.now();hideIdleGuide()}
function updateIdleGuide(now){
 if(!gameRunning)return;
 if(now-lastInteractionAt<IDLE_GUIDE_DELAY){hideIdleGuide();return}
 idleGuide.classList.add('show');
 const r=idleGuide.getBoundingClientRect();
 const sx=ballX-scrollX,sy=ballY-scrollY,gap=12,margin=10;
 let x=sx+ballR+gap;
 if(x+r.width>innerWidth-margin)x=sx-ballR-gap-r.width;
 x=Math.max(margin,Math.min(innerWidth-r.width-margin,x));
 let y=sy-r.height/2;
 y=Math.max(margin,Math.min(innerHeight-r.height-margin,y));
 idleGuide.style.left=x+'px';
 idleGuide.style.top=y+'px';
}

window.addEventListener('pointerdown',e=>{if(!gameRunning)return;steer=true;steerX=e.clientX+scrollX;pointerStartX=e.clientX;pointerStartY=e.clientY;markInteraction()},{passive:true});
window.addEventListener('pointermove',e=>{if(!gameRunning||!steer)return;const dx=e.clientX-pointerStartX,dy=e.clientY-pointerStartY;if(Math.abs(dy)>Math.abs(dx)+8)manualScroll=true;else steerX=e.clientX+scrollX;markInteraction()},{passive:true});
window.addEventListener('pointerup',()=>{steer=false},{passive:true});
window.addEventListener('pointercancel',()=>{steer=false;manualScroll=true},{passive:true});
window.addEventListener('wheel',()=>{if(gameRunning){manualScroll=true;markInteraction()}},{passive:true});
window.addEventListener('keydown',e=>{if(!gameRunning)return;if(e.key==='ArrowLeft')key=-1;if(e.key==='ArrowRight')key=1;if(e.key==='ArrowLeft'||e.key==='ArrowRight')markInteraction()});
window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')key=0});

function textRects(){const sels=['.flow-copy h2 .line','.flow-lead','.flow-copy > p:not(.flow-lead)','.choose-kicker','.choose h2','.choose-intro','.view-index','.view-note','.go','.section-no','.info-head','.info-cell small','.info-cell b'];const out=[];document.querySelectorAll(sels.join(',')).forEach(el=>{const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>3&&r.height>3)out.push({l:r.left+scrollX-2,r:r.right+scrollX+2,t:r.top+scrollY-2,b:r.bottom+scrollY+2})}});return out}
function checkpointRects(){return [...document.querySelectorAll('.drifting-eye,.card-eye')].map(el=>{const r=el.getBoundingClientRect();return{el,l:r.left+scrollX-10,r:r.right+scrollX+10,t:r.top+scrollY-10,b:r.bottom+scrollY+10,hit:false}}).sort((a,b)=>a.t-b.t)}
function circleHitsRectAt(x,y,o,r=ballR){const cx=Math.max(o.l,Math.min(x,o.r)),cy=Math.max(o.t,Math.min(y,o.b)),dx=x-cx,dy=y-cy;return dx*dx+dy*dy<r*r}
function hitRect(o){return circleHitsRectAt(ballX,ballY,o)}
function setSize(size,cp){ballR=size/2;ball.style.width=size+'px';ball.style.height=size+'px';ball.classList.remove('size-pop');void ball.offsetWidth;ball.classList.add('size-pop');cp.el.classList.remove('game-eye-hit');void cp.el.offsetWidth;cp.el.classList.add('game-eye-hit');hint.textContent=`SIZE CHANGE! ${size}px`;hint.classList.add('show');clearTimeout(setSize.t);setSize.t=setTimeout(()=>hint.classList.remove('show'),700)}
function checkCheckpoints(){for(const cp of checkpoints){if(cp.hit)continue;if(cp.b<ballY-ballR-40||cp.t>ballY+ballR+40)continue;if(hitRect(cp)){cp.hit=true;setSize(checkpointSizes[Math.min(checkpointIndex,checkpointSizes.length-1)],cp);checkpointIndex++;ballVY=Math.min(ballVY,320);ballVX*=.72;stuckAnchorY=ballY;stuckSince=performance.now();break}}}
function collide(o){const cx=Math.max(o.l,Math.min(ballX,o.r)),cy=Math.max(o.t,Math.min(ballY,o.b));let dx=ballX-cx,dy=ballY-cy,d2=dx*dx+dy*dy;if(d2>=ballR*ballR)return;let nx=0,ny=0,pen=0;if(d2>.001){const d=Math.sqrt(d2);nx=dx/d;ny=dy/d;pen=ballR-d}else{const ds=[{v:Math.abs(ballX-o.l),x:-1,y:0},{v:Math.abs(o.r-ballX),x:1,y:0},{v:Math.abs(ballY-o.t),x:0,y:-1},{v:Math.abs(o.b-ballY),x:0,y:1}].sort((a,b)=>a.v-b.v)[0];nx=ds.x;ny=ds.y;pen=ballR+ds.v}ballX+=nx*(pen+.8);ballY+=ny*(pen+.8);const vn=ballVX*nx+ballVY*ny;if(vn<0){ballVX-=1.48*vn*nx;ballVY-=1.48*vn*ny;ballVX*=.94}}
function safePosition(x,y){
 const width=Math.min(document.documentElement.clientWidth,720),left=ballR+7,right=width-ballR-7;
 if(x<left||x>right||y<ballR+2||y>floorY-ballR)return false;
 for(const o of obstacles){if(o.b<y-ballR-2||o.t>y+ballR+2)continue;if(circleHitsRectAt(x,y,o,ballR+1))return false}
 return true;
}
function findEscapePosition(){
 const width=Math.min(document.documentElement.clientWidth,720),mid=width/2;
 const inward=ballX>mid?-1:1;
 const xOffsets=[32,52,76,104,136,168];
 const yOffsets=[10,28,48,72];
 for(const yo of yOffsets){
  for(const xo of xOffsets){
   const x=ballX+inward*xo,y=ballY+yo;
   if(safePosition(x,y))return{x,y,dir:inward};
  }
 }
 for(const yo of yOffsets){
  for(const xo of xOffsets){
   const x=ballX-inward*xo,y=ballY+yo;
   if(safePosition(x,y))return{x,y,dir:-inward};
  }
 }
 const centerX=Math.max(ballR+8,Math.min(width-ballR-8,width/2));
 for(const yo of [24,48,80,112]){if(safePosition(centerX,ballY+yo))return{x:centerX,y:ballY+yo,dir:centerX>=ballX?1:-1}}
 return null;
}
function releaseIfStuck(now){
 const progress=Math.max(9,ballR*.45);
 if(ballY>stuckAnchorY+progress){stuckAnchorY=ballY;stuckSince=now;return}
 if(!stuckSince)stuckSince=now;
 if(now-stuckSince<STUCK_DELAY)return;
 const escape=findEscapePosition();
 if(escape){ballX=escape.x;ballY=escape.y;ballVX=escape.dir*45;ballVY=Math.max(ballVY,230)}else{const width=Math.min(document.documentElement.clientWidth,720);ballX=Math.max(ballR+8,Math.min(width-ballR-8,ballX));ballVY=Math.max(ballVY,260)}
 stuckAnchorY=ballY;
 stuckSince=now;
}
function goalHit(){const r=goal.getBoundingClientRect();const gx=r.left+r.width/2+scrollX,gy=r.top+r.height/2+scrollY;const rx=r.width*.34,ry=r.height*.30;const nx=(ballX-gx)/Math.max(1,rx-ballR*.35),ny=(ballY-gy)/Math.max(1,ry-ballR*.35);return nx*nx+ny*ny<=1?{gx,gy}:null}
function startDropGame(){if(gameRunning)return;gameRunning=true;secretHint.classList.remove('show');gameStartTime=performance.now();result.classList.remove('show');checkpointIndex=0;steer=false;key=0;manualScroll=false;const pr=pupil.getBoundingClientRect(),cx=pr.left+pr.width/2,cy=pr.top+pr.height/2,size=Math.max(36,Math.min(42,innerWidth*.105));ballR=size/2;ball.style.width=size+'px';ball.style.height=size+'px';ballX=cx+scrollX;ballY=cy+scrollY;ballVX=0;ballVY=90;obstacles=textRects();checkpoints=checkpointRects();floorY=document.documentElement.scrollHeight-8;stuckAnchorY=ballY;stuckSince=performance.now();lastInteractionAt=performance.now();hideIdleGuide();document.body.classList.add('game-running');ball.classList.add('on');ball.classList.remove('dropped','size-pop');ball.style.opacity='1';ball.style.transform=`translate3d(${cx-ballR}px,${cy-ballR}px,0)`;hint.textContent='← 横になぞる：操作 ｜ 縦にスワイプ：スクロール →';hint.classList.add('show');setTimeout(()=>hint.classList.remove('show'),2400);void ball.offsetWidth;requestAnimationFrame(()=>ball.classList.add('dropped'));last=performance.now();setTimeout(()=>requestAnimationFrame(frame),160)}
function frame(now){if(!gameRunning)return;const dt=Math.min(.025,Math.max(.006,(now-last)/1000));last=now;if(steer){const dx=steerX-ballX;ballVX+=Math.max(-1550,Math.min(1550,dx*11))*dt}else if(key)ballVX+=key*1450*dt;else ballVX*=Math.pow(.992,dt*60);ballVY+=980*dt;ballVX*=Math.pow(.982,dt*60);ballVY=Math.min(ballVY,760);ballX+=ballVX*dt;ballY+=ballVY*dt;const left=ballR+5,right=Math.min(document.documentElement.clientWidth,720)-ballR-5;if(ballX<left){ballX=left;ballVX=Math.abs(ballVX)*.42}else if(ballX>right){ballX=right;ballVX=-Math.abs(ballVX)*.42}checkCheckpoints();for(const o of obstacles){if(o.b<ballY-ballR-70||o.t>ballY+ballR+70)continue;collide(o)}releaseIfStuck(now);const g=goalHit();if(g){finish(g.gx,g.gy);return}if(ballY+ballR>=floorY){ballY=floorY-ballR;ballVY=-Math.max(520,Math.abs(ballVY)*.78);ballVX*=.92}if(!manualScroll){const desired=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,ballY-innerHeight*.58));window.scrollTo(0,scrollY+(desired-scrollY)*Math.min(1,dt*7))}ball.style.transform=`translate3d(${ballX-scrollX-ballR}px,${ballY-scrollY-ballR}px,0)`;updateIdleGuide(now);requestAnimationFrame(frame)}
function finish(gx,gy){const elapsed=Math.max(0,(performance.now()-gameStartTime)/1000);gameRunning=false;steer=false;key=0;hint.classList.remove('show');hideIdleGuide();goal.classList.add('goal-ready');ball.style.transition='transform .32s cubic-bezier(.2,.9,.3,1),opacity .22s ease .18s';ball.style.transform=`translate3d(${gx-scrollX-ballR}px,${gy-scrollY-ballR}px,0)`;result.innerHTML=`<small>GOAL / CLEAR TIME</small><strong>${elapsed.toFixed(2)}<span>SEC</span></strong><em>ゴール！</em>`;clearTimeout(result.t);setTimeout(()=>result.classList.add('show'),300);result.t=setTimeout(()=>result.classList.remove('show'),4300);setTimeout(()=>{ball.style.opacity='0';document.body.classList.remove('game-running');goalPupil.style.opacity='1';setTimeout(()=>{ball.classList.remove('on','dropped','size-pop');ball.style.transition='';ball.style.opacity='1';pupil.style.opacity='';goal.classList.remove('goal-ready');checkpoints.forEach(cp=>cp.el.classList.remove('game-eye-hit'))},260)},340)}
})();

(()=>{
const main=document.querySelector('main');
if(!main)return;
const s=document.createElement('style');
s.textContent='.test-page-notice{margin:0 auto;width:min(100%,720px);padding:18px 18px 17px;background:#ffd83d;color:#0b0b0b;border-top:5px solid #0b0b0b;border-bottom:5px solid #0b0b0b;font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic",sans-serif;line-height:1.55;position:relative;z-index:12000}.test-page-notice b{display:block;font:950 24px/1 Arial,sans-serif;letter-spacing:.06em;margin-bottom:9px}.test-page-notice span{display:block;font-size:14px;font-weight:850}.test-page-notice:before{content:"!";position:absolute;right:16px;top:10px;width:34px;height:34px;border:3px solid #0b0b0b;border-radius:50%;display:grid;place-items:center;font:950 23px/1 Arial,sans-serif}';
document.head.appendChild(s);
let n=document.querySelector('.test-page-notice');
if(!n){n=document.createElement('div');n.className='test-page-notice';main.parentNode.insertBefore(n,main)}
n.innerHTML='<b>TEST PAGE</b><span>こちらはテストページです。<br>掲載している文言・内容は仮で作成していますので、ご放念ください。</span>';
})();
