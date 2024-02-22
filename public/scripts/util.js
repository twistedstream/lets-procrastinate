function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function displayError(err) {
  const message = err.message || err.errorMessage || err;

  const errorMessageSection = document.querySelector("#errorMessageSection");
  const errorMessageSpan = document.querySelector("#errorMessageSpan");

  if (errorMessageSection && errorMessageSpan) {
    show(errorMessageSection);
    errorMessageSpan.innerHTML = message;
  } else {
    window.alert(message);
  }
}

function getElements(target) {
  if (typeof target === "string") {
    return document.querySelectorAll(target);
  }
  if (Array.isArray(target)) {
    return target;
  }
  return [target];
}

function show(target) {
  getElements(target).forEach((e) => (e.hidden = false));
}

function hide(target) {
  getElements(target).forEach((e) => (e.hidden = true));
}

function disable(target) {
  getElements(target).forEach((e) => (e.disabled = true));
}

function enable(target) {
  getElements(target).forEach((e) => (e.disabled = false));
}
