const FORMS={
 '045ee22':{name:'Newsletter signup',required:['email']},
 '3f054749':{name:'Contact enquiry',required:['email']},
 'd98dd4e':{name:'Kami booking',required:['email']}
};
const json=(success,message,status=200)=>Response.json({success,data:{message}},{status,headers:{'Cache-Control':'no-store'}});
export async function handleForm(request,env,sendMail,verifyFetch=fetch){
 if(request.method!=='POST')return json(false,'Method not allowed.',405);
 const origin=request.headers.get('Origin');const url=new URL(request.url);
 if(!origin||origin!==url.origin)return json(false,'Invalid request origin.',403);
 if(Number(request.headers.get('Content-Length')||0)>16000)return json(false,'Submission too large.',413);
 if(!env.SUBMISSIONS||!env.TURNSTILE_SECRET_KEY||env.EMAIL_READY!=='true'||!env.FORM_RECIPIENT||!env.EMAIL)return json(false,'The form is temporarily unavailable. Please try again later.',503);
 let data;try{const text=await request.text();if(new TextEncoder().encode(text).length>16000)return json(false,'Submission too large.',413);data=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body:text}).formData();}catch{return json(false,'Invalid submission.',400);}
 const definition=FORMS[data.get('form_id')];
 if(data.get('action')!=='elementor_pro_forms_send_form'||!definition)return json(false,'Unknown form.',400);
 if(data.get('website')||data.get('form_fields[field_29e869d]')||data.get('form_fields[field_1d40346]'))return json(false,'Invalid submission.',400);
 const fields={};for(const [key,value]of data){const m=/^form_fields\[(\w+)\]$/.exec(key);if(m&&typeof value==='string'&&!['field_29e869d','field_1d40346'].includes(m[1]))fields[m[1]]=value.trim().slice(0,4000);}
 if(!/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(fields.email||'')||(fields.email||'').length>254)return json(false,'Please enter a valid email address.',400);
 const token=data.get('cf-turnstile-response');if(typeof token!=='string'||!token||token.length>2048)return json(false,'Please complete the security check.',400);
 let verification;try{const response=await verifyFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('CF-Connecting-IP')||''})});verification=await response.json();}catch{return json(false,'Security check unavailable. Please try again.',503);}
 if(!verification.success||verification.hostname!==url.hostname)return json(false,'Security check failed. Please try again.',403);
 const id=crypto.randomUUID(),key=`submission:${new Date().toISOString()}:${id}`;
 const record={id,form:definition.name,fields,createdAt:new Date().toISOString(),emailStatus:'pending'};
 try{
  await env.SUBMISSIONS.put(key,JSON.stringify(record),{expirationTtl:90*86400});
  try{await sendMail(env,definition.name,fields,id);record.emailStatus='sent';}catch{record.emailStatus='failed';await env.SUBMISSIONS.put(key,JSON.stringify(record),{expirationTtl:90*86400});return json(false,'Your request was saved, but the email could not be delivered. Please contact us directly.',502);}
  await env.SUBMISSIONS.put(key,JSON.stringify(record),{expirationTtl:90*86400});
  return json(true,'Thank you! Your submission has been sent.');
 }catch{return json(false,'Unable to save your submission. Please try again.',503);}
}
