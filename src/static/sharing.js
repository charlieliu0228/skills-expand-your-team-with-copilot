window.activitySharing = {
  createControls(name, description, schedule) {
    const activityUrl = new URL(window.location.pathname, window.location.origin);
    activityUrl.searchParams.set("activity", name);
    const url = activityUrl.href;
    const title = `${name} at Mergington High School`;
    const text = `${title}\n${description}\nSchedule: ${schedule}`;
    const controls = document.createElement("div");
    controls.className = "activity-sharing";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", `Share ${name}`);

    const label = document.createElement("span");
    label.className = "sharing-label";
    label.textContent = "Share activity:";
    controls.appendChild(label);

    const destinations = [
      ["Facebook", "https://www.facebook.com/sharer/sharer.php", { u: url }],
      ["X", "https://twitter.com/intent/tweet", { text, url }],
      ["WhatsApp", "https://wa.me/", { text: `${text}\n${url}` }],
    ];

    destinations.forEach(([label, destination, parameters]) => {
      const link = document.createElement("a");
      const shareUrl = new URL(destination);
      shareUrl.search = new URLSearchParams(parameters).toString();
      link.href = shareUrl.href;
      link.textContent = label;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `Share ${name} on ${label} (opens in a new tab)`);
      controls.appendChild(link);
    });

    const status = document.createElement("p");
    status.className = "sharing-status";
    status.setAttribute("role", "status");

    const manualLink = document.createElement("input");
    manualLink.type = "text";
    manualLink.readOnly = true;
    manualLink.value = url;
    manualLink.className = "sharing-link hidden";
    manualLink.setAttribute("aria-label", `Link to ${name}`);

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy link";
    copyButton.setAttribute("aria-label", `Copy link to ${name}`);
    copyButton.addEventListener("click", async () => {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(url);
          manualLink.classList.add("hidden");
          status.textContent = "Activity link copied!";
          return;
        } catch (error) {
          console.error("Unable to copy activity link:", error);
        }
      }

      status.textContent = "Automatic copying is unavailable. Select and copy the link below.";
      manualLink.classList.remove("hidden");
      manualLink.focus();
      manualLink.select();
    });
    controls.appendChild(copyButton);

    if (typeof navigator.share === "function") {
      const shareButton = document.createElement("button");
      shareButton.type = "button";
      shareButton.textContent = "Share...";
      shareButton.setAttribute("aria-label", `Share ${name} with another app`);
      shareButton.addEventListener("click", async () => {
        try {
          await navigator.share({ title, text, url });
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Unable to share activity:", error);
            status.textContent = "Unable to share. Try a social button or copy the link instead.";
          }
        }
      });
      controls.appendChild(shareButton);
    }

    controls.appendChild(status);
    controls.appendChild(manualLink);
    return controls;
  },
};
