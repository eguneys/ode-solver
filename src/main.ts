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
  radius: number,
  pre_solve_vel: Vec2,
  restitution: number
}

export type Contact = [Ball, Ball]

let contacts: Array<Contact> = []

let ls: Array<Ball> = []

let v_screen = Vec2.make(1080, 1920)

const app = (element: HTMLElement) => {


  ls = []  

  let g = Canvas.make(1080, 1920, element)

  let elapsed = 0
  loop((dt: number) => {
    elapsed += dt

    if (elapsed % 200 < 20) {
      let velocity = Vec2.make(Math.random() - 0.5, Math.random() - 0.5).scale(100)
      let position = Vec2.make(Math.random() - 0.5, Math.random() - 0.5).half.add(Vec2.make(500, 100))
      ls.push({
        radius: 10,
        velocity,
        position,
        prev_position: position.sub(velocity.scale(1/60)),
        pre_solve_vel: Vec2.zero,
        restitution: 0.3
      })
    }
    if (ls.length > 30) {
      ls.shift()
    }

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

    let gravity = Vec2.up.scale(-400)

    l.prev_position = l.position

    l.velocity = l.velocity.add(gravity.scale(dts))
    l.position = l.position.add(l.velocity.scale(dts))
    l.pre_solve_vel = l.velocity
  })

  contacts = []
  pairs(ls, (a, b) => {
    if (a === b) { return }
    let ab = b.position.sub(a.position)
    let r_ab = a.radius + b.radius
    if (ab.length < r_ab) {
      contacts.push([a, b])
      let penetration = r_ab - ab.length
      let n = ab.normalize || Vec2.zero
      a.position.sub_in(n.scale(penetration * 0.5))
      b.position.add_in(n.scale(penetration * 0.5))
    }
  })

  ls.forEach(l => {

    let { position, prev_position, velocity } = l
    l.velocity = position.sub(prev_position).scale(1/dts)
  })


  contacts.forEach(([a, b]) => {
    let n = b.position.sub(a.position).normalize || Vec2.zero

    let pre_solve_relative_vel = a.pre_solve_vel.sub(b.pre_solve_vel)
    let pre_solve_normal_vel = pre_solve_relative_vel.dot(n)

    let relative_vel = a.velocity.sub(b.velocity)
    let normal_vel = relative_vel.dot(n)

    let restitution = (a.restitution + b.restitution) / 2

    let w_a = 1 / a.radius
    let w_b = 1/ b.radius
    let w_sum = w_a + w_b

    a.velocity.add_in(n.scale((-normal_vel - restitution * pre_solve_normal_vel) * w_a / w_sum))
    b.velocity.sub_in(n.scale((-normal_vel - restitution * pre_solve_normal_vel) * w_b / w_sum))


  })
}

app(document.getElementById('app')!)
