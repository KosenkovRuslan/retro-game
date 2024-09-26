class Player {
	game: Game
	width: number
	height: number
	x: number
	y: number
	speed: number
	lives: number

	constructor(game: Game) {
		this.game = game
		this.width = 100
		this.height = 100
		this.x = this.game.width / 2 - this.width / 2
		this.y = this.game.height - this.height
		this.speed = 5 
		this.lives = 10
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
		const projectile = this.game.getProjectile()
		
		if (projectile) projectile.start(this.x + this.width * 0.5, this.y)		
	}

	restart() {
		this.x = this.game.width / 2 - this.width / 2
		this.y = this.game.height - this.height
		this.lives = 10
	}
}

class Projectile {
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
		this.speed = 15
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
	image: HTMLImageElement | null
	frameX: number
	frameY: number
	maxFrame: number
	lives: number
	maxLives: number
	
	constructor(game: Game, positionX: number, positionY: number) {
		this.game = game
		this.width = game.enemySize
		this.height = game.enemySize
		this.x = 0
		this.y = 0
		this.positionX = positionX
		this.positionY = positionY
		this.markForDeletion = false
		this.image = null
		this.frameX = 0
		this.frameY = 0
		this.maxFrame = 0
		this.lives = 0
		this.maxLives = 0
	}

	draw(context: CanvasRenderingContext2D) {
		if (this.image) {
			context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height)
		}
	}

	update(x: number, y: number) {
		this.x = x + this.positionX
		this.y = y + this.positionY

		this.game.projectilesPool.forEach(projectile => {
			if (!projectile.free && this.game.checkCollision(this, projectile)) {
				this.hit(1)
				projectile.reset()

				if (!this.game.gameOver) this.game.score += this.maxLives
			}
		})

		if (this.lives < 1) {
			this.frameX++
			
			if (this.frameX > this.maxFrame) this.markForDeletion = true 
		}

		if (this.game.checkCollision(this, this.game.player)) {
			this.markForDeletion = true

			if (!this.game.gameOver && this.game.score > 0) this.game.score--
			this.game.player.lives--
			if (this.game.player.lives < 1) this.game.gameOver = true
		}

		if (this.y + this.height > this.game.height) {
			this.game.gameOver = true
			this.markForDeletion = true
		}
	}

	hit(damage: number) {
		this.lives -= damage
	}
}

class BeetleMorph extends Enemy {
	image: HTMLImageElement
	constructor(game: Game, positionX: number, positionY: number) {
		super(game, positionX, positionY)
		this.image = document.getElementById("beetlemorph") as HTMLImageElement
		this.frameX = 0
		this.frameY = Math.floor(Math.random() * 4)
		this.maxFrame = 2
		this.lives = 1    
		this.maxLives = this.lives
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
	nextWaveTrigger: boolean

	constructor(game: Game) {
		this.game = game
		this.width = this.game.columns * this.game.enemySize
		this.height = this.game.rows * this.game.enemySize
		this.x = this.game.width * 0.5 - this.width * 0.5
		this.y = -this.height
		this.speedX = Math.random() > 0.5 ? 1 : -1
		this.speedY = 0
		this.enemies = []
		this.nextWaveTrigger = false
		this.create()
	}

	render (context: CanvasRenderingContext2D) {
		if (this.y < 0) this.y += 1
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
		
		this.enemies = this.enemies.filter(enemy => !enemy.markForDeletion)
	}

	create() {
		for (let y = 0; y < this.game.rows; y++) {
			for (let x = 0; x < this.game.columns; x++) {
				let enemyX = x * this.game.enemySize
				let enemyY = y * this.game.enemySize

				this.enemies.push(new BeetleMorph(this.game, enemyX, enemyY))
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
	projectilesPool: Projectile[]
	numberOfprojectiles: number

	fired: boolean

	columns: number
	rows: number
	enemySize: number
	waves: Wave[]
	waveCount: number

	score: number
	gameOver: boolean

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
		this.width = this.canvas.width
		this.height = this.canvas.height
		this.keys = []
		this.player = new Player(this)

		this.projectilesPool = []
		this.numberOfprojectiles = 10
		this.createProjectile()

		this.fired = false

		this.columns = 2
		this.rows = 2
		this.enemySize = 80

		this.score = 0
		this.gameOver = false

		this.waves = []
		this.waves.push(new Wave(this))
		this.waveCount = 1

		window.addEventListener("keydown", (event: KeyboardEvent) => {
			if (event.key === " " && !this.fired) this.player.shoot()
			this.fired = true
			if (event.key === "r" && this.gameOver) {
				this.restart()
			}
			if (this.keys.indexOf(event.key) === -1) this.keys.push(event.key)
		})

		window.addEventListener("keyup", (event: KeyboardEvent) => {
			this.fired = false
			const index = this.keys.indexOf(event.key)
			if (index > -1) {
				this.keys.splice(index, 1)
			}
		})
	}

	render(context: CanvasRenderingContext2D) {
		this.drawStatusText(context)
		this.player.draw(context)
		this.player.update()

		this.projectilesPool.forEach(projectile => {
			projectile.update()
			projectile.draw(context)
		})

		this.waves.forEach(wave => {
			wave.render(context)

			if (wave.enemies.length === 0 && !wave.nextWaveTrigger && !this.gameOver) {
				this.newWave()
				this.waveCount++
				wave.nextWaveTrigger = true
				this.player.lives++
			}
		})
	}

	createProjectile () {
		for (let i = 0; i < this.numberOfprojectiles; i++) {
			this.projectilesPool.push(new Projectile())
		}
	}

	getProjectile () {
		for (let i = 0; i < this.projectilesPool.length; i++) {
			if (this.projectilesPool[i].free) return this.projectilesPool[i]
		}
	}

	checkCollision (a: Enemy, b: Projectile | Player) {
		return (
			a.x < b.x + b.width &&
			a.x + a.width > b.x &&
			a.y < b.y + b.height &&
			a.height + a.y > b.y
		)
	}

	drawStatusText(context: CanvasRenderingContext2D) {
		context.save()

		context.shadowOffsetX = 2
		context.shadowOffsetY = 2
		context.shadowColor = "black"
 		context.fillText(`Счёт: ${this.score}`, 20, 40)
 		context.fillText(`Волна: ${this.waveCount}`, 20, 80)

		for (let i = 0; i < this.player.lives; i++) {
			context.fillRect(20 + 10 * i, 100, 5, 30)
		}

		if (this.gameOver) {
			context.textAlign = "center"
			context.font = "80px Impact"
			context.fillText("Игра окончена!", this.width * 0.5, this.height * 0.5)

			context.font = "20px Impact"
			context.fillText('Нажмите клавишу R для перезапуска', this.width * 0.5, this.height * 0.5 + 30)
		}
		context.restore()
	}

	newWave () {
		if (Math.random() < 0.5 && this.columns * this.enemySize < this.width * 0.8) this.columns++
		else if (this.rows * this.enemySize < this.height * 0.6) this.rows++

		this.waves.push(new Wave(this))
	}

	restart() {
		this.player.restart()

		this.columns = 2
		this.rows = 2

		this.waves = []
		this.waves.push(new Wave(this))
		this.waveCount = 1

		this.score = 0
		this.gameOver = false
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