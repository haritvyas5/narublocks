const path = require('path')
const fs = require('fs')
const restify = require('restify')

const storageRoute = {
    init(server, { middlewares, helpers } = {}) {
        const { wrapAction } = helpers
        const publicDir = path.join(__dirname, '../../public')
        const imagesDir = path.join(publicDir, 'images')

        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true })
        }

        // Always use localhost for URL consistency with the frontend CDN config
        const baseUrl = 'http://localhost:4100'

        // 1. Mock Upload Policy
        server.get({
            name: 'local-storage.policy',
            path: '/upload/policy'
        }, wrapAction(async (req, res) => {
            const { filename, folder } = req.query
            // Use folder if provided, otherwise default. 
            // The folder usually comes from VUE_APP_CDN_UPLOAD_PREFIX or component prop.
            const prefix = folder ? `${folder}/` : ''
            const key = `${prefix}${Date.now()}-${filename}`

            return {
                endpoint_url: `${baseUrl}/upload`,
                params: {
                    key: key,
                    bucket: 'local'
                }
            }
        }))

        // 2. Handle Upload — uses formidable directly to avoid
        //    conflicts with the global Stelace body parser middleware
        server.post({
            name: 'local-storage.upload',
            path: '/upload'
        }, (req, res, next) => {
            // Use formidable (bundled with restify) directly
            const IncomingForm = require('formidable').IncomingForm
            const form = new IncomingForm({
                uploadDir: '/tmp',
                keepExtensions: true,
                maxFileSize: 50 * 1024 * 1024
            })

            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error('Upload parse error:', err)
                    res.send(400, { message: 'Failed to parse upload' })
                    return next()
                }

                const file = files && files.file
                const key = fields && fields.key

                if (!file || !key) {
                    res.send(400, { message: 'Missing file or key' })
                    return next()
                }

                const targetPath = path.join(publicDir, key)
                const targetDir = path.dirname(targetPath)

                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true })
                }

                fs.copyFileSync(file.path, targetPath)

                // Clean up the temp file
                try { fs.unlinkSync(file.path) } catch (e) { /* ignore */ }

                res.send(204)
                return next()
            })
        })

        // 3. Serve Assets
        // 3. Serve Assets
        const serveStatic = restify.plugins.serveStatic({
            directory: publicDir,
            appendNext: true
        })

        // Map /assets/* -> /public/*
        server.get({
            path: '/assets/*',
            manualAuth: true
        }, (req, res, next) => {
            console.log(`[local-storage] serving asset: ${req.url} from ${publicDir}`)
            req.url = decodeURIComponent(req.url.replace('/assets/', '/'))
            return serveStatic(req, res, next)
        })

        // Map /upload/* -> /public/*
        server.get({
            path: '/upload/*',
            manualAuth: true
        }, (req, res, next) => {
            // Only serve if it's not the POST /upload route
            if (req.method === 'GET') {
                console.log(`[local-storage] serving upload: ${req.url} from ${publicDir}`)
                req.url = decodeURIComponent(req.url.replace('/upload/', '/'))
                return serveStatic(req, res, next)
            }
            return next()
        })
    },
    start() { },
    stop() { }
}

module.exports = {
    name: 'local-storage',
    version: '0.1.0',
    supportedServerVersions: '>=1.0.0-beta.0',

    routes: {
        storage: storageRoute
    }
}
