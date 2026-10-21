# Calm background bed: soft tanpura-like drone + gentle electric-piano arpeggios + pad, 66 bpm.
import numpy as np, wave, sys
SR=44100; DUR=float(sys.argv[1]) if len(sys.argv)>1 else 390.0
N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(22)
L=np.zeros(N); R=np.zeros(N)
def hz(m): return 440*2**((m-69)/12)
# tonic D (50). progression: D  Bm  G  A  (I vi IV V), 4 beats each
bpm=66; beat=60/bpm; bar=4*beat
chords=[[50,57,62,66],[47,54,62,66],[43,55,59,62],[45,52,57,61]]
def note(start,m,dur,amp,pan=0.5,bright=1.0):
    i0=max(0,int(start*SR)); n=int((dur+2.5)*SR)
    if i0>=N: return
    n=min(n,N-i0); tt=np.arange(n)/SR; f=hz(m)
    env=np.minimum(tt/0.008,1)*np.exp(-tt*(1.6+f/900))
    s=(np.sin(2*np.pi*f*tt)+0.35*bright*np.sin(2*np.pi*2*f*tt)*np.exp(-tt*3)+0.12*bright*np.sin(2*np.pi*3*f*tt)*np.exp(-tt*5))
    # soft tine
    s+=0.08*np.sin(2*np.pi*f*7.02*tt)*np.exp(-tt*18)
    s*=env*amp
    L[i0:i0+n]+=s*(1-pan); R[i0:i0+n]+=s*pan
# drone: Pa Sa Sa Sa (A2, D3, D3, D2) plucks every 4.4s, rich harmonics, slow decay
dr=[45+12,50+12,50+12,38+12]; k=0; tm=0.3
while tm<DUR:
    m=dr[k%4]; f=hz(m-12); i0=int(tm*SR); n=min(int(5.5*SR),N-i0); tt=np.arange(n)/SR
    env=np.minimum(tt/0.05,1)*np.exp(-tt*0.55)
    s=sum((0.9/h)*np.sin(2*np.pi*f*h*tt+rng.uniform(0,6))*(1+0.25*np.sin(2*np.pi*(0.3+h*0.07)*tt)) for h in range(1,12))
    s*=env*0.045
    p=0.35+0.3*(k%2)
    L[i0:i0+n]+=s*(1-p); R[i0:i0+n]+=s*p
    tm+=1.1; k+=1
# pad: slow chord swells
for b in range(int(DUR/bar)+1):
    ch=chords[b%4]; st=b*bar; i0=int(st*SR); n=min(int((bar+1.5)*SR),N-i0)
    if n<=0: break
    tt=np.arange(n)/SR; env=np.sin(np.pi*np.clip(tt/(bar+1.5),0,1))**2
    s=sum(np.sin(2*np.pi*hz(m)*tt)+0.5*np.sin(2*np.pi*hz(m)*1.003*tt) for m in ch[1:])
    s*=env*0.012
    L[i0:i0+n]+=s; R[i0:i0+n]+=s
# arpeggio: sparse, 8th notes with rests, up an octave
pat=[0,2,3,1,None,2,3,None]
for b in range(int(DUR/bar)+1):
    ch=chords[b%4]; base=b*bar
    for j,ix in enumerate(pat):
        if ix is None: continue
        if (b%8) in (6,7) and j>3: continue
        note(base+j*beat/2+rng.uniform(-0.01,0.01), ch[ix]+12 if ix else ch[1]+12, beat, 0.055*rng.uniform(.8,1), pan=0.3+0.4*rng.random())
    # bass on the one
    note(base, ch[0]-12+ (12 if ch[0]<45 else 0), bar, 0.06, pan=0.5, bright=0.4)
# simple stereo reverb: multi-tap feedback delays
def verb(x,taps=((0.031,.35),(0.047,.3),(0.071,.25),(0.113,.2),(0.167,.16),(0.241,.12))):
    y=x.copy()
    for d,g in taps:
        k=int(d*SR); z=np.zeros_like(x); z[k:]=x[:-k]*g; y+=z
    for d,g in ((0.37,.28),(0.53,.2)):
        k=int(d*SR)
        for i in range(3): z=np.zeros_like(y); z[k:]=y[:-k]*g; y=y+z*0.5
    return y
L2=verb(L); R2=verb(np.roll(R,int(0.011*SR)))
# fade in/out
fi=np.minimum(t/4.0,1); fo=np.clip((DUR-t)/6.0,0,1)
L2*=fi*fo; R2*=fi*fo
m=max(np.abs(L2).max(),np.abs(R2).max()); L2/=m/0.8; R2/=m/0.8
out=(np.stack([L2,R2],1)*32767).astype(np.int16)
with wave.open('music.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok')
