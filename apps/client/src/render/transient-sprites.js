import {Sprite,Texture} from 'pixi.js';

// Projectile IDs expire quickly; their cached textures do not. Keep a small
// detached reserve instead of allocating/destroying a Sprite for every shot.
// Active sprites are never capped. Reset/context fallback destroys the reserve.
export class TransientSprites {
 constructor(limit=64){this.limit=limit;this.free=[];}
 get size(){return this.free.length;}
 take(texture){
  const sprite=this.free.pop()||new Sprite(texture);
  sprite.texture=texture;sprite.anchor.set(.5);sprite.position.set(0,0);sprite.scale.set(1);sprite.skew.set(0,0);sprite.pivot.set(0,0);sprite.rotation=0;
  sprite.alpha=1;sprite.tint=0xffffff;sprite.blendMode='normal';sprite.visible=true;sprite.renderable=true;
  return sprite;
 }
 release(sprite){
  sprite.removeFromParent();sprite.visible=false;
  if(this.free.length>=this.limit){sprite.destroy();return;}
  // Do not keep a retired projectile's texture alive through the reserve.
  sprite.texture=Texture.EMPTY;this.free.push(sprite);
 }
 clear(){for(const sprite of this.free)sprite.destroy();this.free.length=0;}
}
