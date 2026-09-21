
(() => {
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

  let selectedFile=null;
  const uploadCard=qs('#uploadCard');
  const trackCard=qs('#trackCard');
  const fileInput=qs('#fileInput');
  const uploadBar=qs('#uploadBar');

  const fmtSize=bytes=>{
    const mb=bytes/1024/1024;
    return mb<1?Math.max(1,Math.round(bytes/1024))+' KB':(mb<10?mb.toFixed(1):Math.round(mb))+' MB';
  };
  const fmtDuration=seconds=>{
    if(!Number.isFinite(seconds)||seconds<=0)return '—';
    const m=Math.floor(seconds/60);
    const s=Math.round(seconds%60).toString().padStart(2,'0');
    return m+':'+s;
  };
  const getDuration=file=>new Promise(resolve=>{
    const url=URL.createObjectURL(file);
    const audio=document.createElement('audio');
    audio.preload='metadata';
    audio.onloadedmetadata=()=>{
      const duration=audio.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    audio.onerror=()=>{
      URL.revokeObjectURL(url);
      resolve(NaN);
    };
    audio.src=url;
  });

  function setLandingUploadStage(stage){
    const steps=qsa('[data-upload-step]');
    const lines=qsa('.clean-upload-step-line');
    steps.forEach((item,index)=>{
      const number=index+1;
      item.classList.toggle('is-complete',number<stage);
      item.classList.toggle('is-active',number===stage);
    });
    lines.forEach((line,index)=>{
      const afterStep=index+1;
      line.classList.toggle('is-complete',afterStep<stage);
      line.classList.toggle('is-active',afterStep===stage-1);
    });
  }

  setLandingUploadStage(1);

  async function acceptFile(file){
    if(!file)return;
    selectedFile=file;
    uploadCard?.classList.add('uploading');
    if(uploadBar) uploadBar.style.width='18%';
    setLandingUploadStage(2);

    const duration=await getDuration(file);
    if(uploadBar) uploadBar.style.width='72%';

    const demo=/blinding\s*lights/i.test(file.name||'');
    if(qs('#trackTitle')) qs('#trackTitle').textContent=demo?'Blinding Lights':file.name.replace(/\.[^.]+$/,'');
    if(qs('#trackSubtitle')) qs('#trackSubtitle').textContent=demo?'The Weeknd · After Hours':'Unknown artist · —';

    const extension=(file.name.split('.').pop()||'Audio').toUpperCase();
    if(qs('#trackTech')){
      qs('#trackTech').innerHTML=[
        extension,
        Number.isFinite(duration)?fmtDuration(duration):(demo?'3:20':'—'),
        demo?'320 kbps':'—',
        demo?'44.1 kHz':'—',
        fmtSize(file.size)
      ].map(value=>'<span>'+value+'</span>').join('');
    }

    if(qs('#trackMeta')){
      qs('#trackMeta').innerHTML=(demo
        ? ['After Hours','2020','Track 9/14','Republic Records']
        : ['Metadata pending','—','—','—']
      ).map(value=>'<span>'+value+'</span>').join('');
    }

    if(uploadBar) uploadBar.style.width='100%';
    setTimeout(()=>{
      uploadCard?.classList.remove('uploading','dragging');
      uploadCard?.classList.add('clean-hidden');
      trackCard?.classList.remove('clean-hidden');
    },520);
  }

  fileInput?.addEventListener('change',e=>acceptFile(e.target.files?.[0]));
  ['dragenter','dragover'].forEach(type=>uploadCard?.addEventListener(type,e=>{
    e.preventDefault();
    uploadCard.classList.add('dragging');
  }));
  ['dragleave','dragend'].forEach(type=>uploadCard?.addEventListener(type,e=>{
    e.preventDefault();
    uploadCard.classList.remove('dragging');
  }));
  uploadCard?.addEventListener('drop',e=>{
    e.preventDefault();
    uploadCard.classList.remove('dragging');
    acceptFile(e.dataTransfer?.files?.[0]);
  });

  qs('#changeTrack')?.addEventListener('click',()=>{
    selectedFile=null;
    trackCard?.classList.add('clean-hidden');
    uploadCard?.classList.remove('clean-hidden');
    if(fileInput) fileInput.value='';
    if(uploadBar) uploadBar.style.width='0%';
    setLandingUploadStage(1);
  });

  qsa('[data-proof]').forEach(button=>button.addEventListener('click',()=>{
    qsa('[data-proof]').forEach(item=>item.classList.toggle('active',item===button));
    qs('#proofWorkspace')?.classList.toggle('clean-hidden',button.dataset.proof!=='workspace');
    qs('#proofHubs')?.classList.toggle('clean-hidden',button.dataset.proof!=='hubs');
  }));

  qs('#startFlow')?.addEventListener('click',()=>{
    if(!selectedFile)return;
    window.location.href='onboarding.html';
  });
})();
