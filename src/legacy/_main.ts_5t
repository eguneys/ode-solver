import { Canvas, loop } from './debug'
import { Vec2 } from './vec2'

const pairs = <A>(ls: Array<A>, fn: (_: A, __: A) => void) => {
  for (let i = 0; i < ls.length; i++) {
    for (let j = i + 1; j < ls.length; j++) {
      fn(ls[i], ls[j])
    }
  }
}

export type Ball = {
  velocity: Vec2,
  position: Vec2,
  prev_position: Vec2,
  radius: number
}

let ls: Array<Ball> = []

let v_screen = Vec2.make(1080, 1920)

const app = (element: HTMLElement) => {


  ls = [
    {
      position: Vec2.make(200, 200),
      prev_position: Vec2.make(200, 200).sub(Vec2.make(20, 0).scale(1/60)),
      velocity: Vec2.make(20, 0),
      radius: 40
    },
    {
      position: Vec2.make(400, 200),
      prev_position: Vec2.make(400, 200).sub(Vec2.make(-20, 0).scale(1/60)),
      velocity: Vec2.make(-20, 0),
      radius: 20
    }
  ]

  let g = Canvas.make(1080, 1920, element)

  loop((dt: number) => {

    simulate()

    g.clear()
    g.fr('hsl(0, 10%, 30%)', 0, 0, 1080, 1920)


    ls.forEach(l =>
      g.fr('hsl(0, 60%, 40%)', l.position.x - l.radius, l.position.y - l.radius, l.radius * 2, l.radius * 2)
    )
  })

}

function simulate() {

  let dts = 1/60

  ls.forEach(l => {

    let { position, prev_position, velocity } = l

    l.prev_position = position
    l.position = position.add(velocity.scale(dts))

  })

  pairs(ls, (a, b) => {
    if (a === b) { return }
    let ab = b.position.sub(a.position)
    let r_ab = a.radius + b.radius
    if (ab.length < r_ab) {
      throw 3
    }
  })

  ls.forEach(l => {

    let { position, prev_position, velocity } = l
    l.velocity = position.sub(prev_position).scale(1/dts)
  })
}

app(document.getElementById('app')!)
