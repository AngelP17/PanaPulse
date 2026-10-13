import os,re,sys; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from variants import V
def rgb(h): h=h.lstrip('#'); return [int(h[i:i+2],16)/255 for i in (0,2,4)]
def parse(c, under):
    if c.startswith('#'): return rgb(c)
    r,g,b,a=[float(x) for x in re.findall(r'[\d.]+',c)]; u=under
    return [r/255*a+u[0]*(1-a), g/255*a+u[1]*(1-a), b/255*a+u[2]*(1-a)]
def L(c): return sum(w*((x/12.92) if x<=0.03928 else ((x+0.055)/1.055)**2.4) for w,x in zip((0.2126,0.7152,0.0722),c))
def cr(a,b): la,lb=sorted([L(a),L(b)],reverse=True); return (la+0.05)/(lb+0.05)
for k,(name,_,l,d) in V.items():
    for mode,p in (('light',l),('dark',d)):
        worst=None
        for stop in p['sky']:
            bg=parse(p['card'],rgb(stop))
            for key in ('ink','muted','accent','official','stale','community','alert'):
                c=parse(p[key],bg); r=cr(c,bg)
                if worst is None or r<worst[0]: worst=(r,key,stop)
        mark=cr(rgb(p['accentInk']),rgb(p['accent']))
        print(k,mode,'worst text on card %.2f (%s over %s)'%worst,'| mark %.2f'%mark)
