(()=>{
  const eye=document.getElementById('heroEye');
  if(!eye)return;

  let permissionAsked=false;
  let orientationBase=null;
  let gravityBase=null;
  let sensorSeen=false;

  const clamp=v=>Math.max(-1,Math.min(1,v));
  const running=()=>document.body.classList.contains('game-running');

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
    window.dispatchEvent(new CustomEvent('shiten-sensor',{detail:'ok'}));
  }

  function onOrientation(e){
    const side=horizontalOrientation(e);
    if(side===null)return;
    markSensor();
    if(orientationBase===null){orientationBase=side;return;}
    if(!running())return;
    // 傾けた角度そのものを、継続的な左右の力として使う。
    window.dispatchEvent(new CustomEvent('shiten-steer',{detail:clamp((side-orientationBase)/10)}));
  }

  function onMotion(e){
    // 「傾ける」だけでなく、端末そのものを左右へスッと動かした時も効かせる。
    const linear=horizontalAxis(e.acceleration);
    if(Number.isFinite(linear)){
      markSensor();
      if(running()&&Math.abs(linear)>.12){
        window.dispatchEvent(new CustomEvent('shiten-nudge',{detail:clamp(linear/2.4)}));
      }
      return;
    }

    // acceleration が取れない端末では重力込みの値から変化量を使う。
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
    // iOS はユーザー操作の同期的な起点から permission API を呼ぶ必要がある。
    if(permissionAsked)return;
    permissionAsked=true;
    try{
      const requests=[];
      if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){
        requests.push(DeviceMotionEvent.requestPermission());
      }
      if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
        requests.push(DeviceOrientationEvent.requestPermission());
      }
      if(requests.length){
        const result=await Promise.all(requests);
        const ok=result.every(v=>v==='granted');
        window.dispatchEvent(new CustomEvent('shiten-sensor',{detail:ok?'granted':'denied'}));
        if(!ok)permissionAsked=false;
      }else{
        window.dispatchEvent(new CustomEvent('shiten-sensor',{detail:'not-required'}));
      }
    }catch(_){
      permissionAsked=false;
      window.dispatchEvent(new CustomEvent('shiten-sensor',{detail:'error'}));
    }
  }

  // 許可要求は黒目に触れたその瞬間。Promise の前に API 呼び出しまで行う。
  eye.addEventListener('pointerdown',requestSensors,{capture:true});

  // ゲーム開始時の持ち方をニュートラル位置として再キャリブレーション。
  window.addEventListener('shiten-game-start',()=>{
    orientationBase=null;
    gravityBase=null;
    sensorSeen=false;
    window.dispatchEvent(new CustomEvent('shiten-sensor',{detail:'waiting'}));
  });
})();
