// Capture areas span hundreds of world units but only tens of overview pixels.
// Only tessellation scale changes; all bounds, colors and world stroke widths stay.
export function captureCircle(g,x,y,radius,detail,fill,stroke){
 g.save().scaleTransform(1/detail).circle(x*detail,y*detail,radius*detail).fill(fill);
 if(stroke.width)g.stroke(stroke);
 g.restore();
}
