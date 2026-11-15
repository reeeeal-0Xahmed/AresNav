#!/usr/bin/env python3
"""Plot real numeric elevations and regional costs; not a satellite basemap."""
import argparse,json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap,BoundaryNorm

p=argparse.ArgumentParser()
p.add_argument('--data',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args()
m=json.loads((a.data/'metadata.json').read_text())
d=np.load(a.data/'terrain_analysis.npz')
b=m['rasterBounds'];extent=[b['west'],b['east'],b['south'],b['north']]
fig,axes=plt.subplots(1,2,figsize=(13,6),constrained_layout=True)
image=axes[0].imshow(d['elevations'],origin='upper',extent=extent,cmap='terrain',aspect='auto')
fig.colorbar(image,ax=axes[0],shrink=.75,label='Elevation in published DEM reference (m)')
axes[0].set_title('Full selected Jezero viewport: elevations')
values=np.zeros(d['grid'].shape,dtype=np.int8)
for i,cost in enumerate([-1,1,2,4,8]):values[d['grid']==cost]=i
cmap=ListedColormap(['#c4453a','#edf1e7','#b6d5a1','#efd381','#c58d52'])
norm=BoundaryNorm(np.arange(-.5,5.5,1),cmap.N)
image=axes[1].imshow(values,origin='upper',extent=extent,cmap=cmap,norm=norm,aspect='auto')
cb=fig.colorbar(image,ax=axes[1],shrink=.75,ticks=range(5));cb.ax.set_yticklabels(['Blocked (-1)','Cost 1','Cost 2','Cost 4','Cost 8'])
axes[1].set_title('Experimental regional traversal cost map')
for ax in axes:
 ax.set_xlabel('East longitude (degrees)');ax.set_ylabel('Planetocentric latitude (degrees)')
 ax.set_xlim(m['requestedBounds']['west'],m['requestedBounds']['east'])
 ax.set_ylim(m['requestedBounds']['south'],m['requestedBounds']['north'])
fig.suptitle(f"{m['width']} x {m['height']} cells | 200 m planning grid | no missing elevations\nRegional planning only: not small-rock or rover-scale hazard detection",fontsize=13)
a.out.parent.mkdir(parents=True,exist_ok=True)
fig.savefig(a.out,dpi=150)
print(a.out)
