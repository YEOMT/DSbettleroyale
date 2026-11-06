// Keep current server-derived values immediate, without replacing identical DOM.
export function writeText(element,value){const next=String(value??'');if(element.textContent!==next)element.textContent=next;}
export function writeStyle(element,key,value){if(element.style[key]!==value)element.style[key]=value;}
export function writeProperty(element,key,value){if(element.style.getPropertyValue(key)!==value)element.style.setProperty(key,value);}
export function writeAttribute(element,key,value){if(element.getAttribute(key)!==value)element.setAttribute(key,value);}
