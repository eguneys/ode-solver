import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Rectangle, Vec2 } from './vec2'
import { Vec3 } from './math4'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'

import p2 from 'p2'


let gravity = -10

let v_screen = Vec2.make(1080, 1920)
let v_world = v_screen.scale(1)


let fen2 = `
# ########
  #nno.o.#
  #logglo#
  #logglo#
  ###.####

`

let fen = `
o
`
export type BodyInfo = {
  bounding_box: Rectangle,
  body: p2.Body,
  pos: Vec2,
  char: string,
  color: string
}

let box_shrink_off = 10

const from_fen = (fen: string) => {

  let res: Array<BodyInfo> = []

  let visited: Array<string> = []

  let nb_rows,
  nb_cols
  let ms = new Map()
  fen.split('\n').forEach((lines: string, row: number) => {
    nb_rows = row + 1
    lines.split('').forEach((char: string, col: number) => {
      nb_cols = col + 1
      ms.set(Vec2.make(col, row).key, char)
    })
  })


  for (let [key, char] of ms) {
    if (visited.includes(key)) {
      continue
    }
    let v = Vec2.from_key(key)
    if (char === '#') {

      let box = Rectangle.make(-50, -50, 100, 100)

      let body = new p2.Body({
        position: v.scale(100).add(Vec2.make(100, 100)).vs,
        mass: 0
      })

      body.addShape(new p2.Box({
        width: 100,
        height: 100
      }))

      res.push({
        bounding_box: box,
        body,
        pos: v,
        char,
        color: 'hsl(0, 20%, 50%)'
      })
    } else if (char === 'n') {
      visited.push(...[v.key, v.right.key])

      let box = Rectangle.make(-50, -50, 200, 100).larger(-box_shrink_off)
      let vertices = box.vertices.map(_ => _.vs)
      let body = new p2.Body({
        fixedRotation: true,
        position: v.scale(100).add(Vec2.make(100, 100)).vs,
        angularDamping: 1,
        damping: 0.98,
        mass: 20
      })

      body.addShape(new p2.Convex({ vertices}))
      res.push({
        body,
        pos: v,
        char,
        bounding_box: box,
        color: 'hsl(70, 50%, 50%)'
      })
    } else if (char === 'o') {
      visited.push(...[v.key])

      let box = Rectangle.make(-50, -50, 100, 100).larger(-box_shrink_off)
      let vertices = box.vertices.map(_ => _.vs)
      let body = new p2.Body({
        fixedRotation: true,
        position: v.scale(100).add(Vec2.make(100, 100)).vs,
        angularDamping: 1,
        damping: 0.98,
        mass: 20
      })

      body.addShape(new p2.Convex({ vertices}))
      res.push({
        body,
        pos: v,
        char,
        bounding_box: box,
        color: 'hsl(90, 50%, 50%)'
      })
    } else if (char === 'l') {
      visited.push(...[v.key, v.down.key])

      let box = Rectangle.make(-50, -50, 100, 200).larger(-box_shrink_off)
      let vertices = box.vertices.map(_ => _.vs)
      let body = new p2.Body({
        fixedRotation: true,
        position: v.scale(100).add(Vec2.make(100, 100)).vs,
        angularDamping: 1,
        damping: 0.98,
        mass: 20
      })

      body.addShape(new p2.Convex({ vertices}))
      res.push({
        body,
        pos: v,
        char,
        bounding_box: box,
        color: 'hsl(30, 50%, 50%)'
      })


    } else if (char === 'g') {
      visited.push(...[v.key, v.down.key, v.right.key, v.down.right.key])
      let box = Rectangle.make(-50, -50, 200, 200).larger(-box_shrink_off)
      let vertices = box.vertices.map(_ => _.vs)

      let body = new p2.Body({
        position: v.scale(100).add(Vec2.make(100, 100)).vs,
        fixedRotation: true,
        angularDamping: 1,
        damping: 0.98,
        mass: 20
      })

      body.addShape(new p2.Convex({ vertices}))
      res.push({
        body,
        pos: v,
        char,
        bounding_box: box,
        color: 'hsl(50, 50%, 50%)'
      })
    }
  }

  return res
}


