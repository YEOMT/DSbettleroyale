export class Samples{
 constructor(size=4096){this.values=new Float64Array(size);this.count=0;this.total=0;this.max=0;}
 add(value){if(!Number.isFinite(value))return;this.values[this.count%this.values.length]=value;this.count++;this.total+=value;this.max=Math.max(this.max,value);}
 report(){const list=Array.from(this.values.subarray(0,Math.min(this.count,this.values.length))).sort((a,b)=>a-b);const q=p=>list[Math.floor((list.length-1)*p)]||0;return {count:this.count,mean:this.count?this.total/this.count:0,p95:q(.95),p99:q(.99),max:this.max};}
}
export class Metrics{
 constructor(){this.stepCpu=new Samples();this.snapshotCpu=new Samples();this.snapshotGap=new Samples();this.inputApply=new Samples();this.sentBytes=0;this.rejected=0;this.duplicates=0;this.reconnects=0;this.closed=0;this.bufferHighWatermark=0;this.replacedSnapshots=0;this.overloads=0;this.started=performance.now();}
 report(manager){return {uptimeMs:performance.now()-this.started,rooms:manager.rooms.size,activeBattles:manager.activeBattles(),stepCpu:this.stepCpu.report(),snapshotCpu:this.snapshotCpu.report(),snapshotGap:this.snapshotGap.report(),inputApply:this.inputApply.report(),sentBytes:this.sentBytes,rejected:this.rejected,duplicates:this.duplicates,reconnects:this.reconnects,closed:this.closed,bufferHighWatermark:this.bufferHighWatermark,replacedSnapshots:this.replacedSnapshots,overloads:this.overloads,memory:process.memoryUsage()};}
}
