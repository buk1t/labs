fetch("./projects.json")
  .then((res) => res.json())
  .then((projects) => {
    const container = document.getElementById("projects");

    projects.forEach((p) => {
      const a = document.createElement("a");
      a.href = `projects/${p.slug}/`;
      a.className = "card";

      a.innerHTML = `
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <span class="tag">${p.status}</span>
      `;

      container.appendChild(a);
    });
  })
  .catch(() => {
    document.getElementById("projects").innerHTML =
      "<p>failed to load labs</p>";
  });