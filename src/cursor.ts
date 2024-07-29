const CURSOR_TIMING = 500;
const CURSOR_CLASS = "soc-cursor";
const CURSOR_VISIBLE_CLASS = "soc-cursorVisible";

export class Cursor {
	public element: HTMLDivElement;
	private interval: number;
	constructor() {
		this.element = document.createElement("div");
		this.element.addClass(CURSOR_CLASS);
		this.setInterval();
	}
	private showCursor() {
		this.element.classList.add(CURSOR_VISIBLE_CLASS);
	}
	private hideCursor() {
		this.element.classList.remove(CURSOR_VISIBLE_CLASS);
	}
	private setInterval() {
		this.showCursor();
		this.interval = window.setInterval(() => {
			this.toggleCursor();
		}, CURSOR_TIMING);
	}
	private toggleCursor() {
		this.element.classList.contains(CURSOR_VISIBLE_CLASS)
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
