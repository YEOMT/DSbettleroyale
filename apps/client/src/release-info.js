import {fingerprint} from '../../../packages/protocol/src/index.js';
export function releaseInfo(net){
 const panel=document.createElement('details');panel.className='ws-debug';panel.id='release-info';
 const title=document.createElement('summary'),body=document.createElement('div');
 const env=import.meta.env.VITE_RELEASE_ENV||'development';title.textContent=(env==='staging'?'테스트 · ':'')+'v33.2 · 버전/연결';panel.append(title,body);document.body.append(panel);
 let server='—',connected=false;const paint=()=>{body.textContent=env+' · client '+fingerprint.buildId.slice(0,12)+' · server '+server+' · '+(connected?'연결됨':'연결 대기');};
 net.addEventListener('welcome',e=>{server=(e.detail.buildId||e.detail.fingerprint?.buildId||'—').slice(0,12);paint();});
 net.addEventListener('status',e=>{connected=e.detail.connected;paint();});paint();
}