const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  let world = new p2.World({
    gravity: [0, 0]
  })

  let infos = from_fen(fen2.trim())
  let bs = infos.map(_ => _.body)

  let b_mouse = new p2.Body()

  bs.forEach(_ => world.addBody(_))

  let ref = Ref.make(element)

  let _drag_particle: Vec3 | undefined

  let c_mouse: p2.RevoluteConstraint | undefined


  let _v_snap_t = 0
  let _drag_bodies: Array<p2.Body> = []
  let _drag_constraints: Array<p2.Constraint> = []

  make_drag({
    on_drag(e) {
      _drag_bodies.forEach(_ => world.removeBody(_))
      _drag_constraints.forEach(_ => world.removeConstraint(_))
      _drag_bodies = []
      _drag_constraints = []
      if (e.m) {
        let _o = ref.get_normal_at_abs_pos(e.e).mul(v_world)
        let o = ref.get_normal_at_abs_pos(e.m).mul(v_world)

        if (_drag_particle) {
          _drag_particle = Vec3.make(o.x, o.y, 0)
        } else {

          let [_body] = world.hitTest(_o.vs, bs, 1)

          if (_body) {

            let localPoint = p2.vec2.create()
            _body.toLocalFrame(localPoint, _o.vs)
            localPoint = Vec2.make(...localPoint).scale(0.1).vs
            c_mouse = new p2.RevoluteConstraint(b_mouse, _body, {
              localPivotA: _o.vs,
              localPivotB: localPoint,
              maxForce: 4000 * _body.mass
            })
            world.addBody(b_mouse)
            world.addConstraint(c_mouse!)


            _drag_particle = Vec3.make(_o.x, _o.y, 0)
          }
        }
      }
    },
    on_up() {
      world.removeConstraint(c_mouse!)
      world.removeBody(b_mouse)
      _drag_particle = undefined

      _v_snap_t = ticks.thirds
    }
  }, element)

  onScrollHandlers(() => {
    ref.$clear_bounds()
  })


  loop((dt: number) => {

    if (_drag_particle && c_mouse) {
      let [x, y] = _drag_particle.vs
      p2.vec2.copy((c_mouse as any).pivotA, [x, y])
    }

    if (_v_snap_t > 0) {
      _v_snap_t -= dt

      if (_v_snap_t <= 0) {
        infos.forEach(_ => {
          let [x, y] = _.body.interpolatedPosition

          let _x = Math.round(x / 100) * 100
          let _y = Math.round(y / 100) * 100

          let cs_body = new p2.Body({ mass: 0, position: [_x, _y] })
          let cs_constraint = new p2.DistanceConstraint(cs_body, _.body, { 
            distance: 0,
            maxForce: 1000 * _.body.mass
          })
          cs_constraint.setStiffness(10000)

          world.addBody(cs_body)
          world.addConstraint(cs_constraint)

          _drag_bodies.push(cs_body)
          _drag_constraints.push(cs_constraint)

        })
      }
    }

    world.step(1/60, dt/1000, 3)

    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)


    infos.forEach(_ => {

      let { color, body, bounding_box} = _

      let [x, y] = body.interpolatedPosition

      let w = bounding_box.w
      let h = bounding_box.h
      x += bounding_box.x
      y += bounding_box.y
      let v = Vec2.make(x, y).div(v_world).mul(v_screen)
      let s = Vec2.make(w, h).div(v_world).mul(v_screen)

      //g.tr(v.x, v.y, s.x / 2, s.y / 2, body.interpolatedAngle)
      g.fr(color, v.x, v.y, s.x, s.y)

      g.resetTransform()
    })
  })
}



app(document.getElementById('app')!)
