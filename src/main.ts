import './style.css'

import { XPBD, Body, Pose } from './pbd'
import { Vec3, Quat } from './math4'

const app = (element: HTMLElement) => {

  
  let bodies: Array<Body> = [
    Body.make(Pose.make(Vec3.zero, Quat.identity))
  ]
  let xpbd = new XPBD(1, bodies, [])


  loop((dt: number) => {
    xpbd.simulate(dt)
    //console.log(bodies[0].pose.p)
  })
}


const loop = (on_update: (_: number) => void) => {
  let _dt = (1/60) * 1000
  let _last_time: number | undefined
  function step(time: number) {
    if(_last_time) {
      _dt = time - _last_time
    }

    on_update(_dt)

    _last_time = time

    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

app(document.getElementById('app')!)
