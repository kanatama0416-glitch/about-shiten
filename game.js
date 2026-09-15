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
let ballX=0,ballY=0,ballVX=0,ballVY=0,ballR=20,last=0,obstacles=[],checkpoints=[],steer=false,steerX=0,key=0,checkpointIndex=0,floorY=0;
let pointerStartX=0,pointerStartY=0,manualScrollUntil=0;
const checkpointSizes=[30,24,20,28,22,18,26,20];

window.addEventListener('pointerdown',e=>{if(!gameRunning)return;steer=true;steerX=e.clientX+scrollX;pointerStartX=e.clientX;pointerStartY=e.clientY},{passive:true});
window.addEventListener('pointermove',e=>{if(!gameRunning||!steer)return;const dx=e.clientX-pointerStartX,dy=e.clientY-pointerStartY;if(Math.abs(dy)>Math.abs(dx)+8)manualScrollUntil=performance.now()+1400;else steerX=e.clientX+scrollX},{passive:true});
window.addEventListener('pointerup',()=>{steer=false},{passive:true});
window.addEventListener('pointercancel',()=>{steer=false;manualScrollUntil=performance.now()+1400},{passive:true});
window.addEventListener('wheel',()=>{if(gameRunning)manualScrollUntil=performance.now()+1400},{passive:true});
window.addEventListener('keydown',e=>{if(!gameRunning)return;if(e.key==='ArrowLeft')key=-1;if(e.key==='ArrowRight')key=1});
window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')key=0});

