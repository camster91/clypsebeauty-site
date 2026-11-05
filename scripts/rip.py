"""Allowlisted WordPress export. Never crawl the hacked sitemap."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin,urlsplit,unquote
import requests,re,json,html,time
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
BASE='https://www.clypsebeauty.com'
PAGES=['/','/huehealth-hub/','/clypse-consultants/','/contact/','/ingredients/','/about-us/','/help-info/','/terms-privacy/','/shop/','/product/the-eclypse-serum/','/product/bad-milk/']
seen=set(); errors=[]; assets={}
def get(url):
 for i in range(3):
  try:
   r=requests.get(url,timeout=45);r.raise_for_status();return r
  except Exception as e:
   if i==2:raise

def asset_url(url,base):
 url=html.unescape(url).replace('\\/','/')
 u=urlsplit(urljoin(base,url))
 if u.hostname not in ['clypsebeauty.com','www.clypsebeauty.com']:return
 if not re.search(r'\.(css|js|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|eot|mp4|webm|pdf|json|avif)(?:$)',u.path,re.I):return
 return BASE+u.path

def refs(text,base,is_html=False):
 out=set()
 if is_html:
  s=BeautifulSoup(text,'html.parser')
  for tag in s.find_all(True):
   for a in ['src','href','data-src','data-lazy-src','poster','data-bg']:
    if tag.get(a):
     u=asset_url(tag[a],base)
     if u:out.add(u)
   for a in ['srcset','data-srcset','data-lazy-srcset']:
    for v in tag.get(a,'').split(','):
     if v.strip():
      u=asset_url(v.strip().split()[0],base)
      if u:out.add(u)
 for match in re.findall(r'(?:https?:)?(?:\\?/){2}[^\s<>"\'()]+|url\(\s*[\'\"]?([^\s)\'\"]+)',text):
  if match:
   u=asset_url(match,base)
   if u:out.add(u)
 # Absolute URLs in JSON/inline CSS; regex above capture group only returns url().
 for match in re.findall(r'https?:(?:\\?/){2}[^\s<>"\'()]+',text):
  u=asset_url(match,base)
  if u:out.add(u)
 return out

def page(path):
 r=get(BASE+path);name='index' if path=='/' else path.strip('/').replace('/','__')
 (ROOT/'source-html'/f'{name}.html').write_text(r.text)
 return refs(r.text,BASE+path,True)

def download(url):
 p=unquote(urlsplit(url).path).lstrip('/')
 try:
  r=get(url);ct=r.headers.get('content-type','')
  if 'text/html' in ct:raise ValueError('HTML response for asset')
  f=ROOT/'public'/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(r.content)
  assets['/'+p]={'bytes':len(r.content),'url':url}
  more=refs(r.text,url) if any(t in ct for t in ['javascript','css','json','svg']) else set()
  # Elementor webpack runtime builds lazy chunk URLs from a name/hash map.
  if 'webpack' in p and 'runtime' in p:
   txt=r.text
   for name in re.findall(r'"([a-zA-Z][\w-]+)"',txt):
    if name not in ['exports','object','function','undefined','script','missing','timeout','chunk','jsonp','load','error']:
     pass
   (ROOT/'scripts'/('runtime-'+('pro' if '/elementor-pro/' in p else 'core')+'.txt')).write_text(txt)
  return more
 except Exception as e:errors.append({'url':url,'error':str(e)});return set()

if __name__=='__main__':
 pending=set()
 with ThreadPoolExecutor(max_workers=10) as ex:
  for links in ex.map(page,PAGES):pending.update(links)
  while pending:
   batch=sorted(pending-seen);seen.update(batch);pending=set()
   if not batch:break
   for more in ex.map(download,batch):pending.update(more-seen)
   print('downloaded',len(assets),'errors',len(errors),'next',len(pending),flush=True)
 (ROOT/'scripts'/'asset-manifest.json').write_text(json.dumps(assets,indent=2))
 (ROOT/'scripts'/'download-errors.json').write_text(json.dumps(errors,indent=2))
 print('DONE',len(assets),len(errors))
