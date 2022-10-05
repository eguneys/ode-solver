import './style.css'
import { Vec2 } from './vec2'

let Canvas = document.createElement('canvas')
Canvas.width = 1920
Canvas.height = 1080

let Ctx = Canvas.getContext('2d')

document.getElementById('app').appendChild(Canvas)

const draw = vs => {
  
  Ctx.clearRect(0, 0, 1920, 1080)

  Ctx.fillStyle = 'hsl(0, 13%, 33%)'
  Ctx.fillRect(0, 0, 1920, 1080)

  Ctx.strokeStyle = 'hsl(0, 30%, 80%)'
  Ctx.lineWidth = 10

  Ctx.beginPath()
  Ctx.moveTo(10, 540)
  Ctx.lineTo(1900, 540)
  Ctx.closePath()
  Ctx.stroke()
  Ctx.moveTo(10, 10)
  Ctx.lineTo(10, 1070)
  Ctx.closePath()
  Ctx.stroke()

  Ctx.strokeStyle = 'hsl(0, 50%, 50%)'
  Ctx.lineWidth = 4
  vs.forEach(([x, _fx], i) => {
    let y = _fx

    Ctx.beginPath()
    Ctx.arc(cX(x), cY(y), 8, 0, Math.PI * 2)
    Ctx.closePath()
    Ctx.stroke()
  })
}

const cX = x => x + 10
const cY = y => 540 - y

let g = Vec2.make(0, -300)
let v_b = Vec2.make(1000, 100)
let p_b = Vec2.make(540, 100)
let p0_b = p_b.clone

let center = Vec2.make(545, 100)
let radius = 100

let ts = 1/60
function simulate() {

  for (let step = 0; step < 100; step++) {
    let sdt = ts / 100
    v_b.add_in(g.scale(sdt))
    p0_b = p_b.clone
    p_b.add_in(v_b.scale(sdt))


    let dir = p_b.sub(center)
    let { normalize } = dir
    if (normalize) {
      let lambda = radius - dir.length
      p_b.add_in(normalize.scale(lambda))
    }

    v_b = p_b.sub(p0_b).scale(1/sdt)

  }
}

function step() {

  simulate()
  draw([p_b.vs])
  requestAnimationFrame(step)
}
requestAnimationFrame(step)

