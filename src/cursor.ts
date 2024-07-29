export class Cursor {
	public element: HTMLDivElement;
	private interval: number;

	constructor() {
		this.element = document.createElement("div");
		this.element.addClass("soc-cursor");

		this.setInterval();
	}

	private hideCursor() {
		this.element.removeClass("soc-cursor-on");
	}

	private showCursor() {
		this.element.addClass("soc-cursor-on");
	}

	private setInterval() {
		this.showCursor();
		this.interval = window.setInterval(() => {
			this.toggleCursor();
		}, 500);
	}

	private toggleCursor() {
		this.element.classList.contains("soc-cursor-on")
			? this.hideCursor()
			: this.showCursor();
	}

	reset() {
		window.clearInterval(this.interval);
		this.setInterval();
	}

	unload() {
		window.clearInterval(this.interval);
	}
}
