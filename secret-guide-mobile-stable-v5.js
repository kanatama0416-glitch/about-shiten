(function(){
  'use strict';

  var hero=document.getElementById('heroEye');
  var goal=document.getElementById('goalEye');
  var main=document.querySelector('main');
  var fifth=document.querySelector('.view-card:nth-child(5)');
  if(!hero||!goal||!main||!fifth)return;

  var style=document.createElement('style');
  style.textContent=`
main.secret-guide-root{position:relative}
.secret-trail{
  position:absolute;
  left:0;
  width:100%;
  z-index:7;
  pointer-events:none;
  opacity:0;
  transition:opacity .25s ease;
}
.secret-trail.show{opacity:.86}
.secret-trail svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.secret-trail-path{
  fill:none;
  stroke:var(--ink);
  stroke-width:3;
  stroke-linecap:round;
  stroke-linejoin:round;
  stroke-dasharray:1;
  stroke-dashoffset:1;
}
.secret-trail.show .secret-trail-path{animation:secretTrailDraw 1.75s cubic-bezier(.22,.76,.25,1) forwards}
.secret-trail-tip{
  position:absolute;
  transform:translate(-50%,-12px) scale(.7);
  opacity:0;
  font:950 27px/.8 Arial,sans-serif;
}
.secret-trail-label{
  position:absolute;
  transform:translate(-50%,-4px) rotate(-4deg);
  opacity:0;
  padding:5px 8px 4px;
  background:var(--paper);
  border:2px solid var(--ink);
  border-radius:999px;
  font:950 10px/1 system-ui,sans-serif;
  letter-spacing:.05em;
  white-space:nowrap;
}
.secret-trail.show .secret-trail-tip{animation:secretTipIn .36s 1.38s cubic-bezier(.2,.9,.3,1.25) forwards,secretTipBob .8s 1.8s ease-in-out infinite alternate}
.secret-trail.show .secret-trail-label{animation:secretLabelIn .3s 1.48s ease forwards}
.goal-eye.secret-prompt{animation:secretGoalNudge .75s 1.55s ease-in-out 2}
.goal-secret-hint.secret-fly-away{animation:secretHintFly .48s cubic-bezier(.42,0,.7,.3) forwards!important}
.hero-click-speech{
  position:absolute;
  z-index:8;
  right:8%;
  top:8px;
  padding:10px 15px 9px;
  border:3px solid var(--ink);
  border-radius:999px;
  background:var(--paper);
  color:var(--ink);
  font:950 16px/1 system-ui,sans-serif;
  letter-spacing:.05em;
  white-space:nowrap;
  opacity:0;
  transform:translateY(8px) rotate(3deg) scale(.88);
  pointer-events:none;
  box-shadow:4px 4px 0 var(--yellow);
}
.hero-click-speech:after{
  content:"";
  position:absolute;
  left:26px;
  bottom:-10px;
  width:16px;
  height:16px;
  background:var(--paper);
  border-right:3px solid var(--ink);
  border-bottom:3px solid var(--ink);
  transform:rotate(45deg);
}
.hero-click-speech.show{animation:heroSpeechIn .4s cubic-bezier(.2,.9,.3,1.2) forwards,heroSpeechBob .9s .45s ease-in-out infinite alternate}
body.game-running .secret-trail,body.game-running .hero-click-speech{display:none!important}
@keyframes secretTrailDraw{to{stroke-dashoffset:0}}
@keyframes secretTipIn{to{opacity:1;transform:translate(-50%,0) scale(1)}}
@keyframes secretTipBob{from{margin-top:0}to{margin-top:6px}}
@keyframes secretLabelIn{to{opacity:1}}
@keyframes secretGoalNudge{0%,100%{transform:scale(1)}45%{transform:scale(1.045) rotate(-1deg)}}
@keyframes secretHintFly{0%{opacity:1}100%{opacity:0;transform:translate(-50%,-70vh) rotate(4deg) scale(.72)}}
@keyframes heroSpeechIn{to{opacity:1;transform:translateY(0) rotate(3deg) scale(1)}}
@keyframes heroSpeechBob{from{margin-top:0}to{margin-top:-5px}}
@media(prefers-reduced-motion:reduce){
  .secret-trail-path,.secret-trail-tip,.secret-trail-label,.goal-eye.secret-prompt,.goal-secret-hint.secret-fly-away,.hero-click-speech{animation-duration:.01ms!important;animation-iteration-count:1!important}
}
`;
  document.head.appendChild(style);
  main.classList.add('secret-guide-root');

  var trail=document.createElement('div');
  trail.className='secret-trail';
  trail.setAttribute('aria-hidden','true');
  trail.innerHTML='<svg preserveAspectRatio="none" aria-hidden="true"><path class="secret-trail-path" pathLength="1"></path></svg><span class="secret-trail-tip">↓</span><span class="secret-trail-label">クリック？</span>';
  main.appendChild(trail);

  var speech=document.createElement('div');
  speech.className='hero-click-speech';
  speech.textContent='クリック！';
  hero.appendChild(speech);

  var trailShown=false;
  var trailTimer=0;
  var handoffStarted=false;

  function layoutTrail(){
    var mr=main.getBoundingClientRect();
    var fr=fifth.getBoundingClientRect();
    var gr=goal.getBoundingClientRect();
    var startY=fr.bottom-mr.top+18;
    var endY=gr.top-mr.top+gr.height*.38;
    var h=Math.max(150,endY-startY);
    var w=mr.width;
    var endX=gr.left-mr.left+gr.width/2;
    var startX=w*.91;
    var bendX=w*.96;
    trail.style.top=startY+'px';
    trail.style.height=h+'px';
    var path=trail.querySelector('.secret-trail-path');
    path.setAttribute('d','M '+startX+' 0 C '+bendX+' '+(h*.25)+', '+(w*.92)+' '+(h*.64)+', '+endX+' '+(h-18));
    var tip=trail.querySelector('.secret-trail-tip');
    var label=trail.querySelector('.secret-trail-label');
    tip.style.left=endX+'px';
    tip.style.top=(h-18)+'px';
    label.style.left=Math.min(w-52,endX+68)+'px';
    label.style.top=(h-42)+'px';
  }

  function showTrail(){
    if(trailShown||document.body.classList.contains('game-running'))return;
    trailShown=true;
    layoutTrail();
    trail.classList.add('show');
    goal.classList.add('secret-prompt');
    setTimeout(function(){goal.classList.remove('secret-prompt')},3300);
  }

  function checkTrailTrigger(){
    if(window.matchMedia('(pointer:coarse)').matches)return;
    if(trailShown||document.body.classList.contains('game-running'))return;
    var fr=fifth.getBoundingClientRect();
    if(fr.bottom<innerHeight*.78){
      clearTimeout(trailTimer);
      trailTimer=setTimeout(showTrail,500);
    }
  }

  function showHeroSpeechWhenReady(){
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      var r=hero.getBoundingClientRect();
      if((r.top<innerHeight*.72&&r.bottom>0)||tries>24){
        clearInterval(timer);
        speech.classList.add('show');
      }
    },90);
  }

  function handoffToHero(){
    if(window.matchMedia('(pointer:coarse)').matches)return;
    if(handoffStarted||document.body.classList.contains('game-running'))return;
    handoffStarted=true;
    trail.classList.remove('show');
    goal.classList.remove('secret-prompt');

    setTimeout(function(){
      var hint=document.querySelector('.goal-secret-hint');
      if(hint)hint.classList.add('secret-fly-away');
    },650);

    setTimeout(function(){
      window.scrollTo({top:0,behavior:'smooth'});
      showHeroSpeechWhenReady();
    },920);
  }

  goal.addEventListener('click',handoffToHero);
  goal.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' ')handoffToHero();
  });
  hero.addEventListener('click',function(){speech.classList.remove('show')});

  window.addEventListener('scroll',checkTrailTrigger,{passive:true});
  window.addEventListener('resize',function(){if(trailShown)layoutTrail()},{passive:true});
  checkTrailTrigger();
})();
