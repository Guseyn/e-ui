import fs from 'fs'

import cluster from '#nodes/cluster.js'

process.env.ENV = process.env.ENV || 'local'

const numberOfWorkers = 2
const restartTime = 2
const config = JSON.parse(
  fs.readFileSync(
    `./env/${process.env.ENV}.json`
  )
)

cluster('primary.js', 'worker.js')({
  numberOfWorkers,
  restartTime,
  config
})
