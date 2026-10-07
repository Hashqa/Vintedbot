# Fabrique les deux zips à envoyer sur Stake Engine :
#   stake/a-envoyer-sur-stake/jolly-wilds-frontend.zip  (contenu de frontend/, index.html à la racine)
#   stake/a-envoyer-sur-stake/jolly-wilds-math.zip      (les 7 fichiers de math/publish/, sans sous-dossier)
# Usage : python3 tools/package.py
import os, zipfile
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'stake', 'a-envoyer-sur-stake')
os.makedirs(OUT, exist_ok=True)

def pack(name, src, keep):
    path = os.path.join(OUT, name)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for dirpath, _, files in os.walk(src):
            for f in sorted(files):
                full = os.path.join(dirpath, f); rel = os.path.relpath(full, src)
                if keep(rel): z.write(full, rel)
    with zipfile.ZipFile(path) as z: names = z.namelist()
    print(f'{name} : {len(names)} fichiers, {os.path.getsize(path) / 1e6:.1f} Mo')

pack('jolly-wilds-frontend.zip', os.path.join(ROOT, 'frontend'), lambda r: not r.startswith('.'))
pack('jolly-wilds-math.zip', os.path.join(ROOT, 'math', 'publish'), lambda r: os.sep not in r)
