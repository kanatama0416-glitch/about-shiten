(()=>{
  const eye=document.getElementById('heroEye');
  if(!eye)return;

  let asked=false;
  let lastOrientation=0;
  let lastMotion=0;
  let motionBase=null;

  function clamp(v){return Math.max(-1,Math.min(1,v));}

  function screenAngle(){
    if(screen.orientation && Number.isFinite(screen.orientation.angle)) return screen.orientation.angle;
    if(Number.isFinite(window.orientation)) return Number(window.orientation);
    return 0;
  }

  function steerGame(value){
    if(!document.body.classList.contains('game-running'))return;
    const steer=clamp(value);
    const x=innerWidth/2 + steer*(innerWidth*.38);
    try{
      window.dispatchEvent(new PointerEvent('pointermove',{
        pointerType:'touch',buttons:1,pressure:.5,
        clientX:x,clientY:innerHeight/2,bubbles:true
      }));
    }catch(_){
      const ev=new Event('pointermove');
      Object.defineProperties(ev,{
        pointerType:{value:'touch'},buttons:{value:1},pressure:{value:.5},
        clientX:{value:x},clientY:{value:innerHeight/2}
      });
      window.dispatchEvent(ev);
    }
  }

  function onOrientation(e){
    let gamma=Number(e.gamma), beta=Number(e.beta);
    if(!Number.isFinite(gamma) && !Number.isFinite(beta))return;
    const a=((screenAngle()%360)+360)%360;
    let side=0;
    if(a===90) side=-(Number.isFinite(beta)?beta:0);
    else if(a===270) side=(Number.isFinite(beta)?beta:0);
    else if(a===180) side=-(Number.isFinite(gamma)?gamma:0);
    else side=(Number.isFinite(gamma)?gamma:0);
    lastOrientation=performance.now();
    steerGame(side/18);
  }

  function onMotion(e){
    // orientation が届いている端末ではそちらを優先
    if(performance.now()-lastOrientation<350)return;
    const g=e.accelerationIncludingGravity;
    if(!g)return;
    const a=((screenAngle()%360)+360)%360;
    let side;
    if(a===90) side=Number(g.y);
    else if(a===270) side=-Number(g.y);
    else if(a===180) side=-Number(g.x);
    else side=Number(g.x);
    if(!Number.isFinite(side))return;
    if(motionBase===null)motionBase=side;
    lastMotion=performance.now();
    steerGame((side-motionBase)/3.2);
  }

  function attach(){
    window.addEventListener('deviceorientation',onOrientation,{passive:true});
    window.addEventListener('devicemotion',onMotion,{passive:true});
  }
  attach();

  async function requestSensors(){
    if(asked)return;
    asked=true;
    const req=[];
    try{
      if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){
        req.push(DeviceOrientationEvent.requestPermission());
      }
      if(typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function'){
        req.push(DeviceMotionEvent.requestPermission());
      }
      if(req.length) await Promise.allSettled(req);
    }catch(_){ }
  }

  // iPhoneは「ユーザー操作の最中」に許可要求する必要がある。
  // 黒目に触れた瞬間に要求し、許可後は次のドラッグからそのまま遊べる。
  eye.addEventListener('pointerdown',requestSensors,{capture:true,once:false});
})();
