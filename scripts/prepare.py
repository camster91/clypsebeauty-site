from pathlib import Path
from bs4 import BeautifulSoup
import re,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'html';OUT.mkdir(exist_ok=True)
for p in (ROOT/'source-html').glob('*.html'):
 text=p.read_text()
 # Keep canonical/structured URLs; localize all operational URLs so preview is independent.
 s=BeautifulSoup(text,'html.parser')
 for x in s.select('link[rel="https://api.w.org/"],link[type="application/json"],link[rel="EditURI"],link[rel="shortlink"]'):x.decompose()
 for x in s.find_all('script',src=True):
  if any(v in x['src'] for v in ['simple-cloudflare-turnstile','challenges.cloudflare.com','add-to-cart.min.js','cart-fragments.min.js','order-attribution.min.js','sourcebuster']):x.decompose()
 for x in s.find_all(True):
  for a,v in list(x.attrs.items()):
   if isinstance(v,str) and not (x.name=='link' and x.get('rel')==['canonical']) and not (x.name=='meta' and a=='content'):
    x[a]=re.sub(r'https?://(?:www\.)?clypsebeauty\.com(?=/)', '', v)
 for x in s.find_all('script'):
  if x.string and x.get('type')!='application/ld+json':
   x.string=re.sub(r'https?:\\?/\\?/(?:www\.)?clypsebeauty\.com(?=\\?/)', '', x.string)
 # Contact-to-order replaces every cart control, including product-detail forms.
 for f in s.select('form.cart'):
  a=s.new_tag('a',href='/contact/');a['class']=['button','elementor-button','contact-to-order'];a.string='Contact to order';f.replace_with(a)
 for a in s.select('a.add_to_cart_button,a[href*="add-to-cart="]'):
  a['href']='/contact/';a['class']=[v for v in a.get('class',[]) if v not in ['add_to_cart_button','ajax_add_to_cart']];a.string='Contact to order'
 # With checkout disabled, the header bag becomes a direct shop link.
 for a in s.select('a.elementor-menu-cart__toggle_button'):
  a['href']='/shop/';a['aria-label']='Shop products';a.attrs.pop('aria-expanded',None);a.attrs.pop('id',None)
  a['class']=[v for v in a.get('class',[]) if v!='elementor-menu-cart__toggle_button']
  for x in a.select('.elementor-button-text,.elementor-button-icon-qty'):x.decompose()
 for x in s.select('iframe,script[src],link[href]'):
  value=x.get('src',x.get('href',''))
  if any(h in value for h in ['stripe.com','stripe.network','stripecdn.com']):x.decompose()
 for f in s.select('form.elementor-form'):
  f['action']='/wp-admin/admin-ajax.php';fid=f.select_one('[name=form_id]')['value'];f['data-clypse-form']=fid
  f['aria-label']={'045ee22':'Newsletter signup','3f054749':'Contact us','d98dd4e':'Kami booking'}[fid]
  hp=s.new_tag('input',attrs={'name':'website','type':'text','tabindex':'-1','autocomplete':'off','aria-hidden':'true','style':'position:absolute;left:-9999px'});f.append(hp)
  w=s.new_tag('div',attrs={'class':'clypse-turnstile','style':'width:100%;margin-top:12px'});f.append(w)
  msg=s.new_tag('p',attrs={'class':'clypse-form-status','role':'status','aria-live':'polite'});f.append(msg)
 # A cached footer may have stale page titles, but its content is preserved.
 script=s.new_tag('script',src='/forms.js',defer=True);s.body.append(script)
 ts=s.new_tag('script',src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=clypseTurnstileReady',attrs={'defer':True});s.body.append(ts)
 out=str(s)
 (OUT/p.name).write_text(out)
# Branded 404 keeps shared header/footer and does not reuse hacked content.
base=BeautifulSoup((OUT/'index.html').read_text(),'html.parser')
main=base.select_one('main') or base.select_one('[data-elementor-type="wp-page"]')
if main:
 main.clear();h=base.new_tag('h1');h.string='Page not found';main.append(h);p=base.new_tag('p');p.string='Sorry, this page could not be found.';main.append(p);a=base.new_tag('a',href='/');a.string='Return home';main.append(a);main['style']='padding:100px 24px;min-height:45vh;text-align:center'
base.title.string='Page not found - Clypse Beauty'
for x in base.select('link[rel=canonical]'):x.decompose()
(OUT/'404.html').write_text(str(base))
# Static CSS/JS can contain absolute origin URLs; make same-host references local.
for p in (ROOT/'public').rglob('*'):
 if p.suffix in ['.css','.js','.svg','.json']:
  t=p.read_text(errors='replace');t=re.sub(r'https?:\\?/\\?/(?:www\.)?clypsebeauty\.com(?=\\?/)', '',t);p.write_text(t)
