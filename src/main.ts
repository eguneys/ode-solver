import { Canvas, loop } from './debug'
import { XPBD } from './pbd_x'


const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  loop((dt: number) => {

    g.clear()
    g.fr('hsl(0, 20%, 30%)', 0, 0, 1080, 1920)

  })

}




app(document.getElementById('app')!)
