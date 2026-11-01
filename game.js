const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const livesEl = document.getElementById("lives");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");

const W = canvas.width, H = canvas.height;
let player, enemies, orbs, particles, keys = {}, score = 0, lives = 3;
let running = false, last = 0, spawnTimer = 0, orbTimer = 0, elapsed = 0;
let best = Number(localStorage.getItem("neonSurvivorBest") || 0);
bestEl.textContent = String(best).padStart(4,"0");

const rand = (a,b) => Math.random()*(b-a)+a;
function reset(){
  player={x:W/2,y:H/2,r:12,speed:245,invuln:0};
  enemies=[];orbs=[];particles=[];score=0;lives=3;elapsed=0;spawnTimer=0;orbTimer=0;
  scoreEl.textContent="0000";updateLives();addOrb();
}
function updateLives(){livesEl.textContent="♥ ".repeat(lives).trim() || "—";}
function addOrb(){orbs.push({x:rand(35,W-35),y:rand(35,H-35),r:8,pulse:rand(0,6.28)});}
function spawnEnemy(){
  const side=Math.floor(rand(0,4));let x,y;
  if(side===0){x=rand(0,W);y=-20}else if(side===1){x=W+20;y=rand(0,H)}else if(side===2){x=rand(0,W);y=H+20}else{x=-20;y=rand(0,H)}
  const angle=Math.atan2(player.y-y,player.x-x);
  const speed=rand(75,105)+Math.min(elapsed*1.5,85);
  enemies.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:13,spin:rand(0,6.28)});
}
function burst(x,y,color,count=12){for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),s=rand(35,170);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.25,.65),max:.65,color});}}
function start(){reset();running=true;overlay.classList.add("hidden");last=performance.now();requestAnimationFrame(loop);}
function endGame(){
  running=false;
  if(score>best){best=score;localStorage.setItem("neonSurvivorBest",best);bestEl.textContent=String(best).padStart(4,"0");}
  overlayTitle.textContent="Game over!";
  overlayText.textContent=`You scored ${score} points. ${score>=best?"New personal best!":"Jump back in and beat your score."}`;
  startBtn.innerHTML='PLAY AGAIN <span>↻</span>';
  overlay.classList.remove("hidden");
}
function loop(now){
  if(!running)return;
  const dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();requestAnimationFrame(loop);
}
function update(dt){
  elapsed+=dt;spawnTimer-=dt;orbTimer-=dt;
  let dx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0);
  let dy=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
  const len=Math.hypot(dx,dy)||1;
  player.x=Math.max(player.r,Math.min(W-player.r,player.x+dx/len*player.speed*dt));
  player.y=Math.max(player.r,Math.min(H-player.r,player.y+dy/len*player.speed*dt));
  if(player.invuln>0)player.invuln-=dt;
  if(spawnTimer<=0){spawnEnemy();spawnTimer=Math.max(.34,1.15-elapsed*.012);}
  if(orbTimer<=0&&orbs.length<2){addOrb();orbTimer=5;}
  for(const e of enemies){e.x+=e.vx*dt;e.y+=e.vy*dt;e.spin+=dt*3;}
  enemies=enemies.filter(e=>e.x>-50&&e.x<W+50&&e.y>-50&&e.y<H+50);
  for(let i=orbs.length-1;i>=0;i--){const o=orbs[i];o.pulse+=dt*4;if(Math.hypot(player.x-o.x,player.y-o.y)<player.r+o.r+3){score+=10;scoreEl.textContent=String(score).padStart(4,"0");burst(o.x,o.y,"#4df6e5",15);orbs.splice(i,1);orbTimer=1.2;}}
  for(const e of enemies){if(player.invuln<=0&&Math.hypot(player.x-e.x,player.y-e.y)<player.r+e.r-2){lives--;updateLives();player.invuln=1.25;burst(e.x,e.y,"#ff527f",18);e.x=-999;if(lives<=0){endGame();return;}}}
  enemies=enemies.filter(e=>e.x!==-999);
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;p.life-=dt;}
  particles=particles.filter(p=>p.life>0);
}
function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#080d1b";ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="#1a2542";ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // ambient glow
  const grad=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,420);grad.addColorStop(0,"#24245a22");grad.addColorStop(1,"#080d1b00");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  for(const o of orbs){const r=o.r+Math.sin(o.pulse)*2;ctx.save();ctx.shadowBlur=25;ctx.shadowColor="#4df6e5";ctx.fillStyle="#4df6e5";ctx.beginPath();ctx.arc(o.x,o.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#c8fffb";ctx.lineWidth=2;ctx.stroke();ctx.restore();}
  for(const e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.spin);ctx.shadowBlur=20;ctx.shadowColor="#ff426f";ctx.fillStyle="#ff426f";ctx.beginPath();ctx.moveTo(0,-e.r-3);ctx.lineTo(e.r+3,0);ctx.lineTo(0,e.r+3);ctx.lineTo(-e.r-3,0);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.fillRect(-3,-3,6,6);ctx.restore();}
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  if(player){ctx.save();ctx.translate(player.x,player.y);if(player.invuln>0&&Math.floor(performance.now()/90)%2===0)ctx.globalAlpha=.35;ctx.shadowBlur=28;ctx.shadowColor="#9b78ff";ctx.fillStyle="#9b78ff";ctx.beginPath();ctx.arc(0,0,player.r+2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#f5f2ff";ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d9d1ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,player.r+7,0,Math.PI*2);ctx.stroke();ctx.restore();}
}
startBtn.addEventListener("click",start);
window.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys[e.key]=true;});
window.addEventListener("keyup",e=>keys[e.key]=false);
canvas.addEventListener("pointerdown",e=>{const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;keys.pointer=true;player && (player.target={x,y});});
canvas.addEventListener("pointermove",e=>{if(keys.pointer&&player){const rect=canvas.getBoundingClientRect();player.target={x:(e.clientX-rect.left)*W/rect.width,y:(e.clientY-rect.top)*H/rect.height};}});
canvas.addEventListener("pointerup",()=>keys.pointer=false);
const originalUpdate=update;
update=function(dt){if(player&&player.target){const dx=player.target.x-player.x,dy=player.target.y-player.y,d=Math.hypot(dx,dy);if(d>3){player.x+=dx/d*Math.min(d,player.speed*dt);player.y+=dy/d*Math.min(d,player.speed*dt);}}originalUpdate(dt);};
reset();draw();
