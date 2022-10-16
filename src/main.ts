import { Canvas, loop } from './debug'
import { XPBD, Border, BorderBorderConstraint } from './pbd_x'
import { Vec3 } from './math4'
import { Vec2 } from './vec2'


const app = (element: HTMLElement) => {


  let bs = [
    Border._make(
      10,
      Vec3.make(200, 200, 0),
      Vec3.zero,
      100,
      Vec2.unit.normalize!
    ),
    Border._make(
      10,
      Vec3.make(200, 200, 0),
      Vec3.zero,
      100,
      Vec2.left
    )
  ]

  let cs = [
    new BorderBorderConstraint(
      bs[0],
      bs[1],
      0,
      1,
      0)
  ]

  let b = new XPBD(3, bs, cs)

  let g = Canvas.make(1080, 1920, element)

  loop((dt: number) => {


    b.update(dt)

    g.clear()
    g.fr('hsl(0, 20%, 30%)', 0, 0, 1080, 1920)


    bs.forEach(b => {
      g.line('hsl(0, 50%, 50%)', 6, b.l.x1, b.l.y1, b.l.x2, b.l.y2)
    })


  })

}




app(document.getElementById('app')!)
