(()=>{
const style=document.createElement('style');style.textContent='/* hidden drop game — the page itself becomes the course */\n.game-ball{\n  position:fixed;left:0;top:0;width:40px;height:40px;border-radius:50%;\n  background:var(--ink);z-index:9999;pointer-events:none;\n  transform:translate3d(-100px,-100px,0) scale(1);\n  will-change:transform;display:none;\n  box-shadow:0 2px 0 rgba(0,0,0,.08);\n}\n.game-ball.on{display:block}\nbody.game-running{overscroll-behavior:none}\nbody.game-running a{pointer-events:none}\nbody.game-running .hero-pupil{opacity:0}\nbody.game-running .footer-eye:after{opacity:.16}\n.game-pop{animation:gamePop .34s cubic-bezier(.2,.9,.25,1.25)}\n@keyframes gamePop{0%{scale:1.65}65%{scale:.82}100%{scale:1}}\n\n';document.head.appendChild(style);

const eye=document.getElementById('heroEye');
const pupil=document.getElementById('heroPupil');

let dragging=false;
let touched=false;
let armedToDrop=false;
let targetX=0,targetY=0;
let currentX=0,currentY=0;
let vx=0,vy=0;
let lastTime=performance.now();
let gameRunning=false;

const PUPIL_SPRING=120;
const PUPIL_DAMP=13;
const DROP_PULL_Y=112;
const DROP_TRIGGER_Y=88;

function pointerTarget(clientX,clientY){
  const r=eye.getBoundingClientRect();
  const nx=(clientX-(r.left+r.width/2))/(r.width/2);
  const rawY=(clientY-(r.top+r.height/2));
  targetX=Math.max(-150,Math.min(150,nx*178));
  targetY=Math.max(-76,Math.min(DROP_PULL_Y,rawY*.72));
  armedToDrop=targetY>DROP_TRIGGER_Y;
}

eye.addEventListener('pointerdown',e=>{
  if(gameRunning)return;
  dragging=true;touched=true;armedToDrop=false;
  eye.setPointerCapture?.(e.pointerId);
  pointerTarget(e.clientX,e.clientY);
});

eye.addEventListener('pointermove',e=>{
  if(dragging&&!gameRunning)pointerTarget(e.clientX,e.clientY);
});

async function releasePupil(e){
  if(!dragging||gameRunning)return;
  dragging=false;
  eye.releasePointerCapture?.(e.pointerId);
  if(armedToDrop){
    await startDropGame();
  }else{
    targetY=Math.max(-72,Math.min(72,targetY));
  }
}
eye.addEventListener('pointerup',releasePupil);
eye.addEventListener('pointercancel',releasePupil);

function animatePupil(now){
  const dt=Math.min(.034,Math.max(.001,(now-lastTime)/1000));
  lastTime=now;

  if(!touched&&!gameRunning){
    const t=now/1000;
    targetX=Math.sin(t*.70)*43+Math.sin(t*.27)*11;
    targetY=Math.sin(t*.48+.7)*14;
  }

  if(!gameRunning){
    const ax=(targetX-currentX)*PUPIL_SPRING-PUPIL_DAMP*vx;
    const ay=(targetY-currentY)*PUPIL_SPRING-PUPIL_DAMP*vy;
    vx+=ax*dt;vy+=ay*dt;
    currentX+=vx*dt;currentY+=vy*dt;
    pupil.style.transform=`translate(${currentX.toFixed(2)}px,${currentY.toFixed(2)}px)`;
  }
  requestAnimationFrame(animatePupil);
}
requestAnimationFrame(animatePupil);

const ball=document.createElement('div');
ball.className='game-ball';
ball.setAttribute('aria-hidden','true');
document.body.appendChild(ball);

let ballX=0,ballY=0,ballVX=0,ballVY=0;
let ballR=20;
let tilt=0;
let gameLast=0;
let gameStart=0;
let obstacles=[];
let manualTiltUntil=0;

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
        rects.push({
          l:r.left+scrollX-2,r:r.right+scrollX+2,
          t:r.top+scrollY-2,b:r.bottom+scrollY+2
        });
      });
    }
  });
  document.querySelectorAll('.card-eye,.drifting-eye,.info-grid').forEach(el=>{
    const r=el.getBoundingClientRect();
    rects.push({l:r.left+scrollX,r:r.right+scrollX,t:r.top+scrollY,b:r.bottom+scrollY});
  });
  return rects;
}

