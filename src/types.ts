export interface ImageItem {
  id: string;
  url: string;
  imgElement: HTMLImageElement;
  
  // Transformation (Alt Image)
  altUrl?: string;
  altImgElement?: HTMLImageElement;
  isAltState: boolean;
  autoSwapTime: number; // 0 means disabled
  
  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Animation
  animationType: 'none' | 'shake' | 'spin' | 'bounce' | 'float' | 'moveLeftRight';
  duration: number;
  amplitude: number;
  loop: boolean;
  
  // Shadow
  dropShadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: number;
  
  name: string;
}

export interface AudioItem {
  url: string;
  name: string;
  loop: boolean;
}

export interface ActionButton {
  id: string;
  name: string;
  targetIds: string[];
}

export interface TextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  animationType: 'none' | 'shake' | 'spin' | 'bounce' | 'float' | 'moveLeftRight';
  duration: number;
  amplitude: number;
  loop: boolean;
  dropShadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: number;
  name: string;
}

export interface LightItem {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  blur: number;
  shape: 'circle' | 'star' | 'glow';
  intensity: number;
  animationType: 'none' | 'fade' | 'blink';
  duration: number; // in seconds
  name: string;
}
