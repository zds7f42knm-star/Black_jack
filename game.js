// Simple client-side Blackjack for mobile (no server)
// Note: This is a light port of the Python logic to JS for playing on iPhone.

class Deck {
  constructor(num_decks=6){
    this.num_decks = num_decks;
    this.cards = [];
    this._build();
  }
  _build(){
    const suits=['♠','♥','♦','♣'];
    const ranks=['A',...Array.from({length:9},(_,i)=>String(i+2)), 'J','Q','K'];
    this.cards = [];
    for(let d=0; d<this.num_decks; d++){
      for(let s of suits) for(let r of ranks) this.cards.push([r,s]);
    }
    this.shuffle();
  }
  shuffle(){
    for(let i=this.cards.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [this.cards[i],this.cards[j]]=[this.cards[j],this.cards[i]];
    }
  }
  deal(n=1){
    const out=[];
    for(let i=0;i<n;i++){
      if(this.cards.length===0) this._build();
      out.push(this.cards.pop());
    }
    return out;
  }
}

class Hand{
  constructor(){this.cards=[]}
  add(card){this.cards.push(card)}
  values(){
    const value_map={}; for(let i=2;i<=10;i++) value_map[String(i)]=i; value_map['J']=10;value_map['Q']=10;value_map['K']=10;value_map['A']=1;
    let total=0; let aces=0;
    for(let [r,_] of this.cards){ total+=value_map[r]; if(r==='A') aces++; }
    let best=total;
    for(let i=0;i<aces;i++) if(best+10<=21) best+=10;
    return best;
  }
  is_blackjack(){return this.cards.length===2 && this.values()===21}
  is_bust(){return this.values()>21}
}

class Game{
  constructor(){this.deck=new Deck(); this.player=new Hand(); this.dealer=new Hand(); this.balance=1000; this.bet=0; this.initial_bet=0; this.in_round=false; this.stats={wins:0,losses:0,pushes:0,blackjacks:0,surrenders:0,rounds:0}} 
  new_round(bet){
    if(bet<=0) throw 'Mise doit être positive';
    if(bet>this.balance) throw 'Mise supérieure au solde';
    this.bet=bet; this.initial_bet=bet; this.balance-=bet; this.player=new Hand(); this.dealer=new Hand(); this.in_round=true; this.stats.rounds++;
    const cards=this.deck.deal(4);
    this.player.add(cards[0]); this.dealer.add(cards[1]); this.player.add(cards[2]); this.dealer.add(cards[3]);
  }
  player_hit(){ if(!this.in_round) throw 'Aucune partie en cours'; this.player.add(this.deck.deal(1)[0]); if(this.player.is_bust()) return this._resolve_round(); return null }
  player_stand(){ if(!this.in_round) throw 'Aucune partie en cours'; this._dealer_play(); return this._resolve_round() }
  _dealer_play(){ while(this.dealer.values()<17) this.dealer.add(this.deck.deal(1)[0]) }
  double_down(){ if(!this.in_round) throw 'Aucune partie en cours'; if(this.player.cards.length!==2) throw 'Double down seulement après la distribution initiale'; if(this.balance<this.initial_bet) throw 'Solde insuffisant pour doubler'; this.balance-=this.initial_bet; this.bet+=this.initial_bet; this.player.add(this.deck.deal(1)[0]); if(!this.player.is_bust()) this._dealer_play(); return this._resolve_round() }
  surrender(){ if(!this.in_round) throw 'Aucune partie en cours'; if(this.player.cards.length!==2) throw 'Surrender seulement après la distribution initiale'; const refund=Math.floor(this.bet*0.5); this.balance+=refund; this.in_round=false; this.stats.surrenders++; return ['surrender',this.player.values(),this.dealer.values()] }
  _resolve_round(){ const pv=this.player.values(); const dv=this.dealer.values(); let result=''; if(this.player.is_bust()) result='lose'; else if(this.player.is_blackjack() && !this.dealer.is_blackjack()) result='blackjack'; else if(this.dealer.is_bust()) result='win'; else if(pv>dv) result='win'; else if(pv<dv) result='lose'; else result='push'; if(result==='blackjack'){ this.balance+=Math.floor(this.bet*2.5); this.stats.blackjacks++ } else if(result==='win'){ this.balance+=Math.floor(this.bet*2); this.stats.wins++ } else if(result==='lose'){ this.stats.losses++ } else if(result==='push'){ this.balance+=Math.floor(this.bet); this.stats.pushes++ } this.in_round=false; return [result,pv,dv] }
}

// UI wiring
const game=new Game();
const balanceEl=document.getElementById('balance');
const dealerCanvas=document.getElementById('dealerCanvas');
const playerCanvas=document.getElementById('playerCanvas');
const tableCanvas=document.getElementById('tableCanvas');
const dealerVal=document.getElementById('dealerVal');
const playerVal=document.getElementById('playerVal');
const betInput=document.getElementById('betInput');
const dealBtn=document.getElementById('dealBtn');
const hitBtn=document.getElementById('hitBtn');
const standBtn=document.getElementById('standBtn');
const doubleBtn=document.getElementById('doubleBtn');
const surrenderBtn=document.getElementById('surrenderBtn');
const msg=document.getElementById('msg');

