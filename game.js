createPoint = (x, y) => ({ x:x , y:y })

class Game {
	Instance = null
	constructor() {}
	static setGameInstance({ height, width, colour }, { wallNum }) {
		this.Instance = new GameInstance({ height, width, colour }, { wallNum })
	}
	static getInstance() {
		if (this.Instance === null) {
			this.Instance = new GameInstance(
				{
					height: window.innerHeight - 20,
					width: window.innerWidth - 20,
					colour: 0,
				},
				{ wallNum: 3 }
			)
		}
		return this.Instance
	}
}

class GameInstance {
	constructor({ height, width, colour }, { wallNum }) {
		const createWalls = (num) => {
			let w = []
			for (let i = 0; i < num; i++) {
				let posA = {
					x1: 400 * Math.random(),
					y1: 400 * Math.random(),
				}
				let posB = {
					x2: 400 * Math.random(),
					y2: 400 * Math.random(),
				}
				let wall = new Wall(posA, posB)
				wall.show()
				w.push(wall)
			}
			return w
		}
		this.Background = new Background(height, width, colour)
		this.Background.show()
		this.Walls = createWalls(wallNum)
		this.Entity = new Entity(0, 0)
		this.Entity.show()
	}
}

class Background {
	constructor(height, width, colour = 0) {
		this.height = height
		this.width = width
		this.colour = colour
	}
	show() {
		createCanvas(this.width, this.height)
		background(this.colour)
	}
}

class Wall {
	constructor({ x1, y1 }, { x2, y2 }) {
		this.a = createPoint(x1, y1)
        this.b = createPoint(x2, y2)
        // y = mx + b
        this.lineEqu = {
            b: y1 - (x1 * ((y2 - y1) / (x2 - x1))),
            m: (y2 - y1) / (x2 - x1)
        }
	}
	show() {
		stroke(255)
		line(this.a.x, this.a.y, this.b.x, this.b.y)
	}
}

class Entity {
	constructor(x, y) {
		this.pos = createPoint(x, y)
		this.rays = []

		for (let deg = 0; deg < 360; deg += 1) {
			this.rays.push(new Ray(deg))
		}
	}
	show() {
		setInterval(() => {
			const redrawBackground = () => {
				let gi = Game.getInstance()
				gi.Background.show()
				gi.Walls.forEach((wall) => {
					wall.show()
				})
			}
			const showAllRays = () => {
				this.rays.forEach((ray) => {
					ray.show()
				})
			}
			const redrawEntity = () => {
				let gi = Game.getInstance()
				stroke(0)
				point(this.pos.x, this.pos.y)
				this.pos.x++
				this.pos.y++
				if (
					this.pos.y === gi.Background.height ||
					this.pos.x === gi.Background.width
				) {
					this.pos.y = 0
					this.pos.x = 0
				}
				stroke(255)
				point(this.pos.x, this.pos.y)
			}

			redrawBackground()
			redrawEntity()
			showAllRays()
		}, 20)
	}
}

class Ray {
	constructor(angle) {
		this.end = createPoint()
		this.radians = angle * (3.14159265359/180)
        this.start = createPoint()
        this.lineEqu = { b: null, slope: null }
	}
	show() {
		let gi = Game.getInstance()
		this.start.x = gi.Entity.pos.x
        this.start.y = gi.Entity.pos.y
        // calculate end point
		this.end = {
			x: Math.floor(gi.Background.width * (this.start.x * Math.sin(this.radians))),
			y: Math.floor(gi.Background.height * (this.start.y * Math.cos(this.radians))),
        }
        // get values for equation of ray line
        // y = mx + b
        this.lineEqu = {
            b: this.start.y - (this.start.x * ((this.end.y - this.start.y) / (this.end.x - this.start.x))),
            m: (this.end.y - this.start.y) / (this.end.x - this.start.x)
        }
        // extend line to end of screen
        if ((this.start.y - this.end.y) < 0) {
            // y intercept = background width
            let newX = (gi.Background.width - this.lineEqu.b) / this.lineEqu.m
            this.end.y = gi.Background.width
            this.end.x = newX
        } else if ((this.start.y - this.end.y) > 0) {
            // y intercept = 0
            let newX = -1 * (this.lineEqu.b / this.lineEqu.m)
            this.end.y = 0
            this.end.x = newX
        }
        const findIntersect = () => {
            let interceptList = []
            gi.Walls.forEach(wall => {
                let x = (wall.lineEqu.b - this.lineEqu.b) / (this.lineEqu.m - wall.lineEqu.m)
                let inter = (wall.lineEqu.m * x) + wall.lineEqu.b
                let isIntercept = ((inter - wall.a.y) * (inter - wall.b.y) <= 0)
                if (isIntercept) {
                    // distance = root((x2 - x1) + (y2 - y1))
                    let length = Math.sqrt(((x - this.start.x) + (inter - this.start.y))) || Math.sqrt(((this.start.x - x) + (this.start.y - inter)))
                    interceptList.push({ x, y: inter, length })
                }
            })
            // ensure intercept is in same direction as the ray
            interceptList = interceptList.filter(i => {
                let max = Math.max(...[this.start.y, this.end.y])
                let min = Math.min(...[this.start.y, this.end.y])
                return ((i.y >= min && i.y <= max)) && (((this.start.y - i.y) + (i.y - this.end.y)) === (this.start.y - this.end.y))
            }) 
            if (interceptList.length > 0) {
                // find intercept that is the closest to the starting point
                let idealIntercept = interceptList.sort((a, b) => a.length - b.length)[0]
                this.end.y = idealIntercept.y
                this.end.x = idealIntercept.x                
            }
        }
        findIntersect()
		stroke(204, 102, 0)
		line(this.start.x, this.start.y, this.end.x, this.end.y)
    }
    coordinates () {
        let max = Math.max(...[this.start.y, this.end.y])
        let min = Math.min(...[this.start.y, this.end.y])
        return ({
            length: max - min
        })
    }
}
