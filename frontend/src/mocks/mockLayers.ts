import { MarsLayersMap } from '../api/types';

const trekBase = 'https://trek.nasa.gov/tiles/mars/EQ';

export const mockLayers: MarsLayersMap = {
  base_viking: {
    title: 'Viking MDIM 2.1 mosaic (232 m)',
    kind: 'base',
    url: `${trekBase}/Mars_Viking_MDIM21_InvCyl_mosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
  },
  hirise_jezero: {
    title: 'MRO HiRISE Jezero mosaic',
    kind: 'overlay',
    url: `${trekBase}/MRO_HiRISE_Jezero_Mosaic_Controlled/1.0.0/default/default028mm/{z}/{y}/{x}.png`,
  },
  geology: {
    title: 'USGS geologic map (100 m)',
    kind: 'overlay',
    url: `${trekBase}/Mars_USGS_Geologic_Map_Global_100m/1.0.0/default/default028mm/{z}/{y}/{x}.png`,
  },
  mola_color: {
    title: 'MGS MOLA colour shaded relief (463 m)',
    kind: 'elevation',
    url: `${trekBase}/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
  },
  ctx_5m: {
    title: 'MRO CTX global mosaic (5 m)',
    kind: 'base',
    url: `${trekBase}/CTX_beta01_uncontrolled_5m_Caltech/1.0.0/default/default028mm/{z}/{y}/{x}.png`,
  },
};
