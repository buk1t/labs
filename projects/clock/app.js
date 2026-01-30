let showSeconds = true;

const timeEl = document.getElementById("time");
const btn = document.getElementById("toggle");

function render() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  timeEl.textContent = showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
}

btn.addEventListener("click", () => {
  showSeconds = !showSeconds;
  render();
});

render();
setInterval(render, 250);