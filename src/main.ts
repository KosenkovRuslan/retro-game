class Player {
	game: Game
	width: number
	height: number
	x: number
	y: number
	speed: number

	constructor(game: Game) {
		this.game = game
		this.width = 100
		this.height = 100
		this.x = this.game.width / 2 - this.width / 2
		this.y = this.game.height - this.height
		this.speed = 5 
	}

	draw(context: CanvasRenderingContext2D) {
		context.fillRect(this.x, this.y, this.width, this.height)
	}

	update() {
		if (this.game.keys.indexOf("ArrowLeft") > -1) this.x -= this.speed
		if (this.game.keys.indexOf("ArrowRight") > -1) this.x += this.speed

		if (this.x < -this.width * 0.5) this.x = -this.width * 0.5
		else if (this.x > this.game.width - this.width * 0.5) this.x = this.game.width - this.width * 0.5
	}

	shoot () {
		const projecttile = this.game.getProjecttile()
		
		if (projecttile) projecttile.start(this.x + this.width * 0.5, this.y)		
	}
}

class Projecttile {
	width: number
	height: number
	x: number
	y: number
	speed: number
	free: boolean

	constructor() {
		this.width = 8
		this.height = 40
		this.x = 0
		this.y = 0
		this.speed = 5
		this.free = true
	}

	draw (context: CanvasRenderingContext2D) {
		if (!this.free) {
			context.fillRect(this.x, this.y, this.width, this.height)
		}
	}

	update () {
		if (!this.free) this.y -= this.speed
		if (this.y < -this.height) this.reset()
	}

	start (x: number, y: number) {
		this.x = x - this.width * 0.5
		this.y = y
		this.free = false
	}

	reset () {
		this.free = true
	}
}

class Enemy {
	game: Game
	width: number
	height: number
	x: number
	y: number
	positionX: number
	positionY: number
	markForDeletion: boolean
	
	constructor(game: Game, positionX: number, positionY: number) {
		this.game = game
		this.width = game.enemySize
		this.height = game.enemySize
		this.x = 0
		this.y = 0
		this.positionX = positionX
		this.positionY = positionY
		this.markForDeletion = false
	}

	draw(context: CanvasRenderingContext2D) {
		context.strokeRect(this.x, this.y, this.width, this.height)
	}

	update(x: number, y: number) {
		this.x = x + this.positionX
		this.y = y + this.positionY

		this.game.projecttilesPool.forEach(projecttile => {
			if (!projecttile.free && this.game.checkCollision(this, projecttile)) {
				this.markForDeletion = true
				projecttile.reset()
			}
		})
	}
}

class Wave {
	game: Game
	width: number
	height: number
	x: number
	y: number
	speedX: number
	speedY: number
	enemies: Enemy[]

	constructor(game: Game) {
		this.game = game
		this.width = this.game.columns * this.game.enemySize
		this.height = this.game.rows * this.game.enemySize
		this.x = 0
		this.y = -this.height
		this.speedX = 1
		this.speedY = 0
		this.enemies = []
		this.create()
	}

	render (context: CanvasRenderingContext2D) {
		if (this.y < 0) this.y += 5
		this.speedY = 0

		if (this.x < 0 || this.x > this.game.width - this.width) {
			this.speedX *= -1	
			this.speedY = this.game.enemySize
		}

		this.x += this.speedX
		this.y += this.speedY
		this.enemies.forEach(enemy => {
			enemy.update(this.x, this.y)
			enemy.draw(context)
		})
	}

	create() {
		for (let y = 0; y < this.game.rows; y++) {
			for (let x = 0; x < this.game.columns; x++) {
				let enemyX = x * this.game.enemySize
				let enemyY = y * this.game.enemySize

				this.enemies.push(new Enemy(this.game, enemyX, enemyY))
			}
		}
	}
}

class Game {
	canvas: HTMLCanvasElement
	width: number
	height: number
	player: Player
	keys: string[]
	projecttilesPool: Projecttile[]
	numberOfprojecttiles: number

	columns: number
	rows: number
	enemySize: number
	waves: Wave[]

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
		this.width = this.canvas.width
		this.height = this.canvas.height
		this.keys = []
		this.player = new Player(this)

		this.projecttilesPool = []
		this.numberOfprojecttiles = 10
		this.createProjecttile()

		this.columns = 4
		this.rows = 2
		this.enemySize = 60

		this.waves = []
		this.waves.push(new Wave(this))

		window.addEventListener("keydown", (event: KeyboardEvent) => {
			if (this.keys.indexOf(event.key) === -1) this.keys.push(event.key)
			if (event.key === " ") this.player.shoot()	
		})

		window.addEventListener("keyup", (event: KeyboardEvent) => {
			const index = this.keys.indexOf(event.key)
			if (index > -1) {
				this.keys.splice(index, 1)
			}
		})
	}

	render(context: CanvasRenderingContext2D) {
		this.player.draw(context)
		this.player.update()

		this.projecttilesPool.forEach(projecttile => {
			projecttile.update()
			projecttile.draw(context)
		})

		this.waves.forEach(wave => {
			wave.render(context)
		})
	}

	createProjecttile () {
		for (let i = 0; i < this.numberOfprojecttiles; i++) {
			this.projecttilesPool.push(new Projecttile())
		}
	}

	getProjecttile () {
		for (let i = 0; i < this.projecttilesPool.length; i++) {
			if (this.projecttilesPool[i].free) return this.projecttilesPool[i]
		}
	}

	checkCollision (a: Enemy, b: Projecttile) {
		return (
			a.x < b.x + b.width &&
			a.x + a.width > b.x &&
			a.y < b.y + b.height &&
			a.height + a.y > b.y
		)
	}
}

window.addEventListener("load", () => {
	const canvas = document.getElementById("app") as HTMLCanvasElement
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

	canvas.width = 600
	canvas.height = 800
	ctx.fillStyle = 'white'
	ctx.strokeStyle = 'white'
	ctx.lineWidth = 5
	ctx.font = '30px Impact'

	const game = new Game(canvas)

	const animate = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		game.render(ctx)
		window.requestAnimationFrame(animate)
	}

	animate()
})