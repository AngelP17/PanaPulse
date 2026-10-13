import os,sys; H=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,H); from variants import V
NAMES={'p1':'p1-crepusculo','p2':'p2-porcelana','p3':'p3-tinta'}
src=open(os.path.join(H,'../../../src/theme/tokens.ts')).read()
head=src[:src.index('export const palettes')]
order=['sky','card','tile','tileStrong','line','ink','muted','faint','nav','navActive','navActiveInk','bubbleUser','bubbleUserInk','official','officialInk','stale','accent','accentInk','community','alert','unknown']
def block(p):
    out=[]
    for k in order:
        v=p[k]
        out.append(f"    {k}: [{', '.join(repr(x) for x in v)}]," if k=='sky' else f"    {k}: '{v}',")
    return '\n'.join(out).replace('"',"'")
for k,(name,desc,l,d) in V.items():
    body=f"// PREVIEW ONLY ({k} {name}): {desc}\n// Not approved. Token-only swap of the B layout; logo geometry, type, layout and nav unchanged.\n"
    body+="export const palettes: Record<ThemeName, Palette> = {\n  light: {\n"+block(l)+"\n  },\n  dark: {\n"+block(d)+"\n  },\n};\n"
    open(os.path.join(H,'..',NAMES[k]+'.tokens.ts'),'w').write(head+body)
print('ok')
