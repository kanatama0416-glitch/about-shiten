(()=>{
  const eye=document.getElementById('heroEye');
  if(!eye)return;
  let asked=false,lastOrientation=0,motionBase=null,orientationBase=null;
  function clamp(v){return Math.max(-1,Math.min(1,v));}
  function screenAngle(){if(screen.orientation&&Number.isFinite(screen.orientation.angle))return screen.orientation.angle;if(Number.isFinite(window.orientation))return Number(window.orientation);return 0;}
  function steerGame(value){
    if(!document.body.classList.contains('game-running'))return;
    window.dispatchEvent(new CustomEvent('shiten-steer',{detail:clamp(value)}));
  }
  function sideFromOrientation(e){
    const gamma=Number(e.gamma),beta=Number(e.beta);if(!Number.isFinite(gamma)&&!Number.isFinite(beta))return null;
    const a=((screenAngle()%360)+360)%360;
    if(a===90)return -(Number.isFinite(beta)?beta:0);
    if(a===270)return Number.isFinite(beta)?beta:0;
    if(a===180)return -(Number.isFinite(gamma)?gamma:0);
    return Number.isFinite(gamma)?gamma:0;
  }
  function onOrientation(e){
    const side=sideFromOrientation(e);if(side===null)return;lastOrientation=performance.now();
    if(!document.body.classList.contains('game-running')){orientationBase=side;return;}
    if(orientationBase===null)orientationBase=side;
    steerGame((side-orientationBase)/12);
  }
  function onMotion(e){
    if(performance.now()-lastOrientation<300)return;
    const g=e.accelerationIncludingGravity;if(!g)return;
    const a=((screenAngle()%360)+360)%360;let side;
    if(a===90)side=Number(g.y);else if(a===270)side=-Number(g.y);else if(a===180)side=-Number(g.x);else side=Number(g.x);
    if(!Number.isFinite(side))return;if(motionBase===null)motionBase=side;steerGame((side-motionBase)/2.2);
  }
  function attach(){window.addEventListener('deviceorientation',onOrientation,{passive:true});window.addEventListener('devicemotion',onMotion,{passive:true});}
  attach();
  async function requestSensors(){
    if(asked)return;asked=true;
    try{
      const req=[];
      if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function')req.push(DeviceOrientationEvent.requestPermission());
      if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function')req.push(DeviceMotionEvent.requestPermission());
      if(req.length)await Promise.allSettled(req);
    }catch(_){asked=false;}
  }
  eye.addEventListener('pointerdown',()=>{requestSensors();orientationBase=null;motionBase=null;},{capture:true});
})();
