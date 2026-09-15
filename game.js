(()=>{
const style=document.createElement('style');
style.textContent=`
.game-ball{position:fixed;left:0;top:0;width:40px;height:40px;z-index:9999;pointer-events:none;display:none;will-change:transform}
.game-ball.on{display:block}
.game-dot{width:100%;height:100%;border-radius:50%;background:var(--ink);transform:scale(9);transition:transform .38s cubic-bezier(.18,.82,.28,1.12);will-change:transform}
.game-ball.dropped .game-dot{transform:scale(1)}
body.game-running{overscroll-behavior:none}
body.game-running a{pointer-events:none}
body.game-running .hero-pupil{opacity:0}
body.game-running .footer-eye:after{opacity:.16}
.hero-pupil.drop-ready{filter:drop-shadow(0 8px 0 rgba(0,0,0,.08))}
`;
document.head.appendChild(style);

const eye=document.getElementById('heroEye');
const pupil=document.getElementById('heroPupil');
if(!eye||!pupil)return;

let gesture=false;
let startY=0;
let maxDown=0;
let gameRunning=false;
const DROP_DISTANCE=34;

/*
  The normal eye movement stays owned by the page's existing smooth-eye script.
  This layer only watches for a deliberate downward pull, so the two animations
  do not fight over the pupil transform.
*/
eye.addEventListener('pointerdown',e=>{
  if(gameRunning)return;
  gesture=true;
  startY=e.clientY;
  maxDown=0;
  eye.setPointerCapture?.(e.pointerId);
},{passive:true});

eye.addEventListener('pointermove',e=>{
  if(!gesture||gameRunning)return;
  const down=e.clientY-startY;
  maxDown=Math.max(maxDown,down);
  if(maxDown>=DROP_DISTANCE)pupil.classList.add('drop-ready');
},{passive:true});

function endGesture(e){
  if(!gesture||gameRunning)return;
  gesture=false;
  eye.releasePointerCapture?.(e.pointerId);
  pupil.classList.remove('drop-ready');
  if(maxDown>=DROP_DISTANCE)startDropGame();
}
eye.addEventListener('pointerup',endGesture);
eye.addEventListener('pointercancel',endGesture);

const ball=document.createElement('div');
ball.className='game-ball';
ball.setAttribute('aria-hidden','true');
ball.innerHTML='<div class="game-dot"></div>';
document.body.appendChild(ball);

let ballX=0,ballY=0,ballVX=0,ballVY=0;
let ballR=20;
let tilt=0;
let gameLast=0;
let obstacles=[];
let physicsStarted=false;

function collectTextRects(){
  const selectors=[
    '.flow-copy h2 .line','.flow-lead','.flow-copy > p:not(.flow-lead)',
    '.choose-kicker','.choose h2','.choose-intro',
    '.view-index','.view-note','.go','.bridge',
    '.section-no','.info-head','.info-cell small','.info-cell b','footer'
  ];
  const rects=[];
  document.querySelectorAll(selectors.join(',')).forEach(el=>{
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    let node;
    while(node=walker.nextNode()){
      if(!node.textContent.trim())continue;
      const range=document.createRange();
      range.selectNodeContents(node);
      [...range.getClientRects()].forEach(r=>{
        if(r.width<3||r.height<3)return;
        rects.push({l:r.left+scrollX-2,r:r.right+scrollX+2,t:r.top+scrollY-2,b:r.bottom+scrollY+2});
      });
    }
  });
  document.querySelectorAll('.card-eye,.drifting-eye,.info-grid').forEach(el=>{
    const r=el.getBoundingClientRect();
    rects.push({l:r.left+scrollX,r:r.right+scrollX,t:r.top+scrollY,b:r.bottom+scrollY});
  });
  return rects;
}

function onOrientation(e){
  const g=Number(e.gamma)||0;
  tilt=Math.max(-1,Math.min(1,g/28));
}

async function enableTilt(){
  try{
    if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
      const state=await DeviceOrientationEvent.requestPermission();
      if(state!=='granted')return;
    }
    window.addEventListener('deviceorientation',onOrientation,{passive:true});
  }catch(_){ }
}

function startDropGame(){
  if(gameRunning)return;
  gameRunning=true;
  physicsStarted=false;

  /* Ask while we are still directly inside the user's release gesture. */
  enableTilt();

  const pr=pupil.getBoundingClientRect();
  const cx=pr.left+pr.width/2;
  const cy=pr.top+pr.height/2;
  const bw=Math.max(36,Math.min(42,innerWidth*.105));
  ball.style.width=bw+'px';
  ball.style.height=bw+'px';
  ballR=bw/2;

  ballX=cx+scrollX;
  ballY=cy+scrollY;
  ballVX=0;
  ballVY=80;
  obstacles=collectTextRects();

  document.body.classList.add('game-running');
  ball.classList.add('on');
  ball.classList.remove('dropped');
  ball.style.transform=`translate3d(${(cx-ballR).toFixed(1)}px,${(cy-ballR).toFixed(1)}px,0)`;

  /* Force the huge pupil-sized dot to paint first, then visibly "pop" small. */
  void ball.offsetWidth;
  requestAnimationFrame(()=>ball.classList.add('dropped'));

  /* Let the shrinking detach animation read before gravity takes over. */
  setTimeout(()=>{
    if(!gameRunning)return;
    physicsStarted=true;
    gameLast=performance.now();
    requestAnimationFrame(gameFrame);
  },170);
}

function collideCircleRect(o){
  const cx=Math.max(o.l,Math.min(ballX,o.r));
  const cy=Math.max(o.t,Math.min(ballY,o.b));
  let dx=ballX-cx,dy=ballY-cy;
  const d2=dx*dx+dy*dy;
  if(d2>=ballR*ballR)return;

  let nx=0,ny=0,pen=0;
  if(d2>.0001){
    const d=Math.sqrt(d2);nx=dx/d;ny=dy/d;pen=ballR-d;
  }else{
    const dl=Math.abs(ballX-o.l),dr=Math.abs(o.r-ballX),dt=Math.abs(ballY-o.t),db=Math.abs(o.b-ballY);
    const m=Math.min(dl,dr,dt,db);
    if(m===dl){nx=-1;pen=ballR+dl}
    else if(m===dr){nx=1;pen=ballR+dr}
    else if(m===dt){ny=-1;pen=ballR+dt}
    else{ny=1;pen=ballR+db}
  }
  ballX+=nx*(pen+.7);ballY+=ny*(pen+.7);
  const vn=ballVX*nx+ballVY*ny;
  if(vn<0){
    const bounce=.5;
    ballVX-=(1+bounce)*vn*nx;
    ballVY-=(1+bounce)*vn*ny;
    ballVX*=.94;
  }
}

function gameFrame(now){
  if(!gameRunning||!physicsStarted)return;
  const dt=Math.min(.026,Math.max(.006,(now-gameLast)/1000));
  gameLast=now;

  ballVX+=tilt*1050*dt;
  ballVY+=1080*dt;
  ballVX*=Math.pow(.985,dt*60);
  ballVY=Math.min(ballVY,820);
  ballX+=ballVX*dt;
  ballY+=ballVY*dt;

  const left=ballR+5;
  const right=Math.min(document.documentElement.clientWidth,720)-ballR-5;
  if(ballX<left){ballX=left;ballVX=Math.abs(ballVX)*.58}
  if(ballX>right){ballX=right;ballVX=-Math.abs(ballVX)*.58}

  for(const o of obstacles){
    if(o.b<ballY-ballR-80||o.t>ballY+ballR+80)continue;
    collideCircleRect(o);
  }

  const desiredScroll=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,ballY-innerHeight*.58));
  const nextScroll=scrollY+(desiredScroll-scrollY)*Math.min(1,dt*6.5);
  window.scrollTo(0,nextScroll);

  const sx=ballX-scrollX-ballR;
  const sy=ballY-scrollY-ballR;
  ball.style.transform=`translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;

  const goal=document.querySelector('.footer-eye');
  if(goal){
    const gr=goal.getBoundingClientRect();
    const gx=gr.left+gr.width/2+scrollX;
    const gy=gr.top+gr.height/2+scrollY;
    const dx=ballX-gx,dy=ballY-gy;
    if(dx*dx+dy*dy<52*52||ballY>gy+70){finishGame(gx,gy);return;}
  }
  requestAnimationFrame(gameFrame);
}

function finishGame(gx,gy){
  gameRunning=false;
  physicsStarted=false;
  const sx=gx-scrollX-ballR;
  const sy=gy-scrollY-ballR;
  ball.style.transition='transform .34s cubic-bezier(.2,.9,.3,1),opacity .25s ease .2s';
  ball.style.transform=`translate3d(${sx}px,${sy}px,0)`;
  setTimeout(()=>{
    ball.style.opacity='0';
    document.body.classList.remove('game-running');
    setTimeout(()=>{
      ball.classList.remove('on','dropped');
      ball.style.transition='';
      ball.style.opacity='1';
      pupil.style.opacity='';
      window.removeEventListener('deviceorientation',onOrientation);
    },260);
  },360);
}
})();
