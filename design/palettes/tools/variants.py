# Three token-only palette variations on the existing Home layout. Status colors shared across variants.
ST_L = dict(official='#176A35', officialInk='#FFFFFF', stale='#7D5A00', community='#0D6B64', alert='#A8322A')
ST_D = dict(official='#7BD88F', officialInk='#0B2A14', stale='#F2C14E', community='#5FD4C4', alert='#FF8591')
def light(sky, accent, accentInk='#F5F2EF'):
    return dict(sky=sky, card='rgba(250,248,246,0.68)', tile='rgba(250,248,246,0.70)', tileStrong='rgba(252,250,248,0.88)',
        line='rgba(32,35,51,0.09)', ink='#202333', muted='rgba(32,35,51,0.66)', faint='rgba(32,35,51,0.46)',
        nav='rgba(247,245,243,0.95)', navActive='#202333', navActiveInk='#F5F2EF', bubbleUser='#202333', bubbleUserInk='#F5F2EF',
        accent=accent, accentInk=accentInk, unknown='rgba(32,35,51,0.58)', **ST_L)
def dark(sky, card, tile, tileStrong, nav, accent='#E4A18F', accentInk='#2A1813'):
    return dict(sky=sky, card=card, tile=tile, tileStrong=tileStrong, line='rgba(245,242,239,0.08)', ink='#F5F2EF',
        muted='rgba(245,242,239,0.68)', faint='rgba(245,242,239,0.46)', nav=nav, navActive='#F5F2EF', navActiveInk='#202333',
        bubbleUser='#F5F2EF', bubbleUserInk='#202333', accent=accent, accentInk=accentInk, unknown='rgba(245,242,239,0.56)', **ST_D)
V = {
 'p1': ('Crepúsculo', 'Balanced: periwinkle sky into a coral horizon. Cool storm/periwinkle accent; coral stays in the horizon and the mark.',
   light(['#DEE1F0','#C5CAE4','#DACCD5','#F1D5C9'], '#4C5775'),
   dark(['#202333','#2E3550','#515D7C','#C08B7E'], 'rgba(30,33,49,0.84)', 'rgba(120,130,170,0.28)', 'rgba(140,150,190,0.42)', 'rgba(24,26,40,0.96)', accent='#AEB6E6', accentInk='#202333')),
 'p2': ('Porcelana', 'Warm-led: porcelain light with a soft coral glow; ink-to-ember dusk at night. Deep coral accent.',
   light(['#F5F2EF','#EEE6E2','#EAD3CA','#E8B7A8'], '#9A4836'),
   dark(['#202333','#2A2B3F','#463F55','#B67F71'], 'rgba(32,32,47,0.84)', 'rgba(150,130,150,0.24)', 'rgba(170,150,165,0.38)', 'rgba(26,26,39,0.96)')),
 'p3': ('Tinta', 'Cool-led and least Hark-like: ink and periwinkle atmosphere, coral reserved for the mark and accents.',
   light(['#E6E8F2','#CED3E8','#B6BDDD','#DAD8E6'], '#9A4836'),
   dark(['#181A27','#202333','#2E3653','#4F5A7A'], 'rgba(26,28,42,0.82)', 'rgba(110,120,165,0.26)', 'rgba(130,140,185,0.40)', 'rgba(20,22,34,0.96)')),
}
