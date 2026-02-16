import { IncomingMessage, Server, ServerOptions, ServerResponse } from "http";
import { JsonDB } from "../JsonDB";
import { verify as hashVerify } from "argon2";
import { verify as jWTverify, PublicKey, Secret, VerifyOptions } from "jsonwebtoken";

export abstract class Authenticator {
    abstract authenticate(req: IncomingMessage): Promise<false | any>
}

interface BasicUser {
    name: string;
    hashPassword: string;
}

export class JWTAuthenticator extends Authenticator {

    private secret: Secret | PublicKey;
    private options: VerifyOptions;

    constructor(secret: Secret | PublicKey, options: VerifyOptions) {
        super()
        this.secret = secret
        this.options = options
    }

    async authenticate(req: IncomingMessage): Promise<false | any> {
        try {
            if (req.headers.authorization) {
                const splited = req.headers.authorization.split(' ')
                if (splited[0] === "Bearer") {
                    return await jWTverify(splited[1], this.secret, this.options)
                }
            }
            return false
            
        } catch (err) {
            return false
        }
    }

}

export class BasicAuthenticator extends Authenticator {
    
    private users: BasicUser[];

    constructor(allowedUsers: string[]) {
        super()
        this.users = allowedUsers.map(user => {
            const splited = user.split(':')
            return {
                name: splited[0],
                hashPassword: splited[1]
            }
        })
    }

   async authenticate(req: IncomingMessage): Promise<boolean> {
        if (req.headers.authorization) {
            const splited = req.headers.authorization.split(' ')
            if (splited[0] === "Basic") {
                const decoded = Buffer.from(splited[1], 'base64').toString()
                const decodedSplit = decoded.split(':')
                const user = this.users.find(user => user.name === decodedSplit[0]) 
                if (user) {
                    return await hashVerify(user.hashPassword, decodedSplit[1])
                }
            }
        }
        return false
    }
}


export interface CorsConf {
    origin: string;
    allowHeaders?: string;
    exposeHeaders?: string;
    maxAge?: number;
    credentials?: boolean;
    method?: string;
}

export interface ServerConf {
    db: JsonDB
    authenticator: Authenticator
    options?: ServerOptions;
    port? : number,
    cors?: CorsConf
}

export class JsonDBServer {
    private db: JsonDB
    private auth: Authenticator;
    private port: number;
    private server: Server;
    private cors?: CorsConf;

    constructor(conf: ServerConf) {
        this.db = conf.db
        this.auth = conf.authenticator
        this.port = conf.port || 3000
        this.cors = conf.cors
        if (conf.options) {
            this.server = new Server(conf.options, this.reqHandler.bind(this))
        } else {
            this.server = new Server(this.reqHandler.bind(this))
        }
        this.server.listen(this.port)
    }

    private async reqHandler(req: IncomingMessage, res: ServerResponse) {
        try {
            const url = new URL(req.url!, `http://${req.headers.host}`)
            const dataPath = url.pathname
            const authenticated = await this.auth.authenticate(req)
            if (!authenticated) {
                res.statusCode = 401
                res.end('unhautorized')
                res.end()
            } else {
                switch (req.method) {
                    case "GET":
                        res.setHeader('Content-Type', 'application/json')
                        if (await this.db.exists(dataPath)) {
                            res.end(JSON.stringify(await this.db.getData(dataPath)))
                        } else {
                            res.statusCode = 404
                            res.end(`data path not found`)
                        }
                        break;
                    case "POST":
                        let body = '';
                        req.on('data', chunk => {
                            body += chunk.toString();
                        });

                        req.on('end', async () => {
                            try {
                                await this.db.push(url.pathname, JSON.parse(body))
                                res.statusCode = 200
                                res.end()
                            } catch (err) {
                                res.statusCode = 500
                                res.end(`server error ${err.message}`)
                            }
                        });
                        break;
                    case "DELETE":
                        if (await this.db.exists(dataPath)) {
                            await this.db.delete(dataPath)
                            res.end()
                        } else {
                            res.statusCode = 404
                            res.end(`data path not found`)
                        }
                        break;
                    case "OPTIONS":
                        if (this.cors) {
                            res.setHeader('Access-Control-Allow-Origin', this.cors.origin)
                            if (this.cors.allowHeaders) res.setHeader('Access-Control-Allow-Headers', this.cors.allowHeaders)
                            if (this.cors.exposeHeaders) res.setHeader('Access-Control-Expose-Headers', this.cors.exposeHeaders)
                            if (this.cors.method) res.setHeader('Access-Control-Allow-Method', this.cors.method)
                            if (this.cors.maxAge) res.setHeader('Access-Control-Max-Age', this.cors.maxAge)
                            if (this.cors.credentials) res.setHeader('Access-Control-Allow-Credentials', `${this.cors.credentials}`)
                        }   
                        break;
                    default:
                        res.statusCode = 405
                        res.end("method not allowed")
                }
            }
        } catch (err) {
            res.statusCode = 500
            res.end(`server error ${err.message}`)
        }
    }


}