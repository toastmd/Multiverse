"""Downloads Old West (and other) photos from Pixabay through its official API, named for import_art.py.
Needs a free Pixabay API key (pixabay.com/api/docs): set PIXABAY_API_KEY or pass --key.
Usage:  python3 tools/fetch_pixabay.py <out-folder> [--set west|landscapes|terrain|icons|portraits|all] [--keys a,b,c] [--list]
Then:   python3 tools/import_art.py <out-folder>
Follows Pixabay's rules: API answers are cached for 24 hours, images are downloaded (never hotlinked), only the best match per picture
is fetched (no mass downloads), and credits are written to CREDITS.txt (attribution is not required, but it is polite).
People photos are opt-in (--set portraits): check Pixabay's Content License about identifiable people before using them commercially."""
import os, sys, json, time, hashlib, urllib.request, urllib.parse, html
sys.path.insert(0, os.path.dirname(__file__))
API = os.environ.get('PIXABAY_API_BASE', 'https://pixabay.com/api/')
SETS = {  # picture key -> (search words, orientation)
  'west': {'area-town': ('old west town street', 'horizontal'), 'area-road': ('desert trail red rocks canyon', 'horizontal'), 'area-mines': ('old gold mine tunnel', 'horizontal'), 'area-gulch': ('ghost town abandoned', 'horizontal'), 'area-rail': ('old steam locomotive railway', 'horizontal'),
           'banner-home': ('wild west town sunset', 'horizontal'), 'banner-howto': ('old west saloon street', 'horizontal'), 'banner-shops': ('old general store western', 'horizontal'), 'banner-tradeskills': ('blacksmith forge sparks', 'horizontal'), 'banner-materials': ('gold mine cave', 'horizontal')},
  'landscapes': {'area-forest': ('misty dark forest', 'horizontal'), 'area-crypt': ('old stone crypt', 'horizontal'), 'area-marsh': ('swamp fog trees', 'horizontal'), 'area-dunes': ('desert dunes sunset', 'horizontal'), 'area-frost': ('snowy mountains aurora', 'horizontal'), 'area-ember': ('volcano lava night', 'horizontal'),
                 'area-citadel': ('ruined castle moonlight', 'horizontal'), 'area-abyss': ('galaxy nebula space', 'horizontal'), 'area-thorn': ('enchanted forest mushrooms', 'horizontal'), 'area-aurora': ('abandoned spaceship interior', 'horizontal'), 'area-reach': ('underwater coral reef light', 'horizontal')},
  'terrain': {'terrain-grass': ('grass texture seamless', 'all'), 'terrain-dirt': ('dirt ground texture', 'all'), 'terrain-stone': ('cobblestone texture', 'all'), 'terrain-concrete': ('concrete wall texture', 'all'), 'terrain-metal': ('brushed metal texture', 'all')},
  'icons': {'icon-ore': ('copper ore rock', 'all'), 'icon-silver': ('silver nugget', 'all'), 'icon-pearl': ('pearl', 'all'), 'icon-fish': ('fresh fish', 'all'), 'icon-herb': ('green herb leaves', 'all'), 'icon-fishingpole': ('fishing rod', 'all'), 'icon-miningpick': ('pickaxe', 'all'),
            'icon-hammer': ('blacksmith hammer', 'all'), 'icon-skillet': ('cast iron skillet', 'all'), 'icon-crowbar': ('red crowbar', 'all'), 'icon-dice': ('red dice', 'all')},
  'portraits': {'player-gunslinger-m': ('cowboy portrait hat', 'vertical'), 'player-cleric-m': ('old preacher portrait', 'vertical'), 'player-scavenger-m': ('prospector portrait beard', 'vertical'), 'player-bard-f': ('saloon singer portrait', 'vertical'), 'npc-whitlock': ('sheriff portrait', 'vertical'), 'npc-cobb': ('old railroad man portrait', 'vertical')},
}
def api(key, q, orient, cache):
    p = os.path.join(cache, hashlib.sha1(f'{q}|{orient}'.encode()).hexdigest() + '.json')
    if os.path.exists(p) and time.time() - os.path.getmtime(p) < 86400: return json.load(open(p))  # Pixabay requires 24h caching
    url = API + '?' + urllib.parse.urlencode({'key': key, 'q': q, 'image_type': 'photo', 'orientation': orient, 'safesearch': 'true', 'per_page': 5, 'order': 'popular'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=20) as r: d = json.load(r); remaining = r.headers.get('X-RateLimit-Remaining')
            json.dump(d, open(p, 'w')); 
            if remaining is not None and int(remaining) < 3: time.sleep(5)
            return d
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(20 * (attempt + 1)); continue
            raise
    raise SystemExit('Pixabay rate limit: wait a minute and run again (cached answers are reused).')
def cfgkey(): # data/config.json -> pixabay.apiKey
    try: return json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'config.json'))).get('pixabay', {}).get('apiKey')
    except Exception: return None
