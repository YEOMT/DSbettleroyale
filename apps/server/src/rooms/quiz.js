import {randomUUID} from 'node:crypto';
export function initializeQuiz(room,member){
 const r=room.rules,rnd=r.brHashRandom(room.matchId+'|quiz|'+member.id);
 member.quiz={score:0,index:0,attempt:0,lockUntil:0,rnd,questions:r.brShuffle(room.quizBank.map(r.brPrepareQuizQuestion).filter(Boolean),rnd)};
 nextQuestion(room,member);
}
export function nextQuestion(room,member){
 const q=member.quiz;if(q.index>=q.questions.length){q.questions=room.rules.brShuffle(q.questions,q.rnd);q.index=0;}
 const source=q.questions[q.index++];
 q.current={id:randomUUID(),attemptId:randomUUID(),prompt:source.prompt,answers:room.rules.brShuffle(source.answers,q.rnd).map(a=>({id:randomUUID(),text:a.text,correct:a.isCorrect}))};
 q.attempt++;
}
export function publicQuiz(member,now){const q=member.quiz;if(!q)return null;return {score:q.score,attempt:q.attempt,lockRemainingMs:Math.max(0,q.lockUntil-now),question:q.current?{id:q.current.id,attemptId:q.current.attemptId,prompt:q.current.prompt,answers:q.current.answers.map(({id,text})=>({id,text}))}:null};}
export function answer(room,member,p,now){
 const q=member.quiz;if(!q||now>=room.quizEndsAt)throw Error('QUIZ_CLOSED');
 if(now<q.lockUntil)throw Error('QUIZ_LOCKED');
 if(q.current.id!==p.questionId||q.current.attemptId!==p.attemptId)throw Error('STALE_QUESTION');
 const choice=q.current.answers.find(a=>a.id===p.answerId);if(!choice)throw Error('INVALID_ANSWER');
 if(choice.correct){q.score++;q.lockUntil=now+320;nextQuestion(room,member);}else q.lockUntil=now+1500;
 return {accepted:true,correct:choice.correct,score:q.score,lockMs:choice.correct?320:1500};
}
