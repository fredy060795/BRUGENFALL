# Erzeugt aus den Atlanten nahtlose HD-Farbtexturen (Image Quilting), Normal- und Rauheitskarten.
# Aufruf: python tools/texturen_generieren.py   (benötigt: pip install pillow numpy)
# Eigene Fotos: Atlas-PNG ersetzen (2x2 Kacheln) und das Skript erneut starten.
import numpy as np
from PIL import Image, ImageFilter
import os
SRC=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','public','textures')+os.sep
def tiles(path):
    im=Image.open(SRC+path).convert('RGB');w,h=im.size;hw,hh=w//2,h//2
    return [im.crop(((i%2)*hw,(i//2)*hh,(i%2+1)*hw,(i//2+1)*hh)) for i in range(4)]
def _seam(cost):
    """kürzester Pfad von oben nach unten durch eine Kostenmatrix (H x B) -> Spaltenindex je Zeile"""
    H,B=cost.shape;E=cost.copy();bk=np.zeros((H,B),np.int32)
    for y in range(1,H):
        p=E[y-1];l=np.r_[np.inf,p[:-1]];r=np.r_[p[1:],np.inf];st=np.stack([l,p,r]);a=st.argmin(0);E[y]+=st[a,np.arange(B)];bk[y]=a-1
    path=np.zeros(H,np.int32);path[-1]=E[-1].argmin()
    for y in range(H-1,0,-1):path[y-1]=np.clip(path[y]+bk[y,path[y]],0,B-1)
    return path
def seamless(img,b=0.16):
    """Image Quilting: Ränder entlang der Linie geringster Abweichung mit der versetzten Kopie tauschen."""
    a=np.asarray(img).astype(np.float32);h,w,_=a.shape;sh=np.roll(np.roll(a,h//2,0),w//2,1)
    diff=np.abs(a-sh).sum(-1);bw=int(w*b);bh=int(h*b);m=np.ones((h,w),np.float32)
    pl=_seam(diff[:,:bw]);pr=_seam(diff[:,w-bw:][:,::-1]);pt=_seam(diff[:bh,:].T);pb=_seam(diff[h-bh:,:].T[:,::-1])
    X=np.arange(w)[None,:];Y=np.arange(h)[:,None]
    m*=(X>=pl[:,None]);m*=(X<=w-1-pr[:,None]);m*=(Y>=pt[None,:]);m*=(Y<=h-1-pb[None,:])
    m=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32)[...,None]/255
    return Image.fromarray(np.clip(a*m+sh*(1-m),0,255).astype(np.uint8))
def upscale(img,n=1024):
    im=img.resize((n,n),Image.LANCZOS);return im.filter(ImageFilter.UnsharpMask(radius=1.6,percent=70,threshold=2))
def lum(img):a=np.asarray(img).astype(np.float32)/255;return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
def height_of(img,kind):
    L=lum(img);big=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(24))).astype(np.float32)/255
    hp=L-big                                              # Hochpass: Fugen/Ritzen dunkler -> tiefer
    fine=np.asarray(Image.fromarray(np.clip(hp*2+.5,0,1).__mul__(255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)/255-.5
    return fine*{'stone':2.2,'wood':1.4,'plaster':.9,'thatch':1.8,'redRoof':2.0,'slate':1.8,'shingle':1.8,'floor':1.5,'leather':1.0,'linen':.6,'soil':1.4}.get(kind,1.2)
def normal_map(h,strength=6):
    gy,gx=np.gradient(h);nx=-gx*strength*h.shape[0]/64;ny=gy*strength*h.shape[0]/64;nz=np.ones_like(h)
    l=np.sqrt(nx*nx+ny*ny+nz*nz);n=np.stack([nx/l,ny/l,nz/l],-1)
    return Image.fromarray(((n*.5+.5)*255).astype(np.uint8))
def rough_map(img,h,base):
    r=np.clip(base+(-h)*.35+(1-lum(img))*.08,0,1)          # Ritzen rauer, helle Flächen glatter
    return Image.fromarray((r*255).astype(np.uint8)).convert('RGB')
def atlas(parts,n=1024):
    o=Image.new('RGB',(n*2,n*2))
    for i,p in enumerate(parts):o.paste(p,((i%2)*n,(i//2)*n))
    return o
jobs={'stronghold/masonry-timber-plaster-thatch.png':['stone','wood','plaster','thatch'],'stronghold/roofs-and-floors.png':['redRoof','slate','shingle','floor'],'detail-atlas.png':['plaster','leather','linen','soil']}
RB={'stone':.88,'wood':.82,'plaster':.93,'thatch':.97,'redRoof':.78,'slate':.62,'shingle':.86,'floor':.8,'leather':.6,'linen':.95,'soil':.98}
for path,kinds in jobs.items():
    T=tiles(path);col=[];nor=[];rou=[]
    for t,k in zip(T,kinds):
        s=upscale(seamless(t));h=height_of(s,k);col.append(s);nor.append(normal_map(h));rou.append(rough_map(s,h,RB[k]))
    base=path[:-4]
    atlas(col).save(SRC+base+'-hd.jpg',quality=90);atlas(nor).save(SRC+base+'-normal.jpg',quality=92);atlas(rou).resize((1024,1024)).save(SRC+base+'-rough.jpg',quality=88)
    print('ok',base)
