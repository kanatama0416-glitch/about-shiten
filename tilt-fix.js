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
  const emit=s=>window.dispatchEvent(new CustomEvent('shiten-sensor',{detail:s}));

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
    if(sensorSeen)return;
    sensorSeen=true;
    emit('ok');
  }

  function onOrientation(e){
    const side=horizontalOrientation(e);
    if(side===null)return;
    markSensor();
    if(orientationBase===null){orientationBase=side;return;}
    if(!running())return;
    emitSteer((side-orientationBase)/10);
  }

  function emitSteer(v){
    window.dispatchEvent(new CustomEvent('shiten-steer',{detail:clamp(v)}));
  }

  function onMotion(e){
    const linear=horizontalAxis(e.acceleration);
    if(Number.isFinite(linear)){
      markSensor();
      if(running()&&Math.abs(linear)>.12){
        window.dispatchEvent(new CustomEvent('shiten-nudge',{detail:clamp(linear/2.4)}));
      }
      return;
    }
    const raw=horizontalAxis(e.accelerationIncludingGravity);
    if(!Number.isFinite(raw))return;
    markSensor();
    if(gravityBase===null){gravityBase=raw;return;}
    const delta=raw-gravityBase;
    gravityBase=gravityBase*.92+raw*.08;
    if(running()&&Math.abs(delta)>.15){
      window.dispatchEvent(new CustomEvent('shiten-nudge',{detail:clamp(delta/2.0)}));
    }
  }

  window.addEventListener('deviceorientation',onOrientation,{passive:true});
  window.addEventListener('devicemotion',onMotion,{passive:true});

  async function requestSensors(){
    if(permissionAsked){
      emit(permissionState);
      return;
    }
    permissionAsked=true;
    permissionState='requesting';
    emit('requesting');
    try{
      const calls=[];
      if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){
        calls.push(DeviceMotionEvent.requestPermission());
      }
      if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
        calls.push(DeviceOrientationEvent.requestPermission());
      }
      if(calls.length){
        const settled=await Promise.allSettled(calls);
        const values=settled.filter(r=>r.status==='fulfilled').map(r=>r.value);
        const anyGranted=values.includes('granted');
        const allDenied=values.length>0&&values.every(v=>v!=='granted');
        permissionState=anyGranted?'granted':allDenied?'denied':'error';
        emit(permissionState);
        if(!anyGranted)permissionAsked=false;
      }else{
        const hasAPI=('DeviceMotionEvent'in window)||('DeviceOrientationEvent'in window);
        permissionState=hasAPI?'not-required':'unavailable';
        emit(permissionState);
      }
    }catch(_){
      permissionAsked=false;
      permissionState='error';
      emit('error');
    }
  }

  // iOS の permission API はユーザー操作中に呼ぶ。
  eye.addEventListener('pointerdown',requestSensors,{capture:true});

  window.addEventListener('shiten-game-start',()=>{
    orientationBase=null;
    gravityBase=null;
    sensorSeen=false;
    // pointerdown で得た許可結果を、game.js が受け取れるタイミングでもう一度通知する。
    emit(permissionState==='unknown'?'waiting':permissionState);
    // 許可済みなのにイベントが一度も来ない場合は、アプリ内WebView等でセンサー配信が止められている可能性を明示。
    setTimeout(()=>{
      if(!running()||sensorSeen)return;
      if(permissionState==='granted')emit('granted-no-events');
      else if(permissionState==='not-required')emit('no-events');
    },900);
  });
})();
