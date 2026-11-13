const display = document.getElementById("display");
const keys = document.querySelector(".keys");
let input = "0", first = null, operator = null, reset = false;
function render() { display.textContent = input; }
function number(n) {
  if (input === "Error" || reset) { input = n; reset = false; }
  else if (input === "0") input = n;
  else if (input.replace(/[-.]/g, "").length < 14) input += n;
  render();
}
function choose(op) {
  if (input === "Error") return;
  if (operator && !reset) calculate();
  first = Number(input); operator = op; reset = true;
}
function calculate() {
  if (operator === null || first === null || input === "Error") return;
  const second = Number(input); let result;
  if (operator === "+") result = first + second;
  if (operator === "-") result = first - second;
  if (operator === "*") result = first * second;
  if (operator === "/") result = second === 0 ? "Error" : first / second;
  input = result === "Error" ? result : String(Number(result.toPrecision(11)));
  first = null; operator = null; reset = true; render();
}
function action(name) {
  if (name === "clear") { input = "0"; first = null; operator = null; reset = false; }
  if (name === "decimal" && input !== "Error") {
    if (reset) { input = "0."; reset = false; }
    else if (!input.includes(".")) input += ".";
  }
  if (name === "sign" && input !== "0" && input !== "Error") input = input.startsWith("-") ? input.slice(1) : "-" + input;
  if (name === "percent" && input !== "Error") input = String(Number(input) / 100);
  if (name === "equals") calculate();
  render();
}
keys.addEventListener("click", event => {
  const b = event.target.closest("button"); if (!b) return;
  if (b.dataset.num !== undefined) number(b.dataset.num);
  else if (b.dataset.op) choose(b.dataset.op);
  else if (b.dataset.action) action(b.dataset.action);
});
document.addEventListener("keydown", e => {
  if (/^[0-9]$/.test(e.key)) number(e.key);
  else if (e.key === ".") action("decimal");
  else if ({"+":"+","-":"-","*":"*","/":"/"}[e.key]) choose(e.key);
  else if (e.key === "Enter" || e.key === "=") calculate();
  else if (e.key === "Escape") action("clear");
  else if (e.key === "Backspace" && !reset && input !== "Error") { input = input.length > 1 ? input.slice(0, -1) : "0"; render(); }
});
render();