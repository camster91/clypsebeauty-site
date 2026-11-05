(() => {
 const widgets=new Map();
 window.clypseTurnstileReady=()=>document.querySelectorAll('form[data-clypse-form]').forEach(form=>{
  const el=form.querySelector('.clypse-turnstile');
  if(el&&!widgets.has(form))widgets.set(form,turnstile.render(el,{sitekey:'0x4AAAAAABAvRNbS4GPTEK6Q'}));
 });
 document.addEventListener('submit',async event=>{
  const form=event.target.closest('form[data-clypse-form]');if(!form)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!form.reportValidity())return;
  const msg=form.querySelector('.clypse-form-status'),button=form.querySelector('button[type=submit]');
  if(button.disabled)return;
  const body=new FormData(form);body.set('action','elementor_pro_forms_send_form');
  if(!body.get('cf-turnstile-response')){msg.textContent='Please complete the security check.';return;}
  button.disabled=true;msg.textContent='Sending…';
  try {
   const response=await fetch('/wp-admin/admin-ajax.php',{method:'POST',body});const result=await response.json();
   if(!response.ok||!result.success)throw new Error(result.data?.message||'Unable to send. Please try again.');
   form.reset();msg.textContent=result.data.message;
  }catch(error){msg.textContent=error.message;}finally{button.disabled=false;if(widgets.has(form))turnstile.reset(widgets.get(form));}
 },true);
})();
