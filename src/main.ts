import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Vec2 } from './vec2'
import { Vec3 } from './math4'
import { XPBD, Entity, Force } from './pbdx2'

let gravity = -10

let v_screen = Vec2.make(1080, 1920)
const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  let entities: Array<Entity> = [
    Entity.make_box(Vec3.make(500, 200, 0), 10, 50),
    Entity.make_fixed(Vec3.make(540, 1000, 0), 500),
  ]
  

  let xpbd = new XPBD(1, entities)


  loop((dt: number) => {

    xpbd.entities.forEach(e => {
      e.forces.push(
        Force.make(Vec3.make(0, -gravity / e.inverse_mass, 0),
                   Vec3.zero))
    })


    xpbd.simulate(dt/1000)

    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)


    xpbd.entities.forEach(e => {
      g.fr('hsl(0, 60%, 60%)', e.position.x - e.bounding_sphere_radius, e.position.y - e.bounding_sphere_radius, e.bounding_sphere_radius * 2, e.bounding_sphere_radius * 2)
    })


  })
}



app(document.getElementById('app')!)
