import fs from 'fs'
import path from 'path'

import server from '#nodes/server.js'
import app from '#nodes/app.js'
import src from '#nodes/src.js'

const baseFolder = 'static'

server(
  app({
    indexFile: './static/html/index.html', 
    static: [
      src(/^\/(html|css|js|image|md|font)/, {
        baseFolder
      })
    ]
  })
)()