function drawCard(ctx,x,y,card,faceDown=false){
  const w=54,h=80; ctx.fillStyle=faceDown? '#1e3a8a':'#fff'; ctx.strokeStyle='#000'; ctx.lineWidth=2; roundRect(ctx,x,y,w,h,6,true,true);
  if(faceDown){ ctx.strokeStyle='#60a5fa'; for(let i=0;i<5;i++) ctx.moveTo && ctx.beginPath(), ctx.moveTo(x+6,y+8+i*12), ctx.lineTo(x+w-6,y+8+i*12), ctx.stroke(); return }
  if(card){ const [r,s]=card; const color=(s==='♥'||s==='♦')?'red':'black'; ctx.fillStyle=color; ctx.font='14px serif'; ctx.fillText(r,x+6,y+18); ctx.font='20px serif'; ctx.fillText(s,x+w-12,y+h-12) }
}
function roundRect(ctx,x,y,w,h,r,fill,stroke){ if(typeof r==='undefined') r=5; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill){ ctx.fillStyle=ctx.fillStyle||'#fff'; ctx.fill() } if(stroke) ctx.stroke() }

function updateUI(hideDealerFirst=true){
  // clear
  dealerCanvas.getContext('2d').clearRect(0,0,dealerCanvas.width,dealerCanvas.height);
  playerCanvas.getContext('2d').clearRect(0,0,playerCanvas.width,playerCanvas.height);
  tableCanvas.getContext('2d').clearRect(0,0,tableCanvas.width,tableCanvas.height);
  // table title
  const tctx=tableCanvas.getContext('2d'); tctx.fillStyle='white'; tctx.font='18px serif'; tctx.fillText('BlackJack',tableCanvas.width/2-40,24);
  // dealer
  const dctx=dealerCanvas.getContext('2d'); const pctx=playerCanvas.getContext('2d'); let sx=10; const dx=70;
  game.dealer.cards.forEach((card,i)=>{ const fd=(hideDealerFirst && game.in_round && i===1); drawCard(dctx,sx+i*dx,6, fd?null:card,fd) });
  dealerVal.textContent = (hideDealerFirst && game.in_round)? 'Valeur: ??' : 'Valeur: '+(game.dealer.cards.length?game.dealer.values():'--');
  game.player.cards.forEach((card,i)=>{ drawCard(pctx,sx+i*dx,6,card,false) });
  playerVal.textContent = game.player.cards.length? 'Valeur: '+game.player.values() : 'Valeur: --';
  balanceEl.textContent = game.balance;
}

// buttons
for(const c of document.querySelectorAll('.chip')) c.addEventListener('click', e=>{ betInput.value=e.target.dataset.value })

dealBtn.addEventListener('click', ()=>{
  try{
    game.new_round(parseInt(betInput.value,10)||10);
  }catch(e){ alert(e); return }
  msg.textContent='Partie en cours...'; dealBtn.disabled=true; hitBtn.disabled=false; standBtn.disabled=false; doubleBtn.disabled=false; surrenderBtn.disabled=false; updateUI(true);
  if(game.player.is_blackjack()||game.dealer.is_blackjack()){ game._dealer_play(); const [r,p,d]=game._resolve_round(); afterRound(r) }
})

hitBtn.addEventListener('click', ()=>{ try{ const res=game.player_hit(); updateUI(true); if(res){ const [r,p,d]=res; afterRound(r) } }catch(e){ alert(e) } })
standBtn.addEventListener('click', ()=>{ try{ const res=game.player_stand(); updateUI(false); if(res){ const [r,p,d]=res; afterRound(r) } }catch(e){ alert(e) } })
doubleBtn.addEventListener('click', ()=>{ try{ const res=game.double_down(); updateUI(false); if(res){ const [r,p,d]=res; afterRound(r) } }catch(e){ alert(e) } })
surrenderBtn.addEventListener('click', ()=>{ try{ const res=game.surrender(); updateUI(false); const [r,p,d]=res; afterRound(r) }catch(e){ alert(e) } })

function afterRound(result){ if(result==='blackjack') msg.textContent='Blackjack! Vous gagnez 3:2'; else if(result==='win') msg.textContent='Vous gagnez !'; else if(result==='lose') msg.textContent='Vous perdez...'; else if(result==='push') msg.textContent='Égalité (push)'; else if(result==='surrender') msg.textContent='Surrender : moitié remboursée'; dealBtn.disabled=false; hitBtn.disabled=true; standBtn.disabled=true; doubleBtn.disabled=true; surrenderBtn.disabled=true; updateUI(false) }

// initial render
updateUI(false);
