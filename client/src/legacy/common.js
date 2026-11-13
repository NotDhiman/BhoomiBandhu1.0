export function initCommon() {
  window.toggleTheme = window.toggleTheme || function toggleTheme() { document.body.classList.toggle("dark"); };
  window.toggleCard = window.toggleCard || function toggleCard(card) { card.classList.toggle("active"); };
}
