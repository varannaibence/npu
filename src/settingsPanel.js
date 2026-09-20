// The panel behind the footer's "Beállítások" link: switches for modules and their
// sub-options, organized into collapsible groups.
//
// Switching takes effect on the next page load, not immediately. A module that is
// already running has registered interceptor handlers and MutationObservers that
// cannot be cleanly withdrawn, and pretending otherwise would leave half a feature
// on screen. So the panel says so, and offers to reload.
const modal = require("./modal");
const settings = require("./settings");
const tokens = require("./neptunTokens");

let registry = [];
let checkboxSequence = 0;
let descriptionSequence = 0;

// index.js hands over the list it is about to initialize, so the panel never has to
// import the modules itself - that would be a cycle.
function setRegistry(modules) {
  registry = modules.filter(module => module && module.meta && module.meta.id);
}

// Partition modules by their group. Modules without a group go to the default group.
// Returns an array of { group, modules } where group is the normalized group name or
// null for the default group.
function groupModules(modules) {
  const grouped = new Map();
  const DEFAULT_GROUP_ID = null;
  const DEFAULT_GROUP_NAME = "Funkciók";

  modules.forEach(module => {
    const groupId = (module.meta && module.meta.group && module.meta.group.id) || DEFAULT_GROUP_ID;
    const groupName = (module.meta && module.meta.group && module.meta.group.name) || DEFAULT_GROUP_NAME;

    if (!grouped.has(groupId)) {
      grouped.set(groupId, { id: groupId, name: groupName, modules: [] });
    }
    grouped.get(groupId).modules.push(module);
  });

  return Array.from(grouped.values());
}

// Reuse the live MDC checkbox when the host page exposes one. The plain input is
// deliberately kept as a fallback because this panel is also reachable on pages
// without a course checkbox.
function buildCheckbox(doc, label, checked, disabled) {
  const reference = doc.querySelector("mat-checkbox");
  const host = reference ? reference.cloneNode(true) : doc.createElement("label");
  host.setAttribute("data-npu-settings-checkbox-host", "");
  const fallbackInput = doc.createElement("input");
  const nativeInput = host.querySelector && host.querySelector("input.mdc-checkbox__native-control");
  const input = nativeInput || fallbackInput;

  if (!nativeInput) {
    input.type = "checkbox";
    input.setAttribute("aria-label", label);
    host.appendChild(input);
  } else {
    Array.from(host.querySelectorAll("[id]")).forEach(element => element.removeAttribute("id"));
    const id = `npu-settings-checkbox-${++checkboxSequence}`;
    input.id = id;
    input.removeAttribute("aria-labelledby");
    input.removeAttribute("aria-describedby");
    input.tabIndex = 0;
    input.setAttribute("aria-label", label);
    host.classList.remove("mat-mdc-checkbox-disabled", "mdc-checkbox--disabled");
    const caption = host.querySelector(".mdc-label");
    if (caption) {
      caption.htmlFor = id;
      caption.textContent = "";
    }
    const checkboxVisual = host.querySelector(".mdc-checkbox");
    const syncVisual = () => {
      host.classList.toggle("mat-mdc-checkbox-checked", input.checked);
      if (checkboxVisual) {
        checkboxVisual.classList.toggle("mdc-checkbox--selected", input.checked);
      }
      host.setAttribute("aria-checked", String(input.checked));
    };
    input.addEventListener("change", syncVisual);
    syncVisual();
  }

  input.checked = checked;
  input.disabled = disabled;
  if (nativeInput) {
    host.classList.toggle("mat-mdc-checkbox-disabled", disabled);
    host.classList.toggle("mdc-checkbox--disabled", disabled);
    // The cloned Angular host is outside Angular's event wiring. Forward clicks
    // on its decorative box/label to the real native input.
    host.addEventListener("click", event => {
      if (event.target === input) {
        return;
      }
      event.preventDefault();
      if (!input.disabled) {
        input.click();
      }
    });
  }
  host.style.cssText = "flex:0 0 auto;margin-top:2px;";
  return { host, input };
}

function setCheckboxDisabled(host, disabled) {
  const input = host.querySelector("input[type=checkbox]");
  if (!input) {
    return;
  }
  input.disabled = disabled;
  if (input.matches(".mdc-checkbox__native-control")) {
    host.classList.toggle("mat-mdc-checkbox-disabled", disabled);
    host.classList.toggle("mdc-checkbox--disabled", disabled);
  }
}

