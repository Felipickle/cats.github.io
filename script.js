// Retro Digital Pet
const SAVE_KEY = 'retro-pet-v1'

// DOM
const petSprite = document.getElementById('petSprite')
const petNameEl = document.getElementById('petName')
const tameLabel = document.getElementById('tameLabel')
const hungerEl = document.getElementById('hunger')
const happinessEl = document.getElementById('happiness')
const energyEl = document.getElementById('energy')
const cleanEl = document.getElementById('cleanliness')
const tameEl = document.getElementById('tame')
const logEl = document.getElementById('log')
const coinsEl = document.getElementById('coins')

const feedBtn = document.getElementById('feedBtn')
const playBtn = document.getElementById('playBtn')
const sleepBtn = document.getElementById('sleepBtn')
const cleanBtn = document.getElementById('cleanBtn')
const petBtn = document.getElementById('petBtn')
const shopItemsEl = document.getElementById('shopItems')
const saveBtn = document.getElementById('saveBtn')
const resetBtn = document.getElementById('resetBtn')

// Game state
let state = {
  name: 'Wildling',
  tamed: false,
  tame: 0, // 0-100
  hunger: 80, // 0-100 (higher means less hungry for simplicity)
  happiness: 20,
  energy: 60,
  cleanliness: 70,
  coins: 0,
  shop: {
    autoFeeder: 0
  }
}

const shop = [
  { id:'goodFood', name:'Good Food', desc:'Feed gives +30 hunger & +5 tame', baseCost:20, buy(){ state.coins -= this.cost(); state.hunger = Math.min(100, state.hunger+30); state.tame += 5 } },
  { id:'toy', name:'Toy', desc:'Play gives extra happiness +15', baseCost:40, buy(){ state.coins -= this.cost(); state.happiness = Math.min(100, state.happiness+15) } },
  { id:'collar', name:'Fancy Collar', desc:'Cosmetic: shows you tamed', baseCost:120, buy(){ state.coins -= this.cost(); state.tamed = true; state.tame = Math.max(state.tame, 60) } },
  { id:'autoFeeder', name:'Auto-Feeder', desc:'Automatically feeds slowly', baseCost:300, buy(){ state.coins -= this.cost(); state.shop.autoFeeder++ } }
]

shop.forEach(item => { item.owned = 0; item.cost = ()=> Math.floor(item.baseCost * Math.pow(1.6, item.owned)) })

function clamp(v, a=0, b=100){ return Math.max(a, Math.min(b, v)) }

