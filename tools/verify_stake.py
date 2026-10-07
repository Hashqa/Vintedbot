# Lance les contrôles officiels du Math SDK de Stake Engine (utils/rgs_verification.py) sur nos fichiers.
import sys, os, json
# Nécessite une copie du Math SDK : git clone https://github.com/StakeEngine/math-sdk  puis  MATH_SDK=/chemin/math-sdk
sys.path.insert(0, os.environ.get('MATH_SDK', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'math-sdk')))
from utils.rgs_verification import verify_lookup_format, verify_books_and_payout_mults, compare_payout_values, get_lut_statistics
pub = sys.argv[1]
idx = json.load(open(os.path.join(pub, 'index.json')))
rtps = []
for m in idx['modes']:
    dist, lut_ints, wr, mn, mx = verify_lookup_format(os.path.join(pub, m['weights']))
    book_ints, nev = verify_books_and_payout_mults(os.path.join(pub, m['events']))
    compare_payout_values(book_ints, lut_ints)
    S = get_lut_statistics(m['name'], dist, m['cost'], lut_ints, wr, mn, mx, nev)
    rtps.append(S.rtp)
    print(f"{m['name']:6s} OK  rtp={S.rtp:.5f}  gain_max={mx/100:.0f}x  frequence_gain={S.non_zero_hr:.4f}  p5k={S.prob5k:.2e}  p10k={S.prob10k:.2e}  etl40b={S.etl40b:.3f}  etl10k={S.etl10k:.3f}  cvar={S.cvar:.1f}")
print('ecart RTP max entre modes:', max(rtps)-min(rtps))
