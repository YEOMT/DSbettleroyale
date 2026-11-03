import {releaseInfo} from './release-info.js';
import './ui/overrides.css';
import {Connection} from './net/connection.js';
import {Timeline} from './presentation/timeline.js';
import {Controls} from './input/controls.js';
import {Renderer} from './render/renderer.js';
import {GameAudio} from './audio/audio.js';
import {AppUI} from './ui/app.js';
import {fingerprint} from '../../../packages/protocol/src/index.js';
document.querySelector('meta[name="br-build"]').content=fingerprint.buildId;
const wsUrl=import.meta.env.VITE_PUBLIC_WSS_URL||`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`;
const net=new Connection(wsUrl),timeline=new Timeline(),session={roomMeta:{graphicsPreset:'balanced'},reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
const renderer=new Renderer(document.getElementById('br-student-canvas'),timeline,session),controls=new Controls(net,timeline),audio=new GameAudio(session);
renderer.controls=controls;controls.audio=audio;renderer.paint.brPlaySfx=(...args)=>audio.controller.sfx(...args);
const ui=new AppUI(net,timeline,renderer,controls,audio);
export {net,timeline,renderer,controls,ui,audio};
if(net.token)net.connect().catch(e=>ui.toast(e.message));

releaseInfo(net);
