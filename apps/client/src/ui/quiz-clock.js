// Displays a server deadline; cannot advance a room phase or grant answers.
export class QuizClock{
 reset(){this.key='';this.deadline=0;}
 accept(room,now=performance.now()){
  if(room.phase!=='QUIZ'){this.reset();return;}
  const key=room.matchId+':'+room.quizEndsAt;
  const remaining=Number.isFinite(room.quizEndsAt)&&Number.isFinite(room.serverTime)?Math.max(0,room.quizEndsAt-room.serverTime):Math.max(0,room.quizRemainingMs);
  const deadline=now+remaining;this.deadline=this.key===key?Math.min(this.deadline,deadline):deadline;this.key=key;this.total=room.config.quizSeconds*1000;
 }
 remaining(now=performance.now()){return Math.max(0,this.deadline-now);}
 draw(host,ring,now=performance.now()){const ms=this.remaining(now),seconds=Math.ceil(ms/1000);host.textContent=seconds+'초';ring.querySelector('span').textContent=seconds;ring.style.setProperty('--br-progress',Math.max(0,Math.min(100,ms/this.total*100))+'%');return ms;}
}
