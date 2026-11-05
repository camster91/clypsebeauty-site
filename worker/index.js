import { EmailMessage } from 'cloudflare:email';
import { handleForm } from './forms.js';
async function sendMail(env,subject,fields,id){
 const body=`${subject}\nReference: ${id}\n\n`+Object.entries(fields).map(([k,v])=>`${k}: ${v}`).join('\n\n');
 const raw=[`From: Clypse Beauty <${env.EMAIL_FROM}>`,`To: ${env.FORM_RECIPIENT}`,`Reply-To: ${fields.email}`,`Subject: Clypse Beauty - ${subject}`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: 8bit','',body].join('\r\n');
 await env.EMAIL.send(new EmailMessage(env.EMAIL_FROM,env.FORM_RECIPIENT,raw));
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.hostname==='clypsebeauty.com'){url.hostname='www.clypsebeauty.com';return Response.redirect(url,301);}
  if(['/cart','/cart/','/checkout','/checkout/'].includes(url.pathname))return Response.redirect(new URL('/shop/',url),302);
  if(url.pathname==='/wp-admin/admin-ajax.php')return handleForm(request,env,sendMail);
  if(url.searchParams.has('add-to-cart'))return Response.redirect(new URL('/contact/',url),302);
  if(url.searchParams.has('wc-ajax'))return Response.json({fragments:{},cart_hash:''},{headers:{'Cache-Control':'no-store'}});
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  if(url.pathname.startsWith('/wp-admin')||url.pathname.startsWith('/wp-json')||url.pathname.endsWith('.php'))return new Response('Not found',{status:404});
  const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('X-Frame-Options','SAMEORIGIN');
  if(url.hostname.endsWith('.workers.dev'))headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(response.body,{status:response.status,headers});
 }
};