// Render a module checkbox with optional sub-options below it.
function row(doc, module, flags, editable, onChange) {
  const meta = module.meta;
  const container = doc.createElement("div");

  const item = doc.createElement("div");
  item.style.cssText = `display:flex;gap:12px;align-items:flex-start;padding:12px 16px;margin-bottom:8px;border-radius:12px;background:${tokens.subtleSurface};cursor:pointer;`;

  const checkbox = buildCheckbox(
    doc,
    meta.name,
    settings.isEnabled(module, flags),
    Boolean(meta.required) || !editable
  );
  checkbox.input.addEventListener("change", () => {
    onChange(meta.id, checkbox.input.checked);
    // When the module toggle changes, update the disable state of all sub-options.
    if (container.optionsHost) {
      Array.from(container.optionsHost.querySelectorAll("[data-npu-settings-checkbox-host]")).forEach(host => {
        setCheckboxDisabled(host, !checkbox.input.checked || !editable);
      });
    }
  });

  const text = doc.createElement("span");
  const title = doc.createElement("span");
  const name = meta.name;
  title.textContent = meta.required ? `${name} (mindig bekapcsolva)` : name;
  title.style.cssText = "font-weight:700;display:block;";
  const desc = doc.createElement("span");
  desc.id = `npu-settings-description-${++descriptionSequence}`;
  desc.textContent = meta.description;
  desc.style.cssText = "font-size:13px;opacity:.8;display:block;margin-top:2px;";
  checkbox.input.setAttribute("aria-describedby", desc.id);
  text.appendChild(title);
  text.appendChild(desc);

  item.appendChild(checkbox.host);
  item.appendChild(text);
  container.appendChild(item);

  item.addEventListener("click", event => {
    if (event.target === checkbox.host || checkbox.host.contains(event.target)) {
      return;
    }
    if (!checkbox.input.disabled) {
      checkbox.input.click();
    }
  });

  // Render sub-options if they exist.
  if (meta.options && Array.isArray(meta.options) && meta.options.length > 0) {
    const optionsHost = doc.createElement("div");
    container.optionsHost = optionsHost;
    meta.options.forEach(option => {
      const optionRow = optionCheckbox(doc, module, option, flags, editable, !checkbox.input.checked, onChange);
      optionsHost.appendChild(optionRow);
    });
    container.appendChild(optionsHost);
  }

  return container;
}

// Render a sub-option checkbox, indented under its parent module.
function optionCheckbox(doc, module, option, flags, editable, parentDisabled, onChange) {
  const meta = module.meta;
  const optionKey = `${meta.id}.${option.id}`;

  const item = doc.createElement("div");
  item.style.cssText =
    `display:flex;gap:12px;align-items:flex-start;padding:8px 16px 8px 48px;margin-bottom:4px;border-radius:8px;` +
    `background:rgba(242,243,251,.5);background:color-mix(in srgb, ${tokens.subtleSurface} 50%, transparent);` +
    "cursor:pointer;font-size:13px;";

  const checkbox = buildCheckbox(
    doc,
    option.name,
    settings.isOptionEnabled(module, option, flags),
    parentDisabled || !editable
  );
  checkbox.input.addEventListener("change", () => onChange(optionKey, checkbox.input.checked));

  const text = doc.createElement("span");
  const title = doc.createElement("span");
  const optionName = option.name;
  title.textContent = optionName;
  title.style.cssText = "font-weight:600;display:block;";
  const desc = option.description ? doc.createElement("span") : null;
  if (desc) {
    desc.id = `npu-settings-description-${++descriptionSequence}`;
    desc.textContent = option.description;
    desc.style.cssText = "font-size:12px;opacity:.7;display:block;margin-top:2px;";
    checkbox.input.setAttribute("aria-describedby", desc.id);
  }
  text.appendChild(title);
  if (desc) {
    text.appendChild(desc);
  }

  item.appendChild(checkbox.host);
  item.appendChild(text);
  item.addEventListener("click", event => {
    if (event.target === checkbox.host || checkbox.host.contains(event.target)) {
      return;
    }
    if (!checkbox.input.disabled) {
      checkbox.input.click();
    }
  });
  return item;
}

function note(text) {
  const p = document.createElement("p");
  p.style.cssText =
    `margin:0 0 16px;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.45;` +
    `background:rgba(242,243,251,.14);background:color-mix(in srgb, ${tokens.subtleSurface} 14%, transparent);` +
    `color:${tokens.text};` +
    "border:1px solid rgba(242,153,74,.55);";
  p.textContent = text;
  return p;
}

