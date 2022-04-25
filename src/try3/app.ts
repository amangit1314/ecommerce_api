import express from 'express'
import { ConnectionOptions, createConnection } from 'typeorm'
import config from './ormconfig'


createConnection
    (config as ConnectionOptions).
    then(
        async (connection) => {
            const app = express()

            app.use(express.json)
            app.use(express.urlencoded({ extended: false }))

            const port = 8085
        })