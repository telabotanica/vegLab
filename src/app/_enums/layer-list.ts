export enum LayerEnum {
  L  = 'l',
  M  = 'm',
  TH = 'th',
  H  = 'h',
  CH = 'ch',
  B  = 'b',
  B_ = 'B',
  A  = 'a',
  A_ = 'A'
}


export const layerList: Array<{ name: string, enum: LayerEnum, description: string }> =
[
  { name: 'l',  enum: LayerEnum.L,  description: 'strate lichénique'},
  { name: 'm',  enum: LayerEnum.M,  description: 'strate bryophytique' },
  { name: 'th', enum: LayerEnum.TH, description: 'strate herbacée (thérophytique)' },
  { name: 'h',  enum: LayerEnum.H,  description: 'strate herbacée' },
  { name: 'ch', enum: LayerEnum.CH, description: 'strate chaméphytique' },
  { name: 'b',  enum: LayerEnum.B,  description: 'strate arbustive basse (1,5 à 4m)' },
  { name: 'B',  enum: LayerEnum.B_, description: 'strate arbustive haute (4 à 8m)' },
  { name: 'a',  enum: LayerEnum.A,  description: 'strate arborescente basse (8 à 16m)' },
  { name: 'A',  enum: LayerEnum.A_, description: 'strate arborescente haute (> 16m)' }
];