def main():
    a = sys.argv[1:]; flag = lambda n, d=None: (a[a.index(n) + 1] if n in a and a.index(n) + 1 < len(a) else d)
    if not a or a[0].startswith('--'): sys.exit(__doc__)
    out = a[0]; want = flag('--set', 'west'); pool = {k: v for s in (SETS if want == 'all' else [want]) for k, v in SETS[s].items()} if want in SETS or want == 'all' else sys.exit(f'Unknown set. Choose: {", ".join(SETS)}, all')
    if flag('--keys'): pool = {k: v for s in SETS.values() for k, v in s.items() if k in flag('--keys').split(',')}
    if '--list' in a: sys.exit('\n'.join(f'{k}: {q} ({o})' for k, (q, o) in pool.items()))
    key = flag('--key') or os.environ.get('PIXABAY_API_KEY') or cfgkey() or sys.exit('Set PIXABAY_API_KEY, add pixabay.apiKey to data/config.json, or pass --key (a free key from pixabay.com/api/docs).')
    os.makedirs(out, exist_ok=True); cache = os.path.join(out, '.cache'); os.makedirs(cache, exist_ok=True); credits = []; rows = []
    for name, (q, orient) in pool.items():
        dest = os.path.join(out, name + '.jpg')
        if os.path.exists(dest): print('have', name); continue
        d = api(key, q, orient, cache); hits = d.get('hits') or []
        if not hits: print('no results for', name, f'("{q}")'); continue
        h = hits[0]; url = h.get('largeImageURL') or h['webformatURL']
        with urllib.request.urlopen(url, timeout=30) as r: open(dest, 'wb').write(r.read())
        credits.append(f"{name}.jpg: \"{q}\" by {h.get('user', '?')} via Pixabay, {h.get('pageURL', '')}"); rows.append((name, q, h)); print('got ', name, '<-', q, f"({h.get('user')})"); time.sleep(0.7)
    if credits:
        with open(os.path.join(out, 'CREDITS.txt'), 'a') as f: f.write('\n'.join(credits) + '\n')
        with open(os.path.join(out, 'contact_sheet.html'), 'w') as f: f.write('<meta charset=utf-8><style>body{background:#111;color:#ddd;font:14px sans-serif}figure{display:inline-block;margin:8px;width:300px}img{width:100%}</style>' + ''.join(f'<figure><img src="{html.escape(n)}.jpg"><figcaption>{html.escape(n)}: {html.escape(q)}<br>by {html.escape(str(h.get("user")))} <a href="{html.escape(h.get("pageURL", ""))}" style="color:#e9b44c">page</a></figcaption></figure>' for n, q, h in rows))
    print(f'\nDone: {len(credits)} new image(s) in {out}. Look at contact_sheet.html, delete any you dislike, then run: python3 tools/import_art.py {out}')
if __name__ == '__main__': main()
