(()=>{
  const eye=document.getElementById('heroEye');
  if(!eye)return;

  let permissionAsked=false;
  let permissionState='unknown';
  let orientationBase=null;
  let gravityBase=null;
  let sensorSeen=false;

  const clamp=v=>Math.max(-1,Math.min(1,v));
  const running=()=>document.body.classList.contains('game-running');
  const report=s=>window.dispatchEvent(new CustomEvent('shiten-sensor',{detail:s}));

  function angle(){
    if(screen.orientation&&Number.isFinite(screen.orientation.angle))return ((screen.orientation.angle%360)+360)%360;
    if(Number.isFinite(window.orientation))return ((Number(window.orientation)%360)+360)%360;
    return 0;
  }

  function horizontalOrientation(e){
    const g=Number(e.gamma),b=Number(e.beta),a=angle();
    if(!Number.isFinite(g)&&!Number.isFinite(b))return null;
    if(a===90)return -(Number.isFinite(b)?b:0);
    if(a===270)return Number.isFinite(b)?b:0;
    if(a===180)return -(Number.isFinite(g)?g:0);
    return Number.isFinite(g)?g:0;
  }

  function horizontalAxis(obj){
    if(!obj)return null;
    const x=Number(obj.x),y=Number(obj.y),a=angle();
    if(a===90)return Number.isFinite(y)?y:null;
    if(a===270)return Number.isFinite(y)?-y:null;
    if(a===180)return Number.isFinite(x)?-x:null;
    return Number.isFinite(x)?x:null;
  }

  function markSensor(){
    sensorSeen=true;
    if(running())report('ok');
  }

  function onOrientation(e){
    const side=horizontalOrientation(e);
    if(side===null)return;
    markSensor();
    if(orientationBase===null){orientationBase=side;return;}
    if(!running())return;
    window.dispatchEvent(new CustomEvent('shiten-steer',{detail:clamp((side-orientationBase)/10)}));
  }

  function onMotion(e){
    const linear=horizontalAxis(e.acceleration);
    if(Number.isFinite(linear)){
      markSensor();
      if(running()&&Math.abs(linear)>.12)window.dispatchEvent(new CustomEvent('shiten-nudge',{detail:clamp(linear/2.4)}));
      return;
    }
    const raw=horizontalAxis(e.accelerationIncludingGravity);
    if(!Number.isFinite(raw))return;
    markSensor();
    if(gravityBase===null){gravityBase=raw;return;}
    const delta=raw-gravityBase;
    gravityBase=gravityBase*.92+raw*.08;
    if(running()&&Math.abs(delta)>.15)window.dispatchEvent(new CustomEvent('shiten-nudge',{detail:clamp(delta/2.0)}));
  }

  window.addEventListener('deviceorientation',onOrientation,{passive:true});
  window.addEventListener('devicemotion',onMotion,{passive:true});

  function requestSensors(){
    if(permissionAsked)return;
    permissionAsked=true;
    const hasMotion=typeof DeviceMotionEvent!=='undefined';
    const hasOrientation=typeof DeviceOrientationEvent!=='undefined';
    if(!hasMotion&&!hasOrientation){permissionState='unavailable';report('unavailable');return;}

    try{
      const promises=[];
      if(hasMotion&&typeof DeviceMotionEvent.requestPermission==='function')promises.push(DeviceMotionEvent.requestPermission());
      if(hasOrientation&&typeof DeviceOrientationEvent.requestPermission==='function')promises.push(DeviceOrientationEvent.requestPermission());
      if(!promises.length){permissionState='not-required';report('not-required');return;}
      Promise.allSettled(promises).then(results=>{
        const vals=results.map(r=>r.status==='fulfilled'?r.value:'error');
        if(vals.some(v=>v==='granted')){permissionState='granted';report('granted');}
        else if(vals.some(v=>v==='denied')){permissionState='denied';report('denied');}
        else{permissionState='error';report('error');permissionAsked=false;}
      });
    }catch(_){permissionState='error';report('error');permissionAsked=false;}
  }

  /* iOSの許可UIでドラッグが中断されないよう、許可要求はpointerdownではなくpointerupで行う。 */
  eye.addEventListener('pointerup',requestSensors,{capture:true});

  window.addEventListener('shiten-game-start',()=>{
    orientationBase=null;
    gravityBase=null;
    sensorSeen=false;
    report('waiting');
    setTimeout(()=>{
      if(!running())return;
      if(sensorSeen)report('ok');
      else if(permissionState==='granted')report('granted-no-events');
      else if(permissionState==='unavailable')report('unavailable');
      else report('no-events');
    },900);
  });
})();
