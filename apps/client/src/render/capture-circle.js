// Capture areas span hundreds of world units but only tens of overview pixels.
// Only the host overview uses screen detail. Student boundaries retain world detail.
// All bounds, colors and world stroke widths stay unchanged.
export function captureCircle(g,x,y,radius,detail,fill,stroke,teacher=false){
 if(!teacher)detail=1;
 g.save().scaleTransform(1/detail).circle(x*detail,y*detail,radius*detail).fill(fill);
 if(stroke.width)g.stroke(stroke);
 g.restore();
}