function textRects(){const sels=['.flow-copy h2 .line','.flow-lead','.flow-copy > p:not(.flow-lead)','.choose-kicker','.choose h2','.choose-intro','.view-index','.view-note','.go','.section-no','.info-head','.info-cell small','.info-cell b','footer'];const out=[];document.querySelectorAll(sels.join(',')).forEach(el=>{const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>3&&r.height>3)out.push({l:r.left+scrollX-2,r:r.right+scrollX+2,t:r.top+scrollY-2,b:r.bottom+scrollY+2})}});return out}
function checkpointRects(){return [...document.querySelectorAll('.drifting-eye,.card-eye')].map(el=>{const r=el.getBoundingClientRect();return{el,l:r.left+scrollX-10,r:r.right+scrollX+10,t:r.top+scrollY-10,b:r.bottom+scrollY+10,hit:false}}).sort((a,b)=>a.t-b.t)}
function hitRect(o){const cx=Math.max(o.l,Math.min(ballX,o.r)),cy=Math.max(o.t,Math.min(ballY,o.b)),dx=ballX-cx,dy=ballY-cy;return dx*dx+dy*dy<=ballR*ballR}
function setSize(size,cp){ballR=size/2;ball.style.width=size+'px';ball.style.height=size+'px';ball.classList.remove('size-pop');void ball.offsetWidth;ball.classList.add('size-pop');cp.el.classList.remove('game-eye-hit');void cp.el.offsetWidth;cp.el.classList.add('game-eye-hit');hint.textContent=`SIZE CHANGE! ${size}px`;hint.classList.add('show');clearTimeout(setSize.t);setSize.t=setTimeout(()=>hint.classList.remove('show'),700)}
function checkCheckpoints(){for(const cp of checkpoints){if(cp.hit)continue;if(cp.b<ballY-ballR-40||cp.t>ballY+ballR+40)continue;if(hitRect(cp)){cp.hit=true;setSize(checkpointSizes[Math.min(checkpointIndex,checkpointSizes.length-1)],cp);checkpointIndex++;ballVY=Math.min(ballVY,320);ballVX*=.72;break}}}
function collide(o){const cx=Math.max(o.l,Math.min(ballX,o.r)),cy=Math.max(o.t,Math.min(ballY,o.b));let dx=ballX-cx,dy=ballY-cy,d2=dx*dx+dy*dy;if(d2>=ballR*ballR)return;let nx=0,ny=0,pen=0;if(d2>.001){const d=Math.sqrt(d2);nx=dx/d;ny=dy/d;pen=ballR-d}else{const ds=[{v:Math.abs(ballX-o.l),x:-1,y:0},{v:Math.abs(o.r-ballX),x:1,y:0},{v:Math.abs(ballY-o.t),x:0,y:-1},{v:Math.abs(o.b-ballY),x:0,y:1}].sort((a,b)=>a.v-b.v)[0];nx=ds.x;ny=ds.y;pen=ballR+ds.v}ballX+=nx*(pen+.8);ballY+=ny*(pen+.8);const vn=ballVX*nx+ballVY*ny;if(vn<0){ballVX-=1.48*vn*nx;ballVY-=1.48*vn*ny;ballVX*=.94}}
function goalHit(){const r=goal.getBoundingClientRect();const gx=r.left+r.width/2+scrollX,gy=r.top+r.height/2+scrollY;const rx=r.width*.34,ry=r.height*.30;const nx=(ballX-gx)/Math.max(1,rx-ballR*.35),ny=(ballY-gy)/Math.max(1,ry-ballR*.35);return nx*nx+ny*ny<=1?{gx,gy}:null}
function startDropGame(){if(gameRunning)return;gameRunning=true;checkpointIndex=0;steer=false;key=0;manualScrollUntil=0;const pr=pupil.getBoundingClientRect(),cx=pr.left+pr.width/2,cy=pr.top+pr.height/2,size=Math.max(36,Math.min(42,innerWidth*.105));ballR=size/2;ball.style.width=size+'px';ball.style.height=size+'px';ballX=cx+scrollX;ballY=cy+scrollY;ballVX=0;ballVY=90;obstacles=textRects();checkpoints=checkpointRects();floorY=document.documentElement.scrollHeight-8;document.body.classList.add('game-running');ball.classList.add('on');ball.classList.remove('dropped','size-pop');ball.style.opacity='1';ball.style.transform=`translate3d(${cx-ballR}px,${cy-ballR}px,0)`;hint.textContent='← 横になぞる：操作 ｜ 縦にスワイプ：スクロール →';hint.classList.add('show');setTimeout(()=>hint.classList.remove('show'),2400);void ball.offsetWidth;requestAnimationFrame(()=>ball.classList.add('dropped'));last=performance.now();setTimeout(()=>requestAnimationFrame(frame),160)}
function frame(now){if(!gameRunning)return;const dt=Math.min(.025,Math.max(.006,(now-last)/1000));last=now;if(steer){const dx=steerX-ballX;ballVX+=Math.max(-1550,Math.min(1550,dx*11))*dt}else if(key)ballVX+=key*1450*dt;ballVY+=980*dt;ballVX*=Math.pow(.982,dt*60);ballVY=Math.min(ballVY,760);ballX+=ballVX*dt;ballY+=ballVY*dt;const left=ballR+5,right=Math.min(document.documentElement.clientWidth,720)-ballR-5;if(ballX<left){ballX=left;ballVX=Math.abs(ballVX)*.58}else if(ballX>right){ballX=right;ballVX=-Math.abs(ballVX)*.58}checkCheckpoints();for(const o of obstacles){if(o.b<ballY-ballR-70||o.t>ballY+ballR+70)continue;collide(o)}const g=goalHit();if(g){finish(g.gx,g.gy);return}if(ballY+ballR>=floorY){ballY=floorY-ballR;ballVY=-Math.max(520,Math.abs(ballVY)*.78);ballVX*=.92}if(now>manualScrollUntil){const desired=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,ballY-innerHeight*.58));window.scrollTo(0,scrollY+(desired-scrollY)*Math.min(1,dt*7))}ball.style.transform=`translate3d(${ballX-scrollX-ballR}px,${ballY-scrollY-ballR}px,0)`;requestAnimationFrame(frame)}
function finish(gx,gy){gameRunning=false;steer=false;key=0;hint.classList.remove('show');goal.classList.add('goal-ready');ball.style.transition='transform .32s cubic-bezier(.2,.9,.3,1),opacity .22s ease .18s';ball.style.transform=`translate3d(${gx-scrollX-ballR}px,${gy-scrollY-ballR}px,0)`;setTimeout(()=>{ball.style.opacity='0';document.body.classList.remove('game-running');goalPupil.style.opacity='1';setTimeout(()=>{ball.classList.remove('on','dropped','size-pop');ball.style.transition='';ball.style.opacity='1';pupil.style.opacity='';goal.classList.remove('goal-ready');checkpoints.forEach(cp=>cp.el.classList.remove('game-eye-hit'))},260)},340)}
})();