async function enableTilt(){
  try{
    if(typeof DeviceOrientationEvent!=='undefined' &&
       typeof DeviceOrientationEvent.requestPermission==='function'){
      const state=await DeviceOrientationEvent.requestPermission();
      if(state!=='granted')return;
    }
    window.addEventListener('deviceorientation',onOrientation,{passive:true});
  }catch(_){ }
}

function onOrientation(e){
  if(Date.now()<manualTiltUntil)return;
  const g=Number(e.gamma)||0;
  tilt=Math.max(-1,Math.min(1,g/28));
}

window.addEventListener('pointermove',e=>{
  if(!gameRunning||e.pointerType==='mouse')return;
  if(e.buttons===0&&e.pressure===0)return;
  tilt=Math.max(-1,Math.min(1,(e.clientX-innerWidth/2)/(innerWidth*.38)));
  manualTiltUntil=Date.now()+450;
},{passive:true});

async function startDropGame(){
  if(gameRunning)return;

  const tiltPromise=enableTilt();

  const pr=pupil.getBoundingClientRect();
  const startCx=pr.left+pr.width/2;
  const startCy=pr.top+pr.height/2;

  gameRunning=true;
  document.body.classList.add('game-running');
  ball.classList.add('on','game-pop');

  const bw=Math.max(36,Math.min(42,innerWidth*.105));
  ball.style.width=bw+'px';ball.style.height=bw+'px';
  ballR=bw/2;

  ballX=startCx+scrollX;
  ballY=startCy+scrollY;
  ballVX=vx*.28;
  ballVY=Math.max(120,vy*.32+180);
  obstacles=collectTextRects();
  gameStart=performance.now();
  gameLast=gameStart;

  setTimeout(()=>ball.classList.remove('game-pop'),360);
  await tiltPromise;
  requestAnimationFrame(gameFrame);
}

function collideCircleRect(o){
  const cx=Math.max(o.l,Math.min(ballX,o.r));
  const cy=Math.max(o.t,Math.min(ballY,o.b));
  let dx=ballX-cx,dy=ballY-cy;
  let d2=dx*dx+dy*dy;
  if(d2>=ballR*ballR)return;

  let nx=0,ny=0,pen=0;
  if(d2>.0001){
    const d=Math.sqrt(d2);nx=dx/d;ny=dy/d;pen=ballR-d;
  }else{
    const dl=Math.abs(ballX-o.l),dr=Math.abs(o.r-ballX);
    const dt=Math.abs(ballY-o.t),db=Math.abs(o.b-ballY);
    const m=Math.min(dl,dr,dt,db);
    if(m===dl){nx=-1;pen=ballR+dl}
    else if(m===dr){nx=1;pen=ballR+dr}
    else if(m===dt){ny=-1;pen=ballR+dt}
    else{ny=1;pen=ballR+db}
  }

  ballX+=nx*(pen+.7);ballY+=ny*(pen+.7);
  const vn=ballVX*nx+ballVY*ny;
  if(vn<0){
    const bounce=0.46;
    ballVX-=(1+bounce)*vn*nx;
    ballVY-=(1+bounce)*vn*ny;
    ballVX*=.94;
  }
}

function gameFrame(now){
  if(!gameRunning)return;
  const dt=Math.min(.026,Math.max(.006,(now-gameLast)/1000));
  gameLast=now;

  ballVX+=tilt*930*dt;
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

  const desiredScroll=Math.max(0,Math.min(
    document.documentElement.scrollHeight-innerHeight,
    ballY-innerHeight*.58
  ));
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
    if((dx*dx+dy*dy)<48*48 || ballY>gy+70){
      finishGame(gx,gy);
      return;
    }
  }

  requestAnimationFrame(gameFrame);
}

function finishGame(gx,gy){
  gameRunning=false;
  const sx=gx-scrollX-ballR;
  const sy=gy-scrollY-ballR;
  ball.style.transition='transform .34s cubic-bezier(.2,.9,.3,1),opacity .25s ease .2s';
  ball.style.transform=`translate3d(${sx}px,${sy}px,0) scale(.82)`;
  setTimeout(()=>{
    ball.style.opacity='0';
    document.body.classList.remove('game-running');
    setTimeout(()=>{
      ball.classList.remove('on');
      ball.style.transition='';ball.style.opacity='1';
      pupil.style.opacity='';
      targetX=currentX=0;targetY=currentY=0;vx=vy=0;touched=false;armedToDrop=false;
    },260);
  },360);
}

})();
