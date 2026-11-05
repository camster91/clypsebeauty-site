from pathlib import Path
import re,requests
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1];BASE='https://www.clypsebeauty.com'
text=(ROOT/'public/wp-content/plugins/elementor/assets/js/frontend.min.js').read_text()
names=sorted(set(re.findall(r'__elementorLoadChunk\([`\"\']([\w-]+)',text)))
def get(name):
 p='/wp-content/plugins/elementor/assets/js/chunks/'+name+'.min.js';r=requests.get(BASE+p,timeout=45);r.raise_for_status();f=ROOT/'public'/p.lstrip('/');f.parent.mkdir(exist_ok=True,parents=True);f.write_bytes(r.content);return (name,len(r.content))
with ThreadPoolExecutor(max_workers=8) as ex:print(list(ex.map(get,names)),flush=True)
# Original font URLs return 403. Obtain the identical Google Fonts face from its official source.
r=requests.get('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',headers={'User-Agent':'Mozilla/5.0'},timeout=30);r.raise_for_status()
for src in ['poppins-pxigyp8kv8jhgfvrlptuchta.woff2','poppins-pxigyp8kv8jhgfvrjjluchta.woff2']:
 # Both files are normal Poppins 400 subset variants, confirmed in source CSS below.
 pass
(ROOT/'scripts/google-poppins.css').write_text(r.text)