function log(msg){
  const t = document.createElement('div')
  t.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`
  logEl.prepend(t)
}

// actions
feedBtn.addEventListener('click', ()=>{
  const hungerGain = 18 + (shop.find(s=>s.id==='goodFood').owned?12:0)
  state.hunger = clamp(state.hunger + hungerGain)
  state.tame = clamp(state.tame + 3)
  log(`You fed ${state.name}. Hunger +${hungerGain}, Tame +3`)
  tickAfterAction()
})

playBtn.addEventListener('click', ()=>{
  const happyGain = 10 + (shop.find(s=>s.id==='toy').owned?8:0)
  state.happiness = clamp(state.happiness + happyGain)
  state.energy = clamp(state.energy - 12)
  state.coins += 5
  state.tame = clamp(state.tame + 2)
  log(`You played with ${state.name}. Happiness +${happyGain}, Coins +5`)
  tickAfterAction()
})

sleepBtn.addEventListener('click', ()=>{
  log(`${state.name} sleeps... Energy restoring.`)
  // small simulation: restore energy over 4s
  let ticks = 4; const iv = setInterval(()=>{
    state.energy = clamp(state.energy+12)
    ticks--
    render()
    if (ticks<=0) clearInterval(iv)
  }, 900)
  state.tame = clamp(state.tame + 1)
  tickAfterAction()
})

cleanBtn.addEventListener('click', ()=>{
  state.cleanliness = clamp(state.cleanliness + 25)
  state.tame = clamp(state.tame + 2)
  log(`You cleaned ${state.name}. Cleanliness +25`)
  tickAfterAction()
})

petBtn.addEventListener('click', ()=>{
  state.happiness = clamp(state.happiness + 6)
  state.tame = clamp(state.tame + 1)
  state.coins += 1
  log(`You pet ${state.name}. Happiness +6, Coins +1`)
  tickAfterAction()
})

function tickAfterAction(){
  // small time passage after action
  state.hunger = clamp(state.hunger - 6)
  state.cleanliness = clamp(state.cleanliness - 3)
  render()
  save()
}

// passive tick every 6s: hunger drains, coins from shop or playing
setInterval(()=>{
  state.hunger = clamp(state.hunger - 4)
  state.happiness = clamp(state.happiness - 1)
  // auto-feeder
  const af = shop.find(s=>s.id==='autoFeeder')
  if (af && af.owned > 0){
    state.hunger = clamp(state.hunger + af.owned * 4)
    log('Auto-Feeder provided food.')
  }
  // if tamed enough, small passive coin income
  if (state.tame >= 50) state.coins += 2
  render()
  save()
}, 6000)

// shop rendering
function renderShop(){
  shopItemsEl.innerHTML = ''
  shop.forEach(item => {
    const div = document.createElement('div')
    div.className = 'item'
    const meta = document.createElement('div')
    meta.className = 'meta'
    meta.innerHTML = `<div><strong>${item.name}</strong></div><div style="opacity:.9;font-size:12px">${item.desc}</div>`
    const right = document.createElement('div')
    right.style.display='flex'; right.style.flexDirection='column'; right.style.alignItems='flex-end'
    const cost = document.createElement('div')
    cost.textContent = format(item.cost())
    cost.style.fontSize='12px'
    const btn = document.createElement('button')
    btn.textContent = 'BUY'
    btn.disabled = state.coins < item.cost()
    btn.onclick = ()=>{
      if (state.coins >= item.cost()){
        state.coins -= item.cost()
        item.owned = (item.owned||0) + 1
        log(`Bought ${item.name}`)
        render()
        save()
      }
    }
    right.appendChild(cost)
    right.appendChild(btn)
    div.appendChild(meta)
    div.appendChild(right)
    shopItemsEl.appendChild(div)
  })
}

function format(n){ return n.toLocaleString() }

function render(){
  petNameEl.textContent = state.name
  hungerEl.textContent = Math.round(state.hunger)
  happinessEl.textContent = Math.round(state.happiness)
  energyEl.textContent = Math.round(state.energy)
  cleanEl.textContent = Math.round(state.cleanliness)
  tameEl.textContent = Math.round(state.tame)
  coinsEl.textContent = format(Math.floor(state.coins))
  tameLabel.textContent = state.tame >= 60 || state.tamed ? '(Tamed)' : '(Wild)'

  // change sprite color based on happiness/tame
  const hue = Math.floor(200 - state.happiness)
  petSprite.style.boxShadow = `0 6px 30px rgba(0,0,0,0.6), 0 0 18px hsla(${hue},90%,60%,0.18)`
  renderShop()
}

// save/load
function save(){
  localStorage.setItem(SAVE_KEY, JSON.stringify(state))
}
function load(){
  const raw = localStorage.getItem(SAVE_KEY)
  if (raw){
    try{ const s = JSON.parse(raw); state = Object.assign(state, s) }catch(e){ console.warn('load fail', e) }
  }
}

saveBtn.addEventListener('click', ()=>{ save(); flash('Saved') })
resetBtn.addEventListener('click', ()=>{ if (confirm('Reset pet and progress?')){ localStorage.removeItem(SAVE_KEY); state = { name:'Wildling', tamed:false, tame:0, hunger:80, happiness:20, energy:60, cleanliness:70, coins:0, shop:{autoFeeder:0} }; shop.forEach(i=>i.owned=0); render(); flash('Reset') } })

function flash(text){
  const el = document.createElement('div')
  el.textContent = text
  el.style.position='fixed'; el.style.right='20px'; el.style.bottom='20px'
  el.style.padding='10px 14px'; el.style.background='rgba(0,0,0,0.6)'; el.style.borderRadius='8px'; el.style.color='#e6f7ff'
  document.body.appendChild(el)
  setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity=0 },900)
  setTimeout(()=>el.remove(),1400)
}

// initial
load(); render();
// autosave
setInterval(save, 10000)