async function open() {
  // Unlike startup, the panel can wait for the durable GM value. This also warms
  // the synchronous cache used by managers that expose only the Promise API.
  const flags = await settings.loadFlags();
  const pending = Object.assign({}, flags);
  const canPersist = settings.canPersist();
  let dirty = false;
  let dialog = null;
  let saveError = null;
  let warningHost = null;

  // Some modules only listen to a request another one issues, so switching that one
  // off takes the listener's data with it - silently. The panel says so while the
  // user is still looking at the switch, rather than letting them find out later by
  // the feature having quietly gone missing.
  function repaintWarnings() {
    if (!warningHost) {
      return;
    }
    warningHost.textContent = "";
    settings.brokenDependencies(registry, pending).forEach(broken => {
      const needed = broken.to;
      warningHost.appendChild(note(`${broken.name}: hiányozni fog ${needed} szükséges adat.`));
    });
  }

  dialog = modal.open({
    title: "Beállítások",
    build(content) {
      if (!canPersist) {
        content.appendChild(
          note(
            "Ez a kezelő nem ad írható tárhelyet az NPU-nak, ezért a kapcsolók nem menthetők. " +
              "Ellenőrizd a userscript engedélyeit."
          )
        );
      }
      content.appendChild(note("A módosítás az oldal újratöltése után lép életbe."));
      saveError = note("A mentés nem sikerült. A módosítások nem vesztek el; próbáld újra.");
      saveError.hidden = true;
      content.appendChild(saveError);
      warningHost = content.ownerDocument.createElement("div");
      content.appendChild(warningHost);
      repaintWarnings();

      // Render modules grouped by their group field, with collapsible sections.
      const groups = groupModules(registry);
      groups.forEach(group => {
        // Group heading (collapsible section header)
        const groupHeading = content.ownerDocument.createElement("button");
        groupHeading.type = "button";
        const groupId = `npu.group.${group.id || "default"}.expanded`;
        let isExpanded = true;
        try {
          isExpanded = localStorage.getItem(groupId) !== "false";
        } catch (e) {
          // localStorage unavailable or blocked; default to expanded.
          isExpanded = true;
        }

        groupHeading.style.cssText =
          "padding:12px 16px;margin-top:16px;margin-bottom:8px;cursor:pointer;" +
          "font:inherit;font-weight:600;display:flex;align-items:center;gap:8px;" +
          "border:0;background:transparent;text-align:left;width:100%;" +
          `color:${tokens.text};`;

        const arrow = content.ownerDocument.createElement("span");
        arrow.textContent = isExpanded ? "▼" : "▶";
        arrow.style.cssText = "font-size:11px;display:inline-block;width:12px;text-align:center;";

        const heading = content.ownerDocument.createElement("span");
        heading.textContent = group.name;

        groupHeading.appendChild(arrow);
        groupHeading.appendChild(heading);
        groupHeading.setAttribute("aria-expanded", String(isExpanded));
        groupHeading.setAttribute("aria-controls", groupId);
        content.appendChild(groupHeading);

        // Group content container
        const groupContent = content.ownerDocument.createElement("div");
        groupContent.id = groupId;
        groupContent.style.cssText = isExpanded ? "" : "display:none;";

        group.modules.forEach(module => {
          groupContent.appendChild(
            row(content.ownerDocument, module, flags, canPersist, (id, on) => {
              dirty = true;
              pending[id] = on;
              repaintWarnings();
            })
          );
        });

        content.appendChild(groupContent);

        // Toggle group expansion on heading click
        groupHeading.addEventListener("click", () => {
          const nowExpanded = groupContent.style.display !== "none";
          groupContent.style.display = nowExpanded ? "none" : "";
          arrow.textContent = nowExpanded ? "▶" : "▼";
          groupHeading.setAttribute("aria-expanded", String(!nowExpanded));
          try {
            localStorage.setItem(groupId, nowExpanded ? "false" : "true");
          } catch (e) {
            // localStorage unavailable or blocked; silently ignore.
          }
        });
      });
    },
    actions: [
      { label: "Mégse" },
      {
        label: canPersist ? "Mentés és újratöltés" : "Újratöltés",
        primary: true,
        onClick() {
          if (!dirty || !canPersist) {
            location.reload();
            return false;
          }

          const saveButton = dialog && dialog.buttons[1];
          if (saveButton) {
            saveButton.disabled = true;
            saveButton.setAttribute("aria-busy", "true");
          }
          settings.writeFlags(settings.pruneFlags(pending, registry)).then(saved => {
            if (saved) {
              location.reload();
              return;
            }
            if (saveButton) {
              saveButton.disabled = false;
              saveButton.removeAttribute("aria-busy");
            }
            if (saveError) {
              saveError.hidden = false;
            }
          });
          // Keep the dialog visible until the durable extension write finishes, so
          // navigation cannot cancel an in-flight save.
          return false;
        },
      },
    ],
  });
}

// The footer link is measured on one institution's layout, and it is the only way
// into this panel - so at exactly the institutions where a module misbehaves, the
// switches could be unreachable. The manager's own menu does not depend on the
// page's DOM at all, so it is registered as well.
function registerMenuCommand() {
  if (typeof GM_registerMenuCommand !== "function") {
    return false;
  }
  try {
    GM_registerMenuCommand("Neptun PowerUp! beállítások", open);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { setRegistry, open, registerMenuCommand };
