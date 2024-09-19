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

		if (this.x < 0) this.x = 0
		else if (this.x > this.game.width - this.width) this.x = this.game.width - this.width
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
		this.width = 5
		this.height = 10
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
	constructor() { }
}

class Game {
	canvas: HTMLCanvasElement
	width: number
	height: number
	player: Player
	keys: string[]

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
		this.width = this.canvas.width
		this.height = this.canvas.height
		this.keys = []
		this.player = new Player(this)

		window.addEventListener("keydown", (event: KeyboardEvent) => {
			if (this.keys.indexOf(event.key) === -1) {
				this.keys.push(event.key)
			}
			console.log(this.keys)
		})

		window.addEventListener("keyup", (event: KeyboardEvent) => {
			const index = this.keys.indexOf(event.key)
			if (index > -1) {
				this.keys.splice(index, 1)
			}
			console.log(this.keys)
		})
	}

	render(context: CanvasRenderingContext2D) {
		this.player.draw(context)
		this.player.update()
	}
}

window.addEventListener("load", () => {
	const canvas = document.getElementById("app") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	canvas.width = 600;
	canvas.height = 800;

	const game = new Game(canvas);

	const animate = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		game.render(ctx);
		window.requestAnimationFrame(animate);
	}

	animate()
})