// Saved Hustles Management (for saved.html)

function loadSavedHustles() {
  const savedHustlesOutput = document.getElementById("saved-hustles-output");
  const savedHustles = localStorage.getItem("savedHustles") ? JSON.parse(localStorage.getItem("savedHustles")) : [];
  if (!savedHustlesOutput) return;
  if (savedHustles.length === 0) {
    savedHustlesOutput.innerHTML = "<p>You haven't saved any hustles yet.</p>";
    return;
  }
  savedHustlesOutput.innerHTML = "";
  savedHustles.forEach(hustle => {
    const div = document.createElement("div");
    div.className = "saved-hustle";
    div.innerHTML = `<h3>${hustle.name}</h3><p>${hustle.summary}</p>`;
    savedHustlesOutput.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("saved-hustles-output")) {
    loadSavedHustles();
  }
});