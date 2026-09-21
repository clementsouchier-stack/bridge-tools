
(() => {
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

  const flow=qs('#signupFlow');
  const screens=qsa('.signup-screen[data-step]');
  const exit=qs('#signupExit');
  const progress=qs('#signupProgress');

  let step=0;
  let analysisStartedAt=performance.now();
  let analysisTimer=null;

  const phases=[
    {label:'Reading metadata',segments:1,ready:false},
    {label:'Analyzing audio',segments:2,ready:false},
    {label:'Generating tags',segments:3,ready:false},
    {label:'Analysis ready',segments:4,ready:true}
  ];

  const timePhase=()=>{
    const elapsed=performance.now()-analysisStartedAt;
    if(elapsed<4500)return 0;
    if(elapsed<12000)return 1;
    if(elapsed<21000)return 2;
    return 3;
  };

  const minPhaseForStep=currentStep=>{
    if(currentStep<=0)return 0;
    if(currentStep<=2)return 1;
    if(currentStep===3)return 2;
    return 3;
  };

  function renderTrackProgress(){
    const phaseIndex=Math.max(timePhase(),minPhaseForStep(step));
    const phase=phases[Math.min(phaseIndex,3)];
    const screen=screens[step];
    const thread=screen?.querySelector('.signup-track-thread');
    if(!thread)return;

    const state=thread.querySelector('[data-analysis-state]');
    const label=thread.querySelector('[data-analysis-label]');
    const segments=[...thread.querySelectorAll('[data-analysis-segment]')];

    if(label) label.textContent=phase.label;
    state?.classList.toggle('is-ready',phase.ready);
    thread.classList.toggle('is-ready',phase.ready);

    segments.forEach((segment,index)=>{
      const n=index+1;
      segment.classList.remove('is-active','is-complete');
      if(phase.ready || n<phase.segments) segment.classList.add('is-complete');
      else if(n===phase.segments) segment.classList.add('is-active');
    });
  }

  function renderProgress(){
    if(!progress)return;
    progress.innerHTML='';
    for(let i=0;i<5;i++){
      const dot=document.createElement('i');
      dot.classList.toggle('active',i===step);
      progress.appendChild(dot);
    }
  }

  function showStep(next){
    step=Math.max(0,Math.min(4,next));
    screens.forEach((screen,index)=>screen.classList.toggle('active',index===step));
    renderProgress();
    renderTrackProgress();
    if(flow) flow.scrollTop=0;
  }

  qsa('[data-next]').forEach(button=>{
    button.addEventListener('click',()=>{
      if(step<4) showStep(step+1);
      else window.location.href='workspace.html';
    });
  });

  exit?.addEventListener('click',()=>window.location.href='index.html');

  showStep(0);
  analysisTimer=setInterval(renderTrackProgress,800);
  window.addEventListener('beforeunload',()=>analysisTimer && clearInterval(analysisTimer));
})();
