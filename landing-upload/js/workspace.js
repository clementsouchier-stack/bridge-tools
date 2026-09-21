
(() => {
  const state=document.body?.dataset.workspaceState || 'details';

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element ? event.target : null;
    if(!target)return;

    const tags=target.closest('[data-testid="tab-2"]');
    if(tags){
      event.preventDefault();
      event.stopPropagation();
      if(state!=='tags') window.location.href='workspace-tags.html';
      return;
    }

    const details=target.closest('[data-testid="tab-0"]');
    if(details){
      event.preventDefault();
      event.stopPropagation();
      if(state!=='details') window.location.href='workspace.html';
    }
  },true);
})();
